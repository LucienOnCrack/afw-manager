#!/usr/bin/env python3
"""
Hit every known AJAX endpoint to extract ALL remaining catalog data.
Uses urllib (no pip deps). Saves raw JSON responses.
"""
import json, os, urllib.request, urllib.error, time, sys

COOKIE = "ASP.NET_SessionId=um0ei1tbctr1p0wf5t4sbdrl; MunroShopSitesFormAuthentication=26896477E61D864518EEFE147411352EB8A71AD47D5AF263675E981B2BDD071B3607C0647BDD7C9D1B344111E271AA8EDC75D935F0C0CD1826D6104003DFFF84643184FE5678F7A84E79877BD0B5A4437F16049AE5EBFD0207EECC0E8B269D7B2B7E92B254854DA650AE4B919C98EFF21792B013"
BASE = "https://gocreate.nu"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gocreate-catalog-raw")
os.makedirs(OUT, exist_ok=True)

def post(path, data="", timeout=20):
    h = {"Cookie": COOKIE, "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/x-www-form-urlencoded"}
    req = urllib.request.Request(BASE + path, data=data.encode() if data else b"", headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)[:200]

def get(path, timeout=20):
    h = {"Cookie": COOKIE, "X-Requested-With": "XMLHttpRequest"}
    req = urllib.request.Request(BASE + path, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)[:200]

def save(name, data):
    with open(os.path.join(OUT, name), "w") as f:
        if isinstance(data, (dict, list)):
            json.dump(data, f, indent=2)
        else:
            f.write(data)

def try_json(body):
    try:
        return json.loads(body)
    except:
        return None

def extract(label, method, path, data="", fname=None):
    sys.stdout.write(f"  {label}... ")
    sys.stdout.flush()
    code, body = (post(path, data) if method == "POST" else get(path))
    if code == 200 and body and len(body) > 20:
        j = try_json(body)
        if j is not None:
            n = fname or (path.replace("/", "_").strip("_") + ".json")
            save(n, j)
            sz = len(body)
            if isinstance(j, list):
                print(f"OK {sz}b, array[{len(j)}]")
            elif isinstance(j, dict):
                print(f"OK {sz}b, keys={list(j.keys())[:5]}")
            else:
                print(f"OK {sz}b")
            return j
        elif "<html" not in body[:200].lower():
            n = fname or (path.replace("/", "_").strip("_") + ".txt")
            save(n, body)
            print(f"OK {len(body)}b (text)")
            return body
        else:
            print(f"HTML page ({len(body)}b)")
            return None
    else:
        print(f"HTTP {code}, {len(body) if body else 0}b")
        return None

# Known product parts, makes, fits, ateliers from previous extraction
PARTS = [1, 2, 3, 4, 5, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 31, 32, 33, 36, 37, 38, 40, 41]
MAKES = [1, 7, 8, 9, 11, 12]
FITS = [38, 39, 41]
ATELIERS = [1, 3, 15, 16, 17, 19, 20, 22, 23]

print("=" * 60)
print("  GoCreate Full Catalog Extraction")
print("=" * 60)

# Test session
code, body = post("/Login/CheckIfSessionIsExpired")
j = try_json(body)
if j and j.get("IsSessionExpired"):
    print("\n  SESSION EXPIRED! Need fresh cookies.")
    sys.exit(1)
print(f"\n  Session: {'OK' if j else f'HTTP {code}'}")

# ============================================================
print(f"\n{'='*60}\n  1. ShopSettings endpoints\n{'='*60}")

extract("GetProductMakeAndFits", "GET", "/ShopSettings/GetProductMakeAndFits", fname="product_make_and_fits.json")
extract("GetProductLineMakeAndFits", "GET", "/ShopSettings/GetProductLineMakeAndFits", fname="product_line_make_and_fits.json")
extract("GetProductFits", "GET", "/ShopSettings/GetProductFits", fname="product_fits.json")

# Design options for a sample combo
extract("GetDesignOptions (jacket,make8,fit38,atelier1)", "POST", "/ShopSettings/GetDesignOptions",
        "productPartId=1&productMakeId=8&productFitId=38&atelierId=1", "design_options_sample.json")

# Fit tools for a sample
extract("GetFitTools (part1,fit38)", "POST", "/ShopSettings/GetFitTools",
        "productPartId=1&productFitId=38", "fit_tools_sample.json")

# Branding
extract("GetBrandingSettings", "POST", "/ShopSettings/GetBrandingSettings")
extract("GetBrandingPositions", "POST", "/ShopSettings/GetBrandingPositions")
extract("GetBrandingLabels", "POST", "/ShopSettings/GetBrandingLabels")

# Try with part IDs
for pid in [1, 2, 3, 4, 5]:
    extract(f"GetBrandingSettings part={pid}", "POST", "/ShopSettings/GetBrandingSettings",
            f"productPartId={pid}", f"branding_settings_part{pid}.json")
    extract(f"GetBrandingPositions part={pid}", "POST", "/ShopSettings/GetBrandingPositions",
            f"productPartId={pid}", f"branding_positions_part{pid}.json")
    extract(f"GetBrandingLabels part={pid}", "POST", "/ShopSettings/GetBrandingLabels",
            f"productPartId={pid}", f"branding_labels_part{pid}.json")

# Monogram
extract("GetMonogramSettings", "POST", "/ShopSettings/GetMonogramSettings")
for pid in [1, 2, 3, 4]:
    extract(f"GetMonogramSettings part={pid}", "POST", "/ShopSettings/GetMonogramSettings",
            f"productPartId={pid}", f"monogram_part{pid}.json")

# Other settings
extract("GetShipmentSettings", "POST", "/ShopSettings/GetShipmentSettings")
extract("GetMakeSettings", "POST", "/ShopSettings/GetMakeSettings")
extract("GetFitSettings", "POST", "/ShopSettings/GetFitSettings")
extract("GetProductSettings", "POST", "/ShopSettings/GetProductSettings")
extract("GetPriceSettings", "POST", "/ShopSettings/GetPriceSettings")
extract("GetCustomerFieldSettings", "POST", "/ShopSettings/GetCustomerFieldSettings")
extract("GetBodyCalculationSettings", "POST", "/ShopSettings/GetBodyCalculationSettings")
extract("ValidateFitTools", "POST", "/ShopSettings/ValidateFitTools")

# ============================================================
print(f"\n{'='*60}\n  2. Customer/order creation endpoints\n{'='*60}")

extract("FillTryOnSizes (part1,fit1)", "POST", "/Customer/FillTryOnSizes",
        "productPartId=1&fitId=1", "tryon_part1_fit1.json")
extract("SelectOrder", "GET", "/Customer/SelectOrder/", fname="select_order.html")
extract("HasShopMultipleProductLine", "POST", "/Customer/HasShopMultipleProductLine/")
extract("FetchViewModelForFitToolProfileCreation", "POST", "/Customer/FetchViewModelForFitToolProfileCreation")

# ============================================================
print(f"\n{'='*60}\n  3. CustomOrder endpoints\n{'='*60}")

extract("GetNewGuid (MTM)", "GET", "/CustomOrder/GetNewGuid?productLineInternalName=MTM&itemTypeCategory=1")
extract("GetNewGuid (CUSTOMMADE)", "GET", "/CustomOrder/GetNewGuid?productLineInternalName=CUSTOMMADE&itemTypeCategory=1")
extract("GetNewGuid (DYO)", "GET", "/CustomOrder/GetNewGuid?productLineInternalName=DYO&itemTypeCategory=1")

# ============================================================
print(f"\n{'='*60}\n  4. DYO order page (has models, buttons, piping on one page)\n{'='*60}")

# Try to get DYO order creation page - it shows all options at once
extract("DyoOrder RenderPrimaryInfo", "POST", "/DyoOrder/RenderPrimaryInfo/",
        "combinationId=1", "dyo_primary_info.html")
extract("DyoOrder GetRunningInfo", "GET", "/DyoOrder/GetRunningInfo", fname="dyo_running_info.json")

# ============================================================
print(f"\n{'='*60}\n  5. Settings HTML pages (parse for dropdowns)\n{'='*60}")

# ShopSettings Index has currency, shop info
extract("ShopSettings Index", "GET", "/ShopSettings/Index", fname="settings_index.html")
# ShopSettings Items has product line config  
extract("ShopSettings Items", "GET", "/ShopSettings/Items", fname="settings_items.html")
# DesignOptions settings page
extract("ShopSettings DesignOptions", "GET", "/ShopSettings/DesignOptions", fname="settings_design_options.html")
# FitTools settings page
extract("ShopSettings FitTools", "GET", "/ShopSettings/FitTools", fname="settings_fittools.html")

# ============================================================
print(f"\n{'='*60}\n  6. Initiate order for each item type (captures wizard step 1)\n{'='*60}")

ITEM_TYPES = [
    ("Formal", 1, 1), ("Informal", 2, 1), ("Trousers", 3, 1),
    ("Shirts", 4, 2), ("Outerwear", 5, 3), ("Shoes", 6, 8),
    ("Ties", 7, 9), ("Pants", 8, 10), ("Knitwear", 9, 11), ("Vests", 10, 12),
]

for name, cat, grp in ITEM_TYPES:
    data = f"itemGroupId={grp}&itemTypeCategoryId={cat}&productLineId=1&customerId=503549&isSwipe=false"
    result = extract(f"LoadCustomOrder ({name})", "POST", "/Customer/LoadCustomOrderCreationPerShop/",
                     data, f"order_init_{name}.json")
    if result and isinstance(result, dict) and result.get("RefreshURL"):
        url = result["RefreshURL"]
        print(f"    -> Redirect: {url}")
        # Fetch the wizard page (without XHR header to get full HTML)
        h = {"Cookie": COOKIE}
        req = urllib.request.Request(BASE + url, headers=h)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                whtml = r.read().decode("utf-8", errors="replace")
                if len(whtml) > 5000:
                    save(f"wizard_{name}_step1.html", whtml)
                    print(f"    -> Saved wizard HTML: {len(whtml)}b")
                else:
                    print(f"    -> Wizard HTML too small: {len(whtml)}b")
        except Exception as e:
            print(f"    -> Error fetching wizard: {e}")
    time.sleep(0.2)

# ============================================================
print(f"\n{'='*60}\n  7. Probe remaining unknown endpoints\n{'='*60}")

probes = [
    ("POST", "/ShopSettings/GetBrandingOptions"),
    ("POST", "/ShopSettings/GetBranding"),
    ("POST", "/ShopSettings/Branding"),
    ("GET", "/ShopSettings/BrandingOptions"),
    ("GET", "/ShopSettings/Branding"),
    ("POST", "/ShopSettings/GetModelSettings"),
    ("POST", "/ShopSettings/GetCanvasSettings"),
    ("POST", "/ShopSettings/GetLiningSettings"),
    ("POST", "/ShopSettings/GetButtonSettings"),
    ("POST", "/ShopSettings/GetOccasionSettings"),
    ("POST", "/ShopSettings/GetFitAdviseSettings"),
    ("GET", "/ShopSettings/Model"),
    ("GET", "/ShopSettings/Canvas"),
    ("GET", "/ShopSettings/Button"),
    ("GET", "/ShopSettings/Occasion"),
    ("GET", "/ShopSettings/Lining"),
    ("GET", "/ShopSettings/FitAdvise"),
    ("GET", "/ShopSettings/Measurement"),
    ("GET", "/ShopSettings/BodyMeasurement"),
    ("GET", "/ShopSettings/FinishMeasurement"),
    ("POST", "/CustomOrder/GetModels"),
    ("POST", "/CustomOrder/GetCanvasOptions"),
    ("POST", "/CustomOrder/GetLiningModes"),
    ("POST", "/CustomOrder/GetButtons"),
    ("POST", "/CustomOrder/GetOccasions"),
    ("POST", "/CustomOrder/GetFitAdvise"),
    ("POST", "/CustomOrder/GetMeasurements"),
    ("GET", "/Lookup/Occasions"),
    ("GET", "/Lookup/Models"),
    ("GET", "/Lookup/Canvas"),
    ("GET", "/Lookup/Buttons"),
    ("GET", "/Lookup/LiningModes"),
    ("GET", "/Lookup/FitAdvise"),
    ("POST", "/CustomOrder/GetProductCombinations"),
    ("POST", "/CustomOrder/GetProductParts"),
    ("GET", "/CustomOrder/GetProductCombinations"),
    ("GET", "/CustomOrder/GetProductParts"),
    # Localized messages for different pages
    ("GET", "/Localized/GetClientLocalizeMessages?pageCode=ShopCustomOrderCreation&langCode=EN"),
    ("GET", "/Localized/GetClientLocalizeMessages?pageCode=ShopCustomOrderOverview&langCode=EN"),
    ("GET", "/Localized/GetClientLocalizeMessages?pageCode=ShopCustomer&langCode=EN"),
    ("GET", "/Localized/GetClientLocalizeMessages?pageCode=ShopSettings&langCode=EN"),
    ("GET", "/Localized/GetClientLocalizeMessages?pageCode=ShopDyoOrderCreation&langCode=EN"),
    ("GET", "/Localized/GetClientLocalizeMessages?pageCode=ShopShoeOrderCreation&langCode=EN"),
    ("GET", "/Localized/GetClientLocalizeMessages?pageCode=ShopTieOrderCreation&langCode=EN"),
]

for method, path in probes:
    extract(f"Probe {method} {path}", method, path)

# ============================================================
print(f"\n{'='*60}\n  8. Get ALL branding data by iterating parts\n{'='*60}")

# Try all known part IDs for branding
for pid in PARTS:
    for ep in ["GetBrandingSettings", "GetBrandingPositions", "GetBrandingLabels"]:
        result = extract(f"{ep} part={pid}", "POST", f"/ShopSettings/{ep}",
                        f"productPartId={pid}", f"{ep.lower()}_part{pid}.json")
        if result:
            break  # if one works, the others will too for this pattern
    time.sleep(0.05)

# ============================================================
print(f"\n{'='*60}\n  DONE - checking what we got\n{'='*60}")

files = os.listdir(OUT)
json_files = [f for f in files if f.endswith('.json')]
html_files = [f for f in files if f.endswith('.html')]
print(f"\n  JSON files: {len(json_files)}")
print(f"  HTML files: {len(html_files)}")
for f in sorted(json_files):
    sz = os.path.getsize(os.path.join(OUT, f))
    print(f"    {f}: {sz}b")
