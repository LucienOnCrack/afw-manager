#!/usr/bin/env python3
"""
Extract FitTool section groupings from the GoCreate order wizard.
Uses the same flow as extract-wizard-steps.py: init order → navigate to FitTools step.
"""
import json, os, re, subprocess, sys, time
from html.parser import HTMLParser

COOKIE = "ASP.NET_SessionId=um0ei1tbctr1p0wf5t4sbdrl; MunroShopSitesFormAuthentication=43919B86F68EB426F5A8658C367A0896B18C3A85FEB642BE2D8027E8620E7942D1E8984095BA7580AE99736E2370FA486263D056DB1D2C335717928BED1B4031DA321E60C35746E3382A0935BAC19C862C77E75D9CF7BFBF513EE9530A131323A8ECE503ECFB70E2A5742E8DFFBE2E59606EB00B"
BASE = "https://gocreate.nu"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gocreate-wizard")
os.makedirs(OUT_DIR, exist_ok=True)

CUSTOMER_ID = 407411  # From customer search

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

# Check session
body = curl_post("/Login/CheckIfSessionIsExpired")
try:
    d = json.loads(body)
    if d.get("IsSessionExpired"):
        print("ERROR: Session expired!")
        sys.exit(1)
    print(f"Session OK: {d}")
except:
    print(f"Session check: {body[:200]}")

ITEM_TYPES = [
    {"name": "Formal suits & Jacket", "catId": 1, "typeId": 1},
    {"name": "Informal suits & Jacket", "catId": 2, "typeId": 1},
    {"name": "Trousers", "catId": 3, "typeId": 1},
    {"name": "Shirts", "catId": 4, "typeId": 2},
    {"name": "Outerwear", "catId": 5, "typeId": 3},
    {"name": "Pants", "catId": 8, "typeId": 10},
    {"name": "Knitwear", "catId": 9, "typeId": 11},
    {"name": "Vests", "catId": 10, "typeId": 12},
]

all_sections = {}

for it in ITEM_TYPES:
    name = it["name"]
    cat_id = it["catId"]
    type_id = it["typeId"]
    
    print(f"\n{'='*60}")
    print(f"  {name} (cat={cat_id}, type={type_id})")
    print(f"{'='*60}")
    
    # Init order creation for this customer
    data = f"itemGroupId={type_id}&itemTypeCategoryId={cat_id}&productLineId=1&customerId={CUSTOMER_ID}&isSwipe=false"
    body = curl_post("/Customer/LoadCustomOrderCreationPerShop/", data)
    
    redirect_url = None
    if body and body.strip().startswith("{"):
        try:
            d = json.loads(body)
            redirect_url = d.get("RefreshURL")
            print(f"  Redirect: {redirect_url}")
        except:
            pass
    
    if not redirect_url:
        print(f"  ERROR: No redirect. Response: {body[:300] if body else 'empty'}")
        continue
    
    # Load wizard page (step 1)
    wizard_html = curl_get(redirect_url, timeout=30)
    if not wizard_html or len(wizard_html) < 500:
        print(f"  ERROR: Wizard page too small ({len(wizard_html) if wizard_html else 0}b)")
        continue
    
    print(f"  Wizard loaded: {len(wizard_html)}b")
    
    # Navigate to step 3 (FitTools)
    step3_html = curl_get("/CustomOrder/GoToStep?step=3")
    if not step3_html or len(step3_html) < 100:
        step3_html = curl_post("/CustomOrder/GoToStep", "step=3")
    
    if not step3_html or len(step3_html) < 200:
        print(f"  ERROR: Step 3 too small ({len(step3_html) if step3_html else 0}b)")
        # Try step 2 first then step 3
        step2 = curl_get("/CustomOrder/GoToStep?step=2")
        print(f"  Step 2: {len(step2) if step2 else 0}b")
        time.sleep(0.3)
        step3_html = curl_get("/CustomOrder/GoToStep?step=3")
        if not step3_html or len(step3_html) < 200:
            print(f"  Still no step 3 ({len(step3_html) if step3_html else 0}b)")
            continue
    
    print(f"  Step 3 HTML: {len(step3_html)}b")
    
    # Save raw HTML
    safe_name = name.replace(" ", "_").replace("&", "and").replace("/", "_").replace("(", "").replace(")", "").replace(",", "")
    with open(os.path.join(OUT_DIR, f"{safe_name}_step3_FitTools.html"), "w") as f:
        f.write(step3_html)
    
    # Parse collapsible sections (h2 headers) and their fit tool contents
    # GoCreate uses collapsible panels: <h2>SectionName</h2> followed by tool rows
    # Each tool row has a select (dropdown) or a label with checkbox
    
    # Look for section headers in the HTML
    # The fit tools tab typically has product part tabs, and within each tab,
    # collapsible sections like "Posture", "Circumference", "Length", "Others jacket"
    
    # Find all h2 section headers
    h2_matches = list(re.finditer(r'<h2[^>]*>(.*?)</h2>', step3_html, re.DOTALL))
    print(f"  Found {len(h2_matches)} H2 headers")
    for h in h2_matches:
        section_name = re.sub(r'<[^>]+>', '', h.group(1)).strip()
        if section_name:
            print(f"    - {section_name}")
    
    # Parse per-section: for each h2, find the tools until the next h2
    # Tools are identified by select elements with FitTool IDs or checkboxes
    sections = []
    
    for i, h2 in enumerate(h2_matches):
        section_name = re.sub(r'<[^>]+>', '', h2.group(1)).strip()
        if not section_name or section_name in ("FitTools", "Is visible"):
            continue
        
        start = h2.end()
        end = h2_matches[i+1].start() if i+1 < len(h2_matches) else len(step3_html)
        section_html = step3_html[start:end]
        
        # Extract tool names from this section
        # Tools appear as labels with associated selects or text inputs
        labels = re.findall(r'<label[^>]*class="[^"]*form-label[^"]*"[^>]*>(.*?)</label>', section_html, re.DOTALL)
        tool_names = []
        for lbl in labels:
            txt = re.sub(r'<[^>]+>', '', lbl).strip()
            if txt and txt not in ("FitTools", "Is visible", "#", ""):
                tool_names.append(txt)
        
        # Also extract select IDs for tool identification
        selects = re.findall(r'<select[^>]*id="([^"]*_DefaultValue)"[^>]*>', section_html)
        
        # Extract tool IDs from hidden fields
        tool_ids = re.findall(r'name="FitToolItems\[(\d+)\]\.FitToolID"[^>]*value="(\d+)"', section_html)
        
        # Extract checkbox IDs
        chk_ids = re.findall(r'<input[^>]*id="(chk_\d+)"', section_html)
        
        if tool_names or selects or tool_ids:
            sections.append({
                "section": section_name,
                "tool_names": tool_names,
                "select_ids": selects,
                "tool_ids": [{"index": idx, "id": tid} for idx, tid in tool_ids],
                "checkbox_ids": chk_ids,
            })
            print(f"  Section '{section_name}': {len(tool_names)} tools, {len(tool_ids)} IDs")
            for tn in tool_names[:5]:
                print(f"      {tn}")
            if len(tool_names) > 5:
                print(f"      ... +{len(tool_names)-5} more")
    
    all_sections[name] = sections
    time.sleep(0.5)

# Save results
out_path = os.path.join(OUT_DIR, "fittool_sections_by_item_type.json")
with open(out_path, "w") as f:
    json.dump(all_sections, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"  DONE! Saved to {out_path}")
print(f"  Types extracted: {len(all_sections)}")
for item_name, sections in all_sections.items():
    total_tools = sum(len(s["tool_names"]) for s in sections)
    print(f"    {item_name}: {len(sections)} sections, {total_tools} tools")
print(f"{'='*60}")
