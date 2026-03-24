#!/usr/bin/env python3
"""
Phase 1: Exhaustive probe of api.gocreate.nu REST API.
Tries every plausible controller/action combination to discover ALL endpoints.
Uses curl via subprocess (no pip dependencies).
"""
import json, os, sys, subprocess, time
from concurrent.futures import ThreadPoolExecutor, as_completed

API_BASE = "https://api.gocreate.nu"
CREDS = {
    "UserName": "ANTHO_API",
    "Password": "3364f04c99e7abc03bd04eb521f4f6da",
    "AuthenticationToken": "EAAAAHo4+kCbKYt1wfaLa/hqobii9OGMfboFIRcTcwFWy7zk"
}
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gocreate-api")
os.makedirs(OUT_DIR, exist_ok=True)

def probe(endpoint, extra_data=None, timeout=8):
    data = {**CREDS}
    if extra_data:
        data.update(extra_data)
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5",
             "-w", "\n__HTTP_CODE__%{http_code}",
             "-X", "POST",
             "-H", "Content-Type: application/json",
             "-d", json.dumps(data),
             f"{API_BASE}{endpoint}"],
            capture_output=True, text=True, timeout=timeout + 5
        )
        out = r.stdout
        idx = out.rfind("__HTTP_CODE__")
        if idx == -1:
            return endpoint, 0, "", 0
        code = int(out[idx+13:].strip())
        body = out[:idx]
        return endpoint, code, body[:3000], len(body)
    except subprocess.TimeoutExpired:
        return endpoint, 0, "TIMEOUT", 0
    except Exception as e:
        return endpoint, -1, str(e)[:200], 0

CONTROLLERS = [
    "Order", "Customer", "Fabric", "Lining", "Product", "ProductPart",
    "ProductCombination", "Model", "Canvas", "Trim", "Button", "Branding",
    "BrandingPosition", "BrandingLabel", "DesignOption", "FitTool",
    "FitProfile", "Measurement", "Price", "Catalog", "Lookup", "Settings",
    "Shop", "ShopSettings", "Occasion", "Status", "SalesPerson", "Monogram",
    "ProductLine", "Atelier", "Make", "Fit", "TryOn", "TryOnSize",
    "ItemType", "ItemGroup", "Combination", "OptionCategory", "OptionValue",
    "FitAdvise", "BodyMeasurement", "FinishMeasurement", "ShopLabel",
    "Position", "Label", "Conflict", "Validation", "PriceCategory",
    "Currency", "Country", "Language", "Shipment", "Delivery",
    "LiningGroup", "LiningColor", "FabricSupplier", "Collection",
    "Season", "Stock", "Inventory", "Size", "SizeLabel",
    "Hangtag", "WashLabel", "CareLabel", "QRCode",
]

ACTIONS = [
    "Post", "Get", "GetAll", "Search", "List", "ByID", "Options",
    "Lookup", "All", "Index", "Detail", "Create", "Add", "Update",
    "GetList", "GetOptions", "GetByShop", "ByShop",
    "GetActive", "Active", "Available", "GetAvailable",
    "ForShop", "ByType", "ByPart", "ByCategory",
]

# Build probe list
endpoints = set()
for ctrl in CONTROLLERS:
    for action in ACTIONS:
        endpoints.add(f"/{ctrl}/{action}")

# Targeted extras based on what we know about GoCreate
extras = [
    "/Order/GetOrderTypes", "/Order/Types", "/Order/GetStatuses",
    "/Order/ByOrderdate", "/Order/ByOrderNumber", "/Order/ByCustomerId",
    "/ProductCombination/GetAll", "/ProductCombination/List",
    "/ProductCombination/GetByItemType", "/ProductCombination/Post",
    "/ProductPart/GetAll", "/ProductPart/GetByProductCombination",
    "/ProductPart/GetByCombination", "/ProductPart/Post",
    "/Model/GetByPart", "/Model/GetByProductPart", "/Model/Post",
    "/Canvas/GetByPart", "/Canvas/GetAll", "/Canvas/Post",
    "/Branding/GetPositions", "/Branding/GetLabels",
    "/Branding/GetByPart", "/Branding/GetByProductPart", "/Branding/Post",
    "/BrandingPosition/GetAll", "/BrandingPosition/GetByPart", "/BrandingPosition/Post",
    "/BrandingLabel/GetAll", "/BrandingLabel/GetByPosition", "/BrandingLabel/Post",
    "/DesignOption/GetByPart", "/DesignOption/GetAll", "/DesignOption/Post",
    "/FitTool/GetByPart", "/FitTool/GetAll", "/FitTool/Post",
    "/Lining/GetGroups", "/Lining/GetColors", "/Lining/Groups",
    "/Lining/Search", "/Lining/GetAll",
    "/Button/GetAll", "/Button/GetByPart", "/Button/Post",
    "/Trim/GetAll", "/Trim/Post",
    "/Make/GetAll", "/Make/GetByPart", "/Make/Post",
    "/Fit/GetAll", "/Fit/GetByPart", "/Fit/Post",
    "/TryOnSize/GetByPart", "/TryOnSize/GetAll", "/TryOnSize/Post",
    "/Occasion/GetAll", "/Occasion/List", "/Occasion/Post",
    "/SalesPerson/GetAll", "/SalesPerson/List", "/SalesPerson/Post",
    "/Price/GetCategories", "/Price/GetByFabric", "/Price/Post",
    "/Monogram/GetOptions", "/Monogram/GetFonts", "/Monogram/GetColors",
    "/Monogram/GetPositions", "/Monogram/GetLengths", "/Monogram/Post",
    "/Conflict/GetAll", "/Conflict/GetByPart", "/Conflict/Post",
    "/Measurement/GetAll", "/Measurement/GetByPart", "/Measurement/Post",
    "/FitAdvise/GetAll", "/FitAdvise/GetByPart", "/FitAdvise/Post",
    "/Fabric/Search", "/Fabric/GetAll", "/Fabric/GetCategories",
    "/Fabric/GetSuppliers",
    "/ItemType/GetAll", "/ItemType/Post", "/ItemGroup/GetAll", "/ItemGroup/Post",
    "/Shop/GetInfo", "/Shop/GetSettings", "/Shop/Settings", "/Shop/GetDetails",
    "/Settings/GetAll", "/Settings/Post",
    "/Order/GetConfig", "/Order/Config",
    "/Fabric/Suppliers", "/Fabric/Categories", "/Fabric/Seasons",
    "/Lining/Categories", "/Lining/Suppliers",
    "/Stock/Check", "/Stock/GetByFabric",
]
endpoints.update(extras)
endpoints = sorted(endpoints)

print("=" * 70)
print("  GoCreate REST API Exhaustive Probe")
print(f"  Base: {API_BASE}")
print(f"  Total endpoints to probe: {len(endpoints)}")
print("=" * 70)

# Verify credentials
sys.stdout.write("\nVerifying credentials... ")
sys.stdout.flush()
_, code, body, _ = probe("/Fabric/Post", {"PageNo": 1, "PageSize": 1, "FabricInputs": ""})
if code == 200 or (code == 400 and "FabricInputs" in body):
    print(f"OK (HTTP {code})")
else:
    print(f"FAILED (HTTP {code}): {body[:200]}")
    sys.exit(1)

print(f"\nProbing {len(endpoints)} endpoints with 10 parallel workers...\n")

hits = []
done = 0

with ThreadPoolExecutor(max_workers=10) as pool:
    futures = {pool.submit(probe, ep): ep for ep in endpoints}
    for future in as_completed(futures):
        ep, code, body, size = future.result()
        done += 1
        if done % 200 == 0:
            print(f"  [{done}/{len(endpoints)}] {len(hits)} hits so far...")

        if code == 200 and size > 10:
            body_s = body.strip()
            is_json = body_s.startswith("{") or body_s.startswith("[")
            is_not_found = '"NOT_FOUND"' in body or '"ErrorCode":"NOT_FOUND"' in body
            is_invalid_cred = '"INVALID_CREDENTIALS"' in body
            is_error_only = '"IsValidResult":false' in body and size < 200

            if is_json and not is_invalid_cred:
                tag = ""
                if is_not_found:
                    tag = " [NOT_FOUND - endpoint exists!]"
                elif is_error_only:
                    tag = " [needs params]"
                hits.append({
                    "endpoint": ep,
                    "status": code,
                    "size": size,
                    "body_preview": body[:1500],
                    "tag": tag
                })
                print(f"  HIT: {ep} -> {size}b{tag}")

print(f"\n{'=' * 70}")
print(f"  PROBE COMPLETE: {done} probed, {len(hits)} hits")
print(f"{'=' * 70}")

with open(os.path.join(OUT_DIR, "probe_hits.json"), "w") as f:
    json.dump(hits, f, indent=2)

# Deep-probe every hit
print(f"\n  Deep-probing {len(hits)} hits for full data...\n")

for hit in hits:
    ep = hit["endpoint"]
    body = hit["body_preview"]
    tag = hit["tag"]

    try:
        d = json.loads(body)
    except:
        continue

    fname = ep.replace("/", "_").strip("_") + ".json"
    with open(os.path.join(OUT_DIR, fname), "w") as f:
        json.dump(d, f, indent=2)

    if isinstance(d, dict):
        keys = list(d.keys())
        print(f"  {ep}: keys={keys[:10]}")
        for k, v in d.items():
            if isinstance(v, list) and len(v) > 0:
                print(f"    {k}: array of {len(v)}")
                if isinstance(v[0], dict):
                    print(f"      sample keys: {list(v[0].keys())[:10]}")
            elif isinstance(v, dict):
                print(f"    {k}: object with {len(v)} keys")
            elif v is not None and v != "" and v != 0:
                print(f"    {k}: {v}")
    elif isinstance(d, list):
        print(f"  {ep}: array of {len(d)}")
        if len(d) > 0 and isinstance(d[0], dict):
            print(f"    sample keys: {list(d[0].keys())[:10]}")

# Also try known working endpoints with full data
print(f"\n{'=' * 70}")
print(f"  Fetching full data from known endpoints...")
print(f"{'=' * 70}")

known_probes = [
    ("/Fabric/Post", {"PageNo": 1, "PageSize": 5, "FabricInputs": ""}),
    ("/Lining/Post", {"PageNo": 1, "PageSize": 5, "LiningInputs": ""}),
    ("/Customer/Search", {"LastName": "kinsman", "PageNo": 1, "PageSize": 10}),
    ("/Order/ByOrderdate", {"OrderDate": "2026-03-17"}),
    ("/Order/ByCustomerId", {"CustomerID": 503549, "PageNo": 1, "PageSize": 50}),
    ("/Order/ByOrderNumber", {"OrderNumber": "ANTHO.BIL.GB.2371641",
                               "WithDesignOptions": True, "WithFitTools": True,
                               "WithBrandingOptions": True, "WithMeasurements": True,
                               "WithPriceDetails": True}),
]

for ep, params in known_probes:
    _, code, body, size = probe(ep, params, timeout=15)
    if code == 200:
        try:
            d = json.loads(body)
            fname = ep.replace("/", "_").strip("_") + "_full.json"
            # For large responses we need the full body
            _, _, full_body, full_size = probe(ep, params, timeout=20)
            try:
                d_full = json.loads(full_body)
                with open(os.path.join(OUT_DIR, fname), "w") as f:
                    json.dump(d_full, f, indent=2)
                print(f"\n  {ep}: saved {fname} ({full_size}b)")
            except:
                with open(os.path.join(OUT_DIR, fname), "w") as f:
                    json.dump(d, f, indent=2)
                print(f"\n  {ep}: saved {fname} ({size}b)")

            if isinstance(d, dict):
                for k, v in d.items():
                    if isinstance(v, list):
                        print(f"    {k}: {len(v)} items")
                    elif v is not None and str(v)[:100]:
                        print(f"    {k}: {str(v)[:100]}")
        except:
            pass

print("\n\nPhase 1 COMPLETE.")
