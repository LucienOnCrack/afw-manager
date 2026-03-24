#!/usr/bin/env python3
"""
Extract ALL wizard step data for every item type by using the GoToStep endpoint.
For each item type: initiate order creation, then fetch each wizard step's HTML,
parse all form elements, selects, radios, checkboxes, hidden inputs, and inline data.
"""
import json, os, re, subprocess, sys, time

COOKIE = "ASP.NET_SessionId=rdempuqzao31qtpmfysbsjgu; MunroShopSitesFormAuthentication=EFA9F26E5ADEDFEBCEDA01DE586019E43AC4F832A479B7F3050CC1BEBAF9FF4A9C86866C08704E3B5A8D93BF31FD923E2AFB0F90FEFE07551E054ED04C5CFE4A0C6971386B312D9F221E7C595F5689F6E9262954282E6A57F8AD1229051A5C6D858BF4ED645C1BE784AE83E5EE5E10033DFB29AC"
BASE = "https://gocreate.nu"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gocreate-wizard")
os.makedirs(OUT_DIR, exist_ok=True)

CUSTOMER_ID = 503549

def curl_get(url, timeout=20):
    if not url.startswith("http"):
        url = BASE + url
    try:
        r = subprocess.run(
            ["curl", "-s", "-L", "--max-time", str(timeout), "--connect-timeout", "10",
             "-H", f"Cookie: {COOKIE}",
             "-H", "X-Requested-With: XMLHttpRequest",
             url],
            capture_output=True, text=True, timeout=timeout + 10
        )
        return r.stdout
    except:
        return ""

def curl_post(url, data="", timeout=20, as_json=False):
    if not url.startswith("http"):
        url = BASE + url
    headers = ["-H", f"Cookie: {COOKIE}", "-H", "X-Requested-With: XMLHttpRequest"]
    if as_json:
        headers.extend(["-H", "Content-Type: application/json"])
    else:
        headers.extend(["-H", "Content-Type: application/x-www-form-urlencoded"])
    try:
        r = subprocess.run(
            ["curl", "-s", "-L", "--max-time", str(timeout), "--connect-timeout", "10",
             "-X", "POST"] + headers + ["-d", data, url],
            capture_output=True, text=True, timeout=timeout + 10
        )
        return r.stdout
    except:
        return ""

def parse_html_elements(html_content):
    """Extract all form elements from HTML content."""
    result = {}
    
    # All select elements with their options
    selects = {}
    for m in re.finditer(r'<select[^>]*?(?:id|name)=["\']([^"\']+)["\'][^>]*>(.*?)</select>', html_content, re.DOTALL):
        sel_id = m.group(1)
        sel_body = m.group(2)
        options = []
        for om in re.finditer(r'<option\s+value=["\']([^"\']*)["\'][^>]*>(.*?)</option>', sel_body, re.DOTALL):
            text = re.sub(r'<[^>]+>', '', om.group(2)).strip()
            selected = 'selected' in om.group(0).split('>')[0]
            options.append({"value": om.group(1), "text": text, "selected": selected})
        if options:
            selects[sel_id] = options
    result["selects"] = selects
    
    # All hidden inputs
    hiddens = {}
    for m in re.finditer(r'<input[^>]*type=["\']hidden["\'][^>]*/?\s*>', html_content):
        tag = m.group(0)
        name = re.search(r'(?:name|id)=["\']([^"\']+)["\']', tag)
        val = re.search(r'value=["\']([^"\']*)["\']', tag)
        if name:
            hiddens[name.group(1)] = val.group(1) if val else ""
    result["hiddens"] = hiddens
    
    # All radio buttons
    radios = {}
    for m in re.finditer(r'<input[^>]*type=["\']radio["\'][^>]*/?\s*>', html_content):
        tag = m.group(0)
        name = re.search(r'name=["\']([^"\']+)["\']', tag)
        val = re.search(r'value=["\']([^"\']+)["\']', tag)
        checked = 'checked' in tag
        data_attrs = dict(re.findall(r'data-([a-z-]+)=["\']([^"\']*)["\']', tag))
        if name and val:
            rname = name.group(1)
            if rname not in radios:
                radios[rname] = []
            radios[rname].append({"value": val.group(1), "checked": checked, **data_attrs})
    result["radios"] = radios
    
    # All checkboxes
    checkboxes = {}
    for m in re.finditer(r'<input[^>]*type=["\']checkbox["\'][^>]*/?\s*>', html_content):
        tag = m.group(0)
        name = re.search(r'(?:name|id)=["\']([^"\']+)["\']', tag)
        val = re.search(r'value=["\']([^"\']+)["\']', tag)
        checked = 'checked' in tag
        if name:
            checkboxes[name.group(1)] = {"value": val.group(1) if val else "", "checked": checked}
    result["checkboxes"] = checkboxes
    
    # All text/number inputs
    text_inputs = {}
    for m in re.finditer(r'<input[^>]*type=["\'](?:text|number)["\'][^>]*/?\s*>', html_content):
        tag = m.group(0)
        name = re.search(r'(?:name|id)=["\']([^"\']+)["\']', tag)
        val = re.search(r'value=["\']([^"\']*)["\']', tag)
        placeholder = re.search(r'placeholder=["\']([^"\']*)["\']', tag)
        if name:
            text_inputs[name.group(1)] = {
                "value": val.group(1) if val else "",
                "placeholder": placeholder.group(1) if placeholder else ""
            }
    result["text_inputs"] = text_inputs
    
    # All textareas
    textareas = {}
    for m in re.finditer(r'<textarea[^>]*(?:name|id)=["\']([^"\']+)["\'][^>]*>(.*?)</textarea>', html_content, re.DOTALL):
        textareas[m.group(1)] = m.group(2).strip()
    result["textareas"] = textareas
    
    # Inline JSON data in script tags
    inline_data = {}
    for m in re.finditer(r'<script[^>]*>(.*?)</script>', html_content, re.DOTALL):
        script = m.group(1)
        # Look for variable assignments with JSON
        for vm in re.finditer(r'(?:var|const|let)\s+(\w+)\s*=\s*((?:\[[\s\S]*?\]|\{[\s\S]*?\})\s*;)', script):
            vname = vm.group(1)
            vval = vm.group(2).rstrip(';').strip()
            try:
                parsed = json.loads(vval)
                inline_data[vname] = parsed
            except:
                if len(vval) > 20:
                    inline_data[vname] = f"(unparsed: {vval[:100]})"
        
        # Look for simple string/number assignments
        for vm in re.finditer(r'(?:var|const|let)\s+(\w+)\s*=\s*["\']([^"\']+)["\'];', script):
            inline_data[vm.group(1)] = vm.group(2)
        for vm in re.finditer(r'(?:var|const|let)\s+(\w+)\s*=\s*(\d+)\s*;', script):
            inline_data[vm.group(1)] = int(vm.group(2))
    result["inline_data"] = inline_data
    
    # Data attributes on any element
    data_attrs = {}
    for m in re.finditer(r'data-([a-z][a-z0-9-]+)=["\']([^"\']*)["\']', html_content):
        key = m.group(1)
        val = m.group(2)
        if key not in data_attrs:
            data_attrs[key] = set()
        data_attrs[key].add(val)
    result["data_attributes"] = {k: sorted(v) for k, v in data_attrs.items()}
    
    return result

# Item type categories from previous extraction
ITEM_TYPES = [
    {"name": "Formal suits & Jacket", "catId": 1, "typeId": 1},
    {"name": "Informal suits & Jacket", "catId": 2, "typeId": 1},
    {"name": "Trousers", "catId": 3, "typeId": 1},
    {"name": "Shirts", "catId": 4, "typeId": 2},
    {"name": "Outerwear", "catId": 5, "typeId": 3},
    {"name": "Shoes & Belts", "catId": 6, "typeId": 8},
    {"name": "(Bow)Ties, Pocket Squares & Cummerbunds", "catId": 7, "typeId": 9},
    {"name": "Pants", "catId": 8, "typeId": 10},
    {"name": "Knitwear", "catId": 9, "typeId": 11},
    {"name": "Vests", "catId": 10, "typeId": 12},
]

STEP_NAMES = {
    1: "PrimaryInfo",
    2: "FitAndTryOn",
    3: "FitTool",
    4: "DesignOptions",
    5: "BrandingOptions",
    6: "OrderSummary",
    7: "Finalize",
}

print("=" * 70)
print("  Wizard Step Data Extraction - All Item Types")
print("=" * 70)

# Test session first
body = curl_post("/Login/CheckIfSessionIsExpired")
if body:
    try:
        d = json.loads(body)
        print(f"\n  Session check: {d}")
        if d.get("IsSessionExpired"):
            print("  ERROR: Session is expired! Need fresh cookies.")
            sys.exit(1)
    except:
        print(f"  Session check response: {body[:200]}")

all_wizard_data = {}

for it in ITEM_TYPES:
    name = it["name"]
    cat_id = it["catId"]
    type_id = it["typeId"]
    
    print(f"\n{'=' * 70}")
    print(f"  [{name}] catId={cat_id}, typeId={type_id}")
    print(f"{'=' * 70}")
    
    # Step 0: Initiate order creation
    data = f"itemGroupId={type_id}&itemTypeCategoryId={cat_id}&productLineId=1&customerId={CUSTOMER_ID}&isSwipe=false"
    body = curl_post("/Customer/LoadCustomOrderCreationPerShop/", data)
    
    redirect_url = None
    if body and body.strip().startswith("{"):
        try:
            d = json.loads(body)
            redirect_url = d.get("RefreshURL")
        except:
            pass
    
    if not redirect_url:
        print(f"  ERROR: Could not get redirect URL. Response: {body[:200] if body else 'empty'}")
        continue
    
    print(f"  Redirect URL: {redirect_url}")
    
    # Fetch the initial wizard page (step 1 - Primary Info)
    wizard_html = curl_get(redirect_url, timeout=30)
    if not wizard_html or len(wizard_html) < 500:
        print(f"  ERROR: Could not load wizard page ({len(wizard_html) if wizard_html else 0}b)")
        continue
    
    safe_name = name.replace(" ", "_").replace("&", "and").replace("/", "_").replace("(", "").replace(")", "").replace(",", "")
    
    # Save full HTML
    with open(os.path.join(OUT_DIR, f"{safe_name}_step1_full.html"), "w") as f:
        f.write(wizard_html)
    
    # Parse step 1
    step1_data = parse_html_elements(wizard_html)
    print(f"\n  Step 1 (Primary Info):")
    print(f"    Selects: {len(step1_data['selects'])}")
    for sid, opts in step1_data["selects"].items():
        print(f"      {sid}: {len(opts)} options")
    print(f"    Hiddens: {len(step1_data['hiddens'])}")
    print(f"    Radios: {len(step1_data['radios'])}")
    print(f"    Checkboxes: {len(step1_data['checkboxes'])}")
    print(f"    Text inputs: {len(step1_data['text_inputs'])}")
    print(f"    Inline data: {len(step1_data['inline_data'])}")
    
    wizard_steps = {"step_1_PrimaryInfo": step1_data}
    
    # Now try to navigate to each subsequent step using GoToStep
    # The wizard is server-rendered - each step returns HTML via AJAX
    for step_num in range(2, 8):
        step_name = STEP_NAMES.get(step_num, f"Step{step_num}")
        print(f"\n  Step {step_num} ({step_name}):")
        
        # Try POST to GoToStep
        body = curl_get(f"/CustomOrder/GoToStep?step={step_num}")
        
        if not body or len(body) < 50:
            body = curl_post(f"/CustomOrder/GoToStep", f"step={step_num}")
        
        if body and len(body) > 100:
            is_json = body.strip().startswith("{")
            is_html = body.strip().startswith("<")
            
            step_html = ""
            if is_json:
                try:
                    d = json.loads(body)
                    step_html = d.get("MessageHtml", "")
                    if not step_html:
                        step_html = json.dumps(d)
                except:
                    step_html = body
            elif is_html:
                step_html = body
            
            if step_html and len(step_html) > 100:
                with open(os.path.join(OUT_DIR, f"{safe_name}_step{step_num}_{step_name}.html"), "w") as f:
                    f.write(step_html)
                
                step_data = parse_html_elements(step_html)
                wizard_steps[f"step_{step_num}_{step_name}"] = step_data
                
                print(f"    HTML size: {len(step_html)}b")
                print(f"    Selects: {len(step_data['selects'])}")
                for sid, opts in step_data["selects"].items():
                    print(f"      {sid}: {len(opts)} options")
                    for opt in opts[:3]:
                        print(f"        [{opt['value']}] {opt['text']}")
                    if len(opts) > 3:
                        print(f"        ... +{len(opts)-3} more")
                print(f"    Radios: {len(step_data['radios'])}")
                for rname, ropts in step_data["radios"].items():
                    print(f"      {rname}: {len(ropts)} options")
                print(f"    Hiddens: {len(step_data['hiddens'])}")
                print(f"    Checkboxes: {len(step_data['checkboxes'])}")
                print(f"    Text inputs: {len(step_data['text_inputs'])}")
            else:
                print(f"    (content too small: {len(step_html) if step_html else 0}b)")
        else:
            print(f"    (no response or error)")
    
    all_wizard_data[name] = wizard_steps
    
    # Save per-item-type data
    with open(os.path.join(OUT_DIR, f"{safe_name}_all_steps.json"), "w") as f:
        json.dump(wizard_steps, f, indent=2, default=list)
    
    time.sleep(0.5)

# Save combined data
with open(os.path.join(OUT_DIR, "all_types_all_steps.json"), "w") as f:
    json.dump(all_wizard_data, f, indent=2, default=list)

# Generate summary
print(f"\n\n{'=' * 70}")
print("  EXTRACTION SUMMARY")
print("=" * 70)

for item_name, steps in all_wizard_data.items():
    print(f"\n  {item_name}:")
    for step_key, step_data in steps.items():
        n_selects = len(step_data.get("selects", {}))
        n_hiddens = len(step_data.get("hiddens", {}))
        n_radios = len(step_data.get("radios", {}))
        n_checks = len(step_data.get("checkboxes", {}))
        n_text = len(step_data.get("text_inputs", {}))
        n_inline = len(step_data.get("inline_data", {}))
        total = n_selects + n_hiddens + n_radios + n_checks + n_text
        print(f"    {step_key}: {total} elements (sel={n_selects}, hid={n_hiddens}, rad={n_radios}, chk={n_checks}, txt={n_text}, data={n_inline})")

print(f"\n  All data saved to data/gocreate-wizard/")
print(f"\n{'=' * 70}")
print(f"  DONE")
print(f"{'=' * 70}")
