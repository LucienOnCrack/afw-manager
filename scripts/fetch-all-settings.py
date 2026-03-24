#!/usr/bin/env python3
"""
Fetch ALL ShopSettings pages and sub-pages from GoCreate.
Parse HTML for select elements, tables, hidden inputs, JS variables.
Save structured JSON for each page.
"""
import subprocess, json, re, os, sys
from html.parser import HTMLParser

COOKIE = "ASP.NET_SessionId=um0ei1tbctr1p0wf5t4sbdrl; MunroShopSitesFormAuthentication=26896477E61D864518EEFE147411352EB8A71AD47D5AF263675E981B2BDD071B3607C0647BDD7C9D1B344111E271AA8EDC75D935F0C0CD1826D6104003DFFF84643184FE5678F7A84E79877BD0B5A4437F16049AE5EBFD0207EECC0E8B269D7B2B7E92B254854DA650AE4B919C98EFF21792B013"
BASE = "https://gocreate.nu"
OUT = "/Users/lucien/poopy doopy fabric dookie/data/gocreate-settings"
os.makedirs(OUT, exist_ok=True)

def curl_get(path, timeout=15):
    url = f"{BASE}{path}" if path.startswith("/") else path
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5",
             "-H", f"Cookie: {COOKIE}",
             "-H", "X-Requested-With: XMLHttpRequest",
             url],
            capture_output=True, text=True, timeout=timeout+5
        )
        return r.stdout
    except:
        return ""

def curl_post(path, data="", timeout=15):
    url = f"{BASE}{path}" if path.startswith("/") else path
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5",
             "-X", "POST",
             "-H", f"Cookie: {COOKIE}",
             "-H", "X-Requested-With: XMLHttpRequest",
             "-H", "Content-Type: application/x-www-form-urlencoded",
             "-d", data,
             url],
            capture_output=True, text=True, timeout=timeout+5
        )
        return r.stdout
    except:
        return ""

def save(name, content):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        f.write(content)
    return len(content)

def is_error(html):
    return "Runtime Error" in html or len(html) < 500

class SelectParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.selects = []
        self.hiddens = []
        self.tables = []
        self.in_select = False
        self.in_option = False
        self.in_table = False
        self.in_td = False
        self.in_th = False
        self.current_select = None
        self.current_option = None
        self.current_table = None
        self.current_row = []
        self.current_cell = ""
        self.text_buf = ""
        self.js_blocks = []
        self.in_script = False
        self.script_buf = ""

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        if tag == "select":
            self.in_select = True
            self.current_select = {"id": ad.get("id",""), "name": ad.get("name",""), "class": ad.get("class",""), "options": []}
        elif tag == "option" and self.in_select:
            self.in_option = True
            data_attrs = {k:v for k,v in attrs if k.startswith("data-")}
            self.current_option = {"value": ad.get("value",""), "selected": "selected" in ad, "data": data_attrs, "text": ""}
        elif tag == "input" and ad.get("type") == "hidden":
            self.hiddens.append({"id": ad.get("id",""), "name": ad.get("name",""), "value": ad.get("value","")})
        elif tag == "table":
            self.in_table = True
            self.current_table = {"id": ad.get("id",""), "class": ad.get("class",""), "headers": [], "rows": []}
        elif tag == "th" and self.in_table:
            self.in_th = True
            self.current_cell = ""
        elif tag == "td" and self.in_table:
            self.in_td = True
            self.current_cell = ""
        elif tag == "tr" and self.in_table:
            self.current_row = []
        elif tag == "script":
            self.in_script = True
            self.script_buf = ""

    def handle_endtag(self, tag):
        if tag == "select":
            self.in_select = False
            if self.current_select:
                self.selects.append(self.current_select)
            self.current_select = None
        elif tag == "option" and self.in_option:
            self.in_option = False
            if self.current_option and self.current_select:
                self.current_select["options"].append(self.current_option)
            self.current_option = None
        elif tag == "th":
            self.in_th = False
            if self.in_table and self.current_table is not None:
                self.current_table["headers"].append(self.current_cell.strip())
        elif tag == "td":
            self.in_td = False
            self.current_row.append(self.current_cell.strip())
        elif tag == "tr" and self.in_table:
            if self.current_row and self.current_table is not None:
                self.current_table["rows"].append(self.current_row)
            self.current_row = []
        elif tag == "table":
            self.in_table = False
            if self.current_table:
                self.tables.append(self.current_table)
            self.current_table = None
        elif tag == "script":
            self.in_script = False
            if self.script_buf.strip():
                self.js_blocks.append(self.script_buf)
            self.script_buf = ""

    def handle_data(self, data):
        if self.in_option and self.current_option:
            self.current_option["text"] += data
        if self.in_td:
            self.current_cell += data
        if self.in_th:
            self.current_cell += data
        if self.in_script:
            self.script_buf += data

def parse_html(html):
    p = SelectParser()
    try:
        p.feed(html)
    except:
        pass
    js_vars = {}
    for block in p.js_blocks:
        for m in re.finditer(r'var\s+(\w+)\s*=\s*(\{[^}]+\}|\[[^\]]+\]|"[^"]*"|\'[^\']*\'|\d+)', block):
            js_vars[m.group(1)] = m.group(2)[:500]
        for m in re.finditer(r'JSON\.parse\([\'"](.+?)[\'"]\)', block):
            js_vars[f"json_parse_{len(js_vars)}"] = m.group(1)[:500]
    return {
        "selects": p.selects,
        "hiddens": p.hiddens,
        "tables": [t for t in p.tables if t["rows"] or t["headers"]],
        "js_variables": js_vars
    }

print("=" * 60)
print("  GoCreate Settings - Full Extraction")
print("=" * 60)

# Session test
test = curl_get("/Login/CheckIfSessionIsExpired")
if "true" in test.lower() or "expired" in test.lower():
    print("  WARNING: Session may be expired!")
    print(f"  Response: {test[:100]}")
else:
    print(f"  Session check: {test[:80]}")

# ALL settings pages to fetch
SETTINGS_PAGES = {
    "index": "/ShopSettings/Index",
    "items": "/ShopSettings/Items",
    "design_options": "/ShopSettings/DesignOptions",
    "fit_tools": "/ShopSettings/FitTools",
    "customer_fields": "/ShopSettings/CustomerFields",
    "body_calc": "/ShopSettings/BodyCalculation",
    "shipment": "/ShopSettings/Shipment",
    "make": "/ShopSettings/Make",
    "fit": "/ShopSettings/Fit",
    "branding": "/ShopSettings/Branding",
    "monogram": "/ShopSettings/Monogram",
    "price": "/ShopSettings/Price",
    "product": "/ShopSettings/Product",
    "currency_logo": "/ShopSettings/CurrencyAndLogo",
    "shop_employee": "/ShopSettings/ShopEmployee",
    "sales_associate": "/ShopSettings/SalesAssociate",
    "size_label": "/ShopSettings/SizeLabelSetting",
    "email_setting": "/ShopSettings/EmailSetting",
    "bm_shirt_calc": "/ShopSettings/BMShirtCalculator",
}

# R.Price pages from navigation
RPRICE_PAGES = {
    "fabric_rprice": "/ShopSettings/FabricRetailPrice",
    "lining_rprice": "/ShopSettings/LiningRetailPrice",
    "design_option_rprice": "/ShopSettings/DesignOptionRetailPrice",
    "make_rprice": "/ShopSettings/MakeRetailPrice",
    "leather_rprice": "/ShopSettings/LeatherRetailPrice",
    "wash_rprice": "/ShopSettings/WashRetailPrice",
    "big_size_rprice": "/ShopSettings/BigSizeSurchargeRetailPrice",
}

# Other potentially useful pages
OTHER_PAGES = {
    "rm_fitprofile": "/ReadyMadeFitProfile/Index",
    "tryon_advisor": "/TryOnAdvisor/Index",
    "reports": "/Reports/Index",
    "stock_fabrics": "/Stock/Fabrics",
    "stock_suits": "/Stock/Suits",
    "stock_shirts": "/Stock/Shirts",
    "stock_shoes": "/Stock/Shoes",
    "stock_lining": "/Stock/Lining",
    "stock_label": "/Stock/Label",
}

all_results = {}

print("\n" + "=" * 60)
print("  1. Fetching ALL ShopSettings pages")
print("=" * 60)

for name, path in SETTINGS_PAGES.items():
    html = curl_get(path)
    if is_error(html):
        # Try alternative URL patterns
        for alt in [path.replace("/ShopSettings/", "/ShopSetting/"), path + "/Index"]:
            html2 = curl_get(alt)
            if not is_error(html2):
                html = html2
                break
    
    sz = save(f"settings_{name}.html", html)
    err = is_error(html)
    print(f"  {name:25s} {sz:>7d}b {'ERROR' if err else 'OK'}")
    
    if not err:
        parsed = parse_html(html)
        all_results[name] = parsed
        save(f"settings_{name}_parsed.json", json.dumps(parsed, indent=2))
        sel_count = sum(len(s["options"]) for s in parsed["selects"])
        tbl_rows = sum(len(t["rows"]) for t in parsed["tables"])
        print(f"    -> {len(parsed['selects'])} selects ({sel_count} options), {len(parsed['tables'])} tables ({tbl_rows} rows), {len(parsed['hiddens'])} hiddens, {len(parsed['js_variables'])} js_vars")

print("\n" + "=" * 60)
print("  2. Fetching R.Price pages")
print("=" * 60)

for name, path in RPRICE_PAGES.items():
    html = curl_get(path)
    if is_error(html):
        for alt_suffix in ["Price", "Prices", "RPrice"]:
            base = path.rsplit("/", 1)[0]
            alt = f"{base}/{path.rsplit('/', 1)[1].replace('RetailPrice', alt_suffix)}"
            html2 = curl_get(alt)
            if not is_error(html2):
                html = html2
                break
    
    sz = save(f"rprice_{name}.html", html)
    err = is_error(html)
    print(f"  {name:25s} {sz:>7d}b {'ERROR' if err else 'OK'}")
    
    if not err:
        parsed = parse_html(html)
        all_results[f"rprice_{name}"] = parsed
        save(f"rprice_{name}_parsed.json", json.dumps(parsed, indent=2))
        sel_count = sum(len(s["options"]) for s in parsed["selects"])
        tbl_rows = sum(len(t["rows"]) for t in parsed["tables"])
        print(f"    -> {len(parsed['selects'])} selects ({sel_count} options), {len(parsed['tables'])} tables ({tbl_rows} rows)")

print("\n" + "=" * 60)
print("  3. Fetching Other pages")
print("=" * 60)

for name, path in OTHER_PAGES.items():
    html = curl_get(path)
    sz = save(f"other_{name}.html", html)
    err = is_error(html)
    print(f"  {name:25s} {sz:>7d}b {'ERROR' if err else 'OK'}")
    
    if not err:
        parsed = parse_html(html)
        all_results[f"other_{name}"] = parsed
        save(f"other_{name}_parsed.json", json.dumps(parsed, indent=2))

print("\n" + "=" * 60)
print("  4. Fetching ShopSettings AJAX endpoints with session context")
print("=" * 60)

# These AJAX endpoints need specific params - try the ones from the settings pages
# GetDesignOptions pattern: productPart=jacket&make=make8&fit=fit38&atelier=atelier1
# Let's also try POSTing with form data matching what the settings JS does

ajax_endpoints = [
    ("GetProductMakeAndFits", "productPartFilterId=0"),
    ("GetProductMakeAndFits", "productPartFilterId=1"),
    ("GetProductMakeAndFits", "productPartFilterId=2"),
    ("GetProductMakeAndFits", "productPartFilterId=3"),
    ("GetProductMakeAndFits", "productPartFilterId=4"),
    ("GetProductMakeAndFits", "productPartFilterId=5"),
    ("GetBrandingSettings", ""),
    ("GetBrandingSettings", "productPartId=1"),
    ("GetBrandingSettings", "productPartFilterId=1"),
    ("GetBrandingPositions", ""),
    ("GetBrandingPositions", "productPartId=1"),
    ("GetBrandingLabels", ""),
    ("GetBrandingLabels", "productPartId=1"),
    ("GetMonogramSettings", ""),
    ("GetMonogramSettings", "productPartId=1"),
    ("GetShipmentSettings", ""),
    ("GetMakeSettings", ""),
    ("GetMakeSettings", "productPartFilterId=0"),
    ("GetFitSettings", ""),
    ("GetFitSettings", "productPartFilterId=0"),
    ("GetProductSettings", ""),
    ("GetPriceSettings", ""),
    ("GetPriceSettings", "productPartFilterId=0"),
    ("GetCustomerFieldSettings", ""),
    ("GetBodyCalculationSettings", ""),
]

for endpoint, data in ajax_endpoints:
    result = curl_post(f"/ShopSettings/{endpoint}", data)
    sz = len(result)
    err = is_error(result) or sz < 10
    label = f"{endpoint}({data[:30]})" if data else endpoint
    print(f"  {label:50s} {sz:>7d}b {'ERROR' if err else 'OK'}")
    if not err:
        save(f"ajax_{endpoint}_{data.replace('=','').replace('&','_')[:20]}.json", result)

print("\n" + "=" * 60)
print("  5. Try fetching wizard Step 1 HTML via AJAX (with active session)")
print("=" * 60)

# First init an order to get wizard context
for item_group, name in [(1,"Formal"), (2,"Informal"), (3,"Trousers"), (4,"Shirts"), (5,"Outerwear"), (6,"Shoes"), (7,"Ties"), (8,"Pants"), (9,"Knitwear"), (10,"Vests")]:
    init = curl_post("/Customer/LoadCustomOrderCreationPerShop/", f"itemGroupId={item_group}&itemTypeCategoryId=1&productLineId=1&customerId=503549&isSwipe=false")
    try:
        j = json.loads(init)
        if j.get("Status") and j.get("RefreshURL"):
            redirect_url = j["RefreshURL"]
            # Fetch the actual wizard page
            html = curl_get(redirect_url, timeout=20)
            if not is_error(html):
                sz = save(f"wizard_{name}_full.html", html)
                parsed = parse_html(html)
                save(f"wizard_{name}_parsed.json", json.dumps(parsed, indent=2))
                sel_count = sum(len(s["options"]) for s in parsed["selects"])
                hid_count = len(parsed["hiddens"])
                tbl_rows = sum(len(t["rows"]) for t in parsed["tables"])
                print(f"  {name:15s} {sz:>7d}b - {len(parsed['selects'])} selects ({sel_count} opts), {hid_count} hiddens, {tbl_rows} tbl_rows, {len(parsed['js_variables'])} js_vars")
            else:
                # Try without XHR header
                html2 = subprocess.run(
                    ["curl", "-s", "--max-time", "20", "--connect-timeout", "5",
                     "-H", f"Cookie: {COOKIE}", "-L",
                     f"{BASE}{redirect_url}"],
                    capture_output=True, text=True, timeout=25
                ).stdout
                if not is_error(html2):
                    sz = save(f"wizard_{name}_full.html", html2)
                    parsed = parse_html(html2)
                    save(f"wizard_{name}_parsed.json", json.dumps(parsed, indent=2))
                    sel_count = sum(len(s["options"]) for s in parsed["selects"])
                    print(f"  {name:15s} {sz:>7d}b (followed redirect) - {len(parsed['selects'])} selects ({sel_count} opts)")
                else:
                    print(f"  {name:15s} ERROR (redirect also failed)")
    except json.JSONDecodeError:
        print(f"  {name:15s} INIT FAILED: {init[:100]}")

print("\n" + "=" * 60)
print("  SUMMARY")
print("=" * 60)

total_selects = 0
total_options = 0
total_tables = 0
total_rows = 0
total_hiddens = 0
for name, data in all_results.items():
    s = len(data.get("selects", []))
    o = sum(len(sel["options"]) for sel in data.get("selects", []))
    t = len(data.get("tables", []))
    r = sum(len(tbl["rows"]) for tbl in data.get("tables", []))
    h = len(data.get("hiddens", []))
    total_selects += s
    total_options += o
    total_tables += t
    total_rows += r
    total_hiddens += h

print(f"  Pages with data: {len(all_results)}")
print(f"  Total selects: {total_selects} ({total_options} options)")
print(f"  Total tables: {total_tables} ({total_rows} rows)")
print(f"  Total hidden inputs: {total_hiddens}")

files = os.listdir(OUT)
print(f"\n  Files saved: {len(files)}")
for f in sorted(files):
    sz = os.path.getsize(os.path.join(OUT, f))
    if sz > 1000:
        print(f"    {f}: {sz:,}b")
