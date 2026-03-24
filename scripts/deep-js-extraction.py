#!/usr/bin/env python3
"""
Phase 3: Deep JS + AJAX extraction from GoCreate web app.
1. Download ALL JavaScript files
2. Parse for every AJAX endpoint, hardcoded option, data structure
3. Systematically hit every discovered AJAX endpoint
4. Extract complete catalog data
"""
import json, os, re, subprocess, sys, time, html
from html.parser import HTMLParser

COOKIE = "ASP.NET_SessionId=rdempuqzao31qtpmfysbsjgu; MunroShopSitesFormAuthentication=EFA9F26E5ADEDFEBCEDA01DE586019E43AC4F832A479B7F3050CC1BEBAF9FF4A9C86866C08704E3B5A8D93BF31FD923E2AFB0F90FEFE07551E054ED04C5CFE4A0C6971386B312D9F221E7C595F5689F6E9262954282E6A57F8AD1229051A5C6D858BF4ED645C1BE784AE83E5EE5E10033DFB29AC"
BASE = "https://gocreate.nu"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gocreate-deep")
os.makedirs(OUT_DIR, exist_ok=True)

def curl_get(path, timeout=15):
    url = f"{BASE}{path}" if path.startswith("/") else path
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "10",
             "-H", f"Cookie: {COOKIE}", url],
            capture_output=True, text=True, timeout=timeout + 10
        )
        return r.stdout
    except:
        return ""

def curl_post(path, data="", timeout=15, content_type="application/x-www-form-urlencoded"):
    url = f"{BASE}{path}" if path.startswith("/") else path
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "10",
             "-X", "POST",
             "-H", f"Cookie: {COOKIE}",
             "-H", f"Content-Type: {content_type}",
             "-H", "X-Requested-With: XMLHttpRequest",
             "-d", data, url],
            capture_output=True, text=True, timeout=timeout + 10
        )
        return r.stdout
    except:
        return ""

def curl_post_json(path, data_dict, timeout=15):
    url = f"{BASE}{path}" if path.startswith("/") else path
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "10",
             "-X", "POST",
             "-H", f"Cookie: {COOKIE}",
             "-H", "Content-Type: application/json",
             "-H", "X-Requested-With: XMLHttpRequest",
             "-d", json.dumps(data_dict), url],
            capture_output=True, text=True, timeout=timeout + 10
        )
        return r.stdout
    except:
        return ""

print("=" * 70)
print("  Phase 3: Deep JS + AJAX Extraction from GoCreate Web App")
print("=" * 70)

# Step 0: Test session
print("\nTesting session...")
body = curl_get("/Login/CheckIfSessionIsExpired")
print(f"  Session check: {body[:100]}")
if "true" in body.lower() or "login" in body.lower():
    print("  WARNING: Session may be expired!")

# =====================================================================
# STEP 1: Download ALL JavaScript files referenced by GoCreate pages
# =====================================================================
print(f"\n{'=' * 70}")
print("[1] Discovering and downloading all JavaScript files...")
print("=" * 70)

# Pages to scan for JS references
pages_to_scan = [
    "/CustomOrder/Index",
    "/CustomOrderOverview/Index",
    "/Customer/Detail/503549",
    "/Customer/SelectOrder",
    "/ShopSettings/Index",
    "/ShopSettings/DesignOptions",
    "/ShopSettings/FitTools",
    "/ShopSettings/BodyCalculation",
    "/ShopSettings/CustomerFields",
    "/ShopSettings/Shipment",
    "/ReadymadeOrderOverview/Index",
]

all_js_urls = set()
for page in pages_to_scan:
    print(f"  Scanning {page}...")
    html_content = curl_get(page)
    if not html_content or len(html_content) < 100:
        print(f"    (no content)")
        continue
    
    # Find <script src="..."> references
    script_refs = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html_content)
    for ref in script_refs:
        if "CustomScripts" in ref or "custom" in ref.lower() or "Page/" in ref:
            if not ref.startswith("http"):
                ref = "/" + ref.lstrip("/")
            all_js_urls.add(ref)
    
    # Find bundles
    bundle_refs = re.findall(r'src=["\'](/bundles/[^"\']+)["\']', html_content)
    for ref in bundle_refs:
        all_js_urls.add(ref)

# Also look for JS files in common patterns
known_js_paths = [
    "/Scripts/CustomScripts/ClientAppObject.js",
    "/Scripts/CustomScripts/Enums.js",
    "/Scripts/CustomScripts/Search.js",
    "/Scripts/CustomScripts/Validation.js",
    "/Scripts/CustomScripts/OpenBodyMeasurement.js",
    "/Scripts/CustomScripts/CopyOrder.js",
    "/Scripts/CustomScripts/Page/CustomOrder/CustomOrder.js",
    "/Scripts/CustomScripts/Page/DyoOrder/DyoOrder.js",
    "/Scripts/CustomScripts/Page/DyoOrder/DyoOrderEditCopy.js",
    "/Scripts/CustomScripts/Page/ShoeOrder/ShoeOrderEditCopy.js",
    "/Scripts/CustomScripts/Page/TieOrder/TieOrderEditCopy.js",
    "/Scripts/CustomScripts/Page/OrderOverview.js",
    "/Scripts/CustomScripts/Page/MunroShopLayout.js",
    "/Scripts/CustomScripts/Page/Customer/Customer.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopDesignOptionSettings.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopFittoolSettings.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopSettings.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopBodyCalculation.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopCustomerFields.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopShipment.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopBrandingSettings.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopMakeSettings.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopFitSettings.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopProductSettings.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopPriceSettings.js",
    "/Scripts/CustomScripts/Page/ShopSettings/ShopMonogramSettings.js",
    "/Scripts/CustomScripts/Page/ReadymadeOrderOverview.js",
    "/Scripts/CustomScripts/Page/CustomOrderOverview.js",
    "/Scripts/utils.js",
]
all_js_urls.update(known_js_paths)

print(f"\n  Total JS files to download: {len(all_js_urls)}")

js_dir = os.path.join(OUT_DIR, "js")
os.makedirs(js_dir, exist_ok=True)

all_js_content = {}
for js_url in sorted(all_js_urls):
    fname = js_url.replace("/", "_").strip("_")
    if not fname.endswith(".js"):
        fname += ".js"
    
    body = curl_get(js_url)
    if body and len(body) > 50 and not body.strip().startswith("<!DOCTYPE") and not body.strip().startswith("<html"):
        with open(os.path.join(js_dir, fname), "w") as f:
            f.write(body)
        all_js_content[js_url] = body
        print(f"  Downloaded: {js_url} ({len(body)}b)")
    else:
        if body and len(body) > 50:
            print(f"  SKIP (HTML): {js_url}")
        else:
            print(f"  SKIP (empty/error): {js_url}")

print(f"\n  Successfully downloaded: {len(all_js_content)} JS files")

# =====================================================================
# STEP 2: Parse ALL JS files for AJAX endpoints
# =====================================================================
print(f"\n{'=' * 70}")
print("[2] Parsing JS files for AJAX endpoints and data structures...")
print("=" * 70)

all_ajax_endpoints = []
all_hardcoded_data = []
all_enums = []

for js_url, content in all_js_content.items():
    # Find all AJAX calls: $.ajax, $.post, $.get, $.getJSON
    ajax_patterns = [
        r'url:\s*["\']([^"\']+)["\']',
        r'\$\.(?:ajax|post|get|getJSON)\s*\(\s*["\']([^"\']+)["\']',
        r'\.(?:post|get)\s*\(\s*["\']([^"\']+)["\']',
        r'fetch\s*\(\s*["\']([^"\']+)["\']',
    ]
    for pattern in ajax_patterns:
        matches = re.findall(pattern, content)
        for m in matches:
            if "/" in m and not m.startswith("http") and not m.startswith("//") and "." not in m.split("/")[-1].split("?")[0] or m.endswith(".json"):
                all_ajax_endpoints.append({"url": m, "source": js_url})
    
    # Find hardcoded arrays/objects assigned to variables
    obj_patterns = re.findall(r'var\s+(\w+)\s*=\s*(\[[\s\S]*?\];|\{[\s\S]*?\};)', content)
    for name, value in obj_patterns:
        if len(value) > 50:
            all_hardcoded_data.append({"name": name, "source": js_url, "preview": value[:200]})
    
    # Find enum-like patterns
    enum_patterns = re.findall(r'(?:var|const|let)\s+(\w+(?:Type|Status|Mode|Category|Option|Style|Fit|Make))\s*=\s*({[^}]+}|[\d]+)', content)
    for name, value in enum_patterns:
        all_enums.append({"name": name, "value": value, "source": js_url})
    
    # Find string constants that look like IDs or option values
    const_patterns = re.findall(r'(?:var|const|let)\s+(\w+(?:Id|ID|Name|Code|Label|Value))\s*=\s*["\']([^"\']+)["\']', content)
    for name, value in const_patterns:
        all_enums.append({"name": name, "value": value, "source": js_url})

# Deduplicate endpoints
seen_urls = set()
unique_endpoints = []
for ep in all_ajax_endpoints:
    if ep["url"] not in seen_urls:
        seen_urls.add(ep["url"])
        unique_endpoints.append(ep)

print(f"\n  AJAX endpoints found: {len(unique_endpoints)}")
for ep in sorted(unique_endpoints, key=lambda x: x["url"]):
    print(f"    {ep['url']}  (from {ep['source'].split('/')[-1]})")

print(f"\n  Hardcoded data structures: {len(all_hardcoded_data)}")
for d in all_hardcoded_data[:20]:
    print(f"    {d['name']}: {d['preview'][:100]}...")

print(f"\n  Enums/constants: {len(all_enums)}")
for e in all_enums:
    print(f"    {e['name']} = {e['value'][:80]}")

with open(os.path.join(OUT_DIR, "ajax_endpoints.json"), "w") as f:
    json.dump(unique_endpoints, f, indent=2)
with open(os.path.join(OUT_DIR, "hardcoded_data.json"), "w") as f:
    json.dump(all_hardcoded_data, f, indent=2)
with open(os.path.join(OUT_DIR, "enums_constants.json"), "w") as f:
    json.dump(all_enums, f, indent=2)

# =====================================================================
# STEP 3: Hit ALL discovered AJAX endpoints and known web app endpoints
# =====================================================================
print(f"\n{'=' * 70}")
print("[3] Hitting ALL AJAX endpoints for catalog data...")
print("=" * 70)

# Known web app AJAX endpoints (from JS analysis and prior work)
catalog_endpoints = [
    # ShopSettings endpoints
    {"url": "/ShopSettings/GetDesignOptions", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetFitTools", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetProductMakeAndFits", "method": "GET", "params": {}},
    {"url": "/ShopSettings/GetBrandingSettings", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetBrandingPositions", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetBrandingLabels", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetMonogramSettings", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetShipmentSettings", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetMakeSettings", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetFitSettings", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetProductSettings", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetPriceSettings", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetCustomerFieldSettings", "method": "POST", "params": {}},
    {"url": "/ShopSettings/GetBodyCalculationSettings", "method": "POST", "params": {}},
    
    # Product/catalog
    {"url": "/CustomOrder/GetProductCombinations", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetProductParts", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetItemTypes", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetMakes", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetFits", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetModels", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetCanvasOptions", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetLiningModes", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetFitAdvise", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetOccasions", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetTailors", "method": "POST", "params": {}},
    {"url": "/CustomOrder/GetNewGuid", "method": "GET", "params": {}},
    
    # Customer
    {"url": "/Customer/FillTryOnSizes", "method": "POST", "params": {"productPartId": 1, "fitId": 1}},
    {"url": "/Customer/GetCustomerFields", "method": "POST", "params": {}},
    {"url": "/Customer/SelectOrder", "method": "GET", "params": {}},
    
    # ReadymadeOrder
    {"url": "/ReadymadeOrderOverview/HasShopMultipleProductLine", "method": "POST", "params": {}},
    
    # Login
    {"url": "/Login/CheckIfSessionIsExpired", "method": "POST", "params": {}},
]

# Add all endpoints discovered from JS files
for ep in unique_endpoints:
    url = ep["url"]
    if url.startswith("/") and "?" not in url:
        catalog_endpoints.append({"url": url, "method": "POST", "params": {}, "source": ep["source"]})

# Deduplicate
seen = set()
deduped = []
for ep in catalog_endpoints:
    if ep["url"] not in seen:
        seen.add(ep["url"])
        deduped.append(ep)
catalog_endpoints = deduped

print(f"\n  Total endpoints to probe: {len(catalog_endpoints)}")

ajax_results = {}
for i, ep in enumerate(catalog_endpoints):
    url = ep["url"]
    method = ep.get("method", "POST")
    params = ep.get("params", {})
    
    sys.stdout.write(f"  [{i+1}/{len(catalog_endpoints)}] {url}... ")
    sys.stdout.flush()
    
    if method == "GET":
        body = curl_get(url)
    else:
        if params:
            body = curl_post(url, "&".join(f"{k}={v}" for k, v in params.items()))
        else:
            body = curl_post(url)
    
    if body and len(body) > 10:
        is_json = body.strip().startswith("{") or body.strip().startswith("[")
        is_html = body.strip().startswith("<!DOCTYPE") or body.strip().startswith("<html")
        
        if is_json:
            try:
                d = json.loads(body)
                fname = url.replace("/", "_").strip("_") + ".json"
                with open(os.path.join(OUT_DIR, fname), "w") as f:
                    json.dump(d, f, indent=2)
                
                size_desc = ""
                if isinstance(d, list):
                    size_desc = f"array[{len(d)}]"
                elif isinstance(d, dict):
                    size_desc = f"keys={list(d.keys())[:5]}"
                
                print(f"JSON {len(body)}b {size_desc}")
                ajax_results[url] = {"type": "json", "size": len(body), "structure": size_desc}
            except:
                print(f"invalid JSON ({len(body)}b)")
                ajax_results[url] = {"type": "invalid_json", "size": len(body)}
        elif is_html:
            fname = url.replace("/", "_").strip("_") + ".html"
            with open(os.path.join(OUT_DIR, fname), "w") as f:
                f.write(body)
            print(f"HTML {len(body)}b")
            ajax_results[url] = {"type": "html", "size": len(body)}
        else:
            print(f"text {len(body)}b: {body[:60]}")
            ajax_results[url] = {"type": "text", "size": len(body), "preview": body[:100]}
    else:
        print(f"empty/error")
        ajax_results[url] = {"type": "empty"}

with open(os.path.join(OUT_DIR, "ajax_results.json"), "w") as f:
    json.dump(ajax_results, f, indent=2)

# =====================================================================
# STEP 4: Deep extraction of ShopSettings endpoints with all param combos
# =====================================================================
print(f"\n{'=' * 70}")
print("[4] Deep extraction from ShopSettings with parameter variations...")
print("=" * 70)

# We know design options and fit tools need part/make/fit/atelier params
# Load existing data to get all parameter combinations
try:
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gocreate-web", "all_makes_fits_detailed.json")) as f:
        makes_fits = json.load(f)
except:
    makes_fits = []

# Extract unique part IDs, make IDs, fit IDs, atelier IDs
part_ids = set()
make_ids = set()
fit_ids = set()
atelier_ids = set()
for entry in makes_fits:
    part_ids.add(entry.get("partId"))
    atelier_ids.add(entry.get("atelierId"))
    for make in (entry.get("makes") or []):
        make_ids.add(make.get("makeId"))
        for fit in (make.get("fits") or []):
            fit_ids.add(fit.get("fitId"))

print(f"  Known params: parts={sorted(part_ids)}, makes={sorted(make_ids)}, fits={sorted(fit_ids)}, ateliers={sorted(atelier_ids)}")

# Get branding settings for every part
print("\n  Fetching branding per part...")
all_branding = {}
for pid in sorted(part_ids):
    body = curl_post("/ShopSettings/GetBrandingSettings", f"productPartId={pid}")
    if body and body.strip().startswith(("{", "[")):
        try:
            d = json.loads(body)
            all_branding[str(pid)] = d
            items = len(d) if isinstance(d, list) else len(d.keys()) if isinstance(d, dict) else 0
            print(f"    Part {pid}: {items} items ({len(body)}b)")
        except:
            pass
    time.sleep(0.05)

    # Also try GetBrandingPositions and GetBrandingLabels
    for ep in ["/ShopSettings/GetBrandingPositions", "/ShopSettings/GetBrandingLabels"]:
        body2 = curl_post(ep, f"productPartId={pid}")
        if body2 and body2.strip().startswith(("{", "[")):
            try:
                d2 = json.loads(body2)
                key = f"{ep.split('/')[-1]}_{pid}"
                all_branding[key] = d2
                items = len(d2) if isinstance(d2, list) else 0
                print(f"      {ep.split('/')[-1]} part {pid}: {items} items")
            except:
                pass
        time.sleep(0.05)

with open(os.path.join(OUT_DIR, "branding_all_parts.json"), "w") as f:
    json.dump(all_branding, f, indent=2)

# Get monogram settings
print("\n  Fetching monogram settings...")
for pid in sorted(part_ids):
    body = curl_post("/ShopSettings/GetMonogramSettings", f"productPartId={pid}")
    if body and len(body) > 20 and body.strip().startswith(("{", "[")):
        try:
            d = json.loads(body)
            fname = f"monogram_part_{pid}.json"
            with open(os.path.join(OUT_DIR, fname), "w") as f2:
                json.dump(d, f2, indent=2)
            print(f"    Part {pid}: {len(body)}b")
        except:
            pass
    time.sleep(0.05)

# =====================================================================
# STEP 5: Extract ALL wizard step HTML for each item type
# =====================================================================
print(f"\n{'=' * 70}")
print("[5] Loading order wizard for each item type to capture all options...")
print("=" * 70)

# Load item type categories
try:
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gocreate-web", "item_type_categories.json")) as f:
        item_types = json.load(f)
except:
    item_types = []

CUSTOMER_ID = 503549

wizard_data = {}
for it in item_types:
    name = it.get("name", "unknown")
    cat_id = it.get("catId")
    type_id = it.get("typeId")
    print(f"\n  [{name}] catId={cat_id}, typeId={type_id}")
    
    # Initiate order for this item type
    data = f"itemGroupId={type_id}&itemTypeCategoryId={cat_id}&productLineId=1&customerId={CUSTOMER_ID}&isSwipe=false"
    body = curl_post("/Customer/LoadCustomOrderCreationPerShop/", data)
    
    if body and body.strip().startswith("{"):
        try:
            d = json.loads(body)
            if d.get("RefreshURL"):
                rurl = d["RefreshURL"]
                print(f"    Redirect URL: {rurl}")
                
                wizard_html = curl_get(rurl, timeout=20)
                if wizard_html and len(wizard_html) > 1000:
                    fname = f"wizard_{name.replace(' ', '_')}.html"
                    with open(os.path.join(OUT_DIR, fname), "w") as f2:
                        f2.write(wizard_html)
                    print(f"    Saved wizard HTML: {len(wizard_html)}b")
                    
                    # Parse all selects
                    selects = re.findall(r'<select[^>]*id=["\']([^"\']*)["\'][^>]*>(.*?)</select>', wizard_html, re.DOTALL)
                    select_data = {}
                    for sel_id, sel_body in selects:
                        options = re.findall(r'<option\s+value=["\']([^"\']*)["\'][^>]*>([^<]*)</option>', sel_body)
                        if options:
                            select_data[sel_id] = [{"value": v, "text": t.strip()} for v, t in options]
                    
                    # Parse all hidden inputs
                    hiddens = re.findall(r'<input[^>]*type=["\']hidden["\'][^>]*>', wizard_html)
                    hidden_data = {}
                    for h in hiddens:
                        name_match = re.search(r'(?:name|id)=["\']([^"\']*)["\']', h)
                        val_match = re.search(r'value=["\']([^"\']*)["\']', h)
                        if name_match:
                            hidden_data[name_match.group(1)] = val_match.group(1) if val_match else ""
                    
                    # Parse all radio buttons
                    radios = re.findall(r'<input[^>]*type=["\']radio["\'][^>]*>', wizard_html)
                    radio_data = {}
                    for r_el in radios:
                        name_match = re.search(r'name=["\']([^"\']*)["\']', r_el)
                        val_match = re.search(r'value=["\']([^"\']*)["\']', r_el)
                        label_match = re.search(r'data-label=["\']([^"\']*)["\']', r_el)
                        if name_match:
                            rname = name_match.group(1)
                            if rname not in radio_data:
                                radio_data[rname] = []
                            radio_data[rname].append({
                                "value": val_match.group(1) if val_match else "",
                                "label": label_match.group(1) if label_match else ""
                            })
                    
                    # Parse all checkboxes
                    checkboxes = re.findall(r'<input[^>]*type=["\']checkbox["\'][^>]*>', wizard_html)
                    checkbox_data = {}
                    for cb in checkboxes:
                        name_match = re.search(r'(?:name|id)=["\']([^"\']*)["\']', cb)
                        val_match = re.search(r'value=["\']([^"\']*)["\']', cb)
                        if name_match:
                            checkbox_data[name_match.group(1)] = val_match.group(1) if val_match else ""
                    
                    # Parse inline JavaScript variables
                    js_vars = {}
                    js_var_patterns = re.findall(r'var\s+(\w+)\s*=\s*(?:(["\'][^"\']*["\'])|(\d+)|(\{[^}]+\})|(\[[^\]]+\]))', wizard_html)
                    for match in js_var_patterns:
                        vname = match[0]
                        vval = match[1] or match[2] or match[3] or match[4]
                        if vval:
                            js_vars[vname] = vval.strip("'\"")
                    
                    wizard_data[name] = {
                        "selects": select_data,
                        "hiddens": hidden_data,
                        "radios": radio_data,
                        "checkboxes": checkbox_data,
                        "js_vars": js_vars,
                        "html_size": len(wizard_html),
                    }
                    
                    print(f"    Selects: {len(select_data)}, Hiddens: {len(hidden_data)}, Radios: {len(radio_data)}, Checkboxes: {len(checkbox_data)}, JS vars: {len(js_vars)}")
                    
                    # Print select details
                    for sel_id, opts in select_data.items():
                        print(f"      SELECT '{sel_id}': {len(opts)} options")
                        for opt in opts[:5]:
                            print(f"        [{opt['value']}] {opt['text']}")
                        if len(opts) > 5:
                            print(f"        ... and {len(opts)-5} more")
        except Exception as e:
            print(f"    Error: {e}")
    else:
        print(f"    Response: {body[:200] if body else 'empty'}")
    
    time.sleep(0.2)

with open(os.path.join(OUT_DIR, "wizard_data_all_types.json"), "w") as f:
    json.dump(wizard_data, f, indent=2)

# =====================================================================
# STEP 6: Extract from key HTML pages (Settings pages have catalog data)
# =====================================================================
print(f"\n{'=' * 70}")
print("[6] Extracting catalog data from Settings HTML pages...")
print("=" * 70)

settings_pages = [
    "/ShopSettings/Index",
    "/ShopSettings/DesignOptions",
    "/ShopSettings/FitTools",
    "/ShopSettings/BodyCalculation",
    "/ShopSettings/CustomerFields",
    "/ShopSettings/Shipment",
    "/ShopSettings/BrandingOptions",
    "/ShopSettings/Branding",
    "/ShopSettings/Make",
    "/ShopSettings/Fit",
    "/ShopSettings/Product",
    "/ShopSettings/Price",
    "/ShopSettings/Monogram",
]

for page in settings_pages:
    print(f"\n  {page}...")
    body = curl_get(page, timeout=20)
    if body and len(body) > 100:
        is_html = "<html" in body[:500].lower() or "<!doctype" in body[:100].lower()
        fname = page.replace("/", "_").strip("_")
        
        if is_html:
            with open(os.path.join(OUT_DIR, fname + ".html"), "w") as f:
                f.write(body)
            print(f"    Saved HTML: {len(body)}b")
            
            # Extract selects from settings pages
            selects = re.findall(r'<select[^>]*id=["\']([^"\']*)["\'][^>]*>(.*?)</select>', body, re.DOTALL)
            for sel_id, sel_body in selects:
                options = re.findall(r'<option\s+value=["\']([^"\']*)["\'][^>]*>([^<]*)</option>', sel_body)
                if options and len(options) > 1:
                    print(f"    SELECT '{sel_id}': {len(options)} options")
            
            # Extract data from inline scripts
            inline_scripts = re.findall(r'<script[^>]*>(.*?)</script>', body, re.DOTALL)
            for script in inline_scripts:
                if len(script) > 100:
                    # Look for data assignments
                    data_assigns = re.findall(r'(?:var|const|let)\s+(\w+)\s*=\s*([\[{][\s\S]*?[}\]]);', script)
                    for dname, dval in data_assigns:
                        if len(dval) > 50:
                            try:
                                parsed = json.loads(dval)
                                dfname = f"inline_data_{page.split('/')[-1]}_{dname}.json"
                                with open(os.path.join(OUT_DIR, dfname), "w") as f:
                                    json.dump(parsed, f, indent=2)
                                print(f"    Inline JS data: {dname} -> {dfname}")
                            except:
                                pass
        else:
            try:
                d = json.loads(body)
                with open(os.path.join(OUT_DIR, fname + ".json"), "w") as f:
                    json.dump(d, f, indent=2)
                print(f"    Saved JSON: {len(body)}b")
            except:
                with open(os.path.join(OUT_DIR, fname + ".txt"), "w") as f:
                    f.write(body)
                print(f"    Saved text: {len(body)}b")
    else:
        print(f"    empty/error")

# =====================================================================
# STEP 7: Comprehensive summary
# =====================================================================
print(f"\n{'=' * 70}")
print("[7] Generating comprehensive extraction summary...")
print("=" * 70)

summary = {
    "js_files_downloaded": len(all_js_content),
    "ajax_endpoints_discovered": len(unique_endpoints),
    "ajax_results": {url: info["type"] for url, info in ajax_results.items()},
    "wizard_types_processed": len(wizard_data),
    "wizard_data_summary": {},
}

for name, data in wizard_data.items():
    summary["wizard_data_summary"][name] = {
        "selects": len(data.get("selects", {})),
        "hiddens": len(data.get("hiddens", {})),
        "radios": len(data.get("radios", {})),
        "checkboxes": len(data.get("checkboxes", {})),
        "js_vars": len(data.get("js_vars", {})),
    }

with open(os.path.join(OUT_DIR, "extraction_summary.json"), "w") as f:
    json.dump(summary, f, indent=2)

print(f"\n  All data saved to data/gocreate-deep/")
print(f"\n{'=' * 70}")
print(f"  Phase 3 COMPLETE")
print(f"{'=' * 70}")
