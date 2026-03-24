#!/usr/bin/env python3
"""
Extract ALL remaining missing data from GoCreate wizard:
1. Canvas options (per make x part)
2. Button options (per part)
3. Trim options (per part)
4. Inside Lining options (per part)
5. Detachable Liner options
6. Fabric names (autosuggest search)
7. Lining names (autosuggest search)
8. FitTools full metadata (Step 3 HTML via GoToStep)
9. Branding options (Step 5 HTML via GoToStep)
10. Fit & TryOn (Step 2 HTML via GoToStep)
"""
import subprocess, json, re, os, sys, time, datetime
from html.parser import HTMLParser

def log(msg, end="\n"):
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", end=end, flush=True)

def progress(current, total, label=""):
    bar_len = 30
    filled = int(bar_len * current / max(total, 1))
    bar = "█" * filled + "░" * (bar_len - filled)
    pct = 100 * current / max(total, 1)
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"\r[{ts}] [{bar}] {pct:5.1f}% ({current}/{total}) {label:<40s}", end="", flush=True)

COOKIE = "ASP.NET_SessionId=um0ei1tbctr1p0wf5t4sbdrl; MunroShopSitesFormAuthentication=26896477E61D864518EEFE147411352EB8A71AD47D5AF263675E981B2BDD071B3607C0647BDD7C9D1B344111E271AA8EDC75D935F0C0CD1826D6104003DFFF84643184FE5678F7A84E79877BD0B5A4437F16049AE5EBFD0207EECC0E8B269D7B2B7E92B254854DA650AE4B919C98EFF21792B013"
BASE = "https://gocreate.nu"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
OUT = "/Users/lucien/poopy doopy fabric dookie/data/gocreate-remaining"
os.makedirs(OUT, exist_ok=True)

PARTS = {
    1: "Jacket", 2: "Trousers", 3: "Waistcoat", 4: "Shirt",
    5: "Overcoat", 6: "Bermuda", 7: "Pea coat", 8: "Coat",
    9: "Detachable liner", 10: "Informal jacket", 12: "Bermuda (Inf)",
    20: "Sneaker", 21: "Tie", 22: "Bow tie", 23: "Pocket square",
    24: "Belt - Italy", 25: "Belt - Portugal",
    32: "Knitwear", 34: "Beanie", 35: "Scarf",
    36: "Quilted vest", 37: "Cummerbund", 38: "Vest",
    39: "Pants", 40: "Runner", 41: "City loafer"
}

MAKES = {
    1: "handmade", 7: "semi-traditional", 8: "traditional",
    9: "traditional full canvas", 10: "traditional with pleated waistband",
    11: "unconstructed", 12: "unconstructed handmade",
    42: "traditional belt", 51: "pleated"
}

def curl_post(url, data, extra_headers=None, timeout=15):
    cmd = ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5",
           "-X", "POST", "-H", f"Cookie: {COOKIE}",
           "-H", "X-Requested-With: XMLHttpRequest",
           "-H", "Content-Type: application/x-www-form-urlencoded",
           "-H", f"User-Agent: {UA}"]
    if extra_headers:
        for h in extra_headers:
            cmd.extend(["-H", h])
    cmd.extend(["-d", data, url])
    try:
        t0 = time.time()
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
        elapsed = time.time() - t0
        if elapsed > 5:
            log(f"    slow: {elapsed:.1f}s")
        return r.stdout
    except Exception as e:
        log(f"    ERROR: {e}")
        return ""

def curl_get(url, timeout=15, extra_headers=None):
    cmd = ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5",
           "-H", f"Cookie: {COOKIE}", "-H", f"User-Agent: {UA}",
           "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"]
    if extra_headers:
        for h in extra_headers:
            cmd.extend(["-H", h])
    cmd.append(url)
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
        return r.stdout
    except Exception as e:
        log(f"    ERROR: {e}")
        return ""

def curl_get_json(url, params="", extra_headers=None, timeout=15):
    full_url = f"{url}?{params}" if params else url
    cmd = ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5",
           "-H", f"Cookie: {COOKIE}", "-H", f"User-Agent: {UA}",
           "-H", "X-Requested-With: XMLHttpRequest",
           "-H", "Accept: application/json, text/javascript, */*; q=0.01"]
    if extra_headers:
        for h in extra_headers:
            cmd.extend(["-H", h])
    cmd.append(full_url)
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
        return r.stdout
    except Exception as e:
        log(f"    ERROR: {e}")
        return ""

def curl_get_redirect(url, timeout=10):
    cmd = ["curl", "-s", "--max-time", str(timeout), "-o", "/dev/null", "-D", "-",
           "-H", f"Cookie: {COOKIE}", "-H", f"User-Agent: {UA}",
           "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", url]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
        return r.stdout
    except:
        return ""

def init_wizard_get_guid():
    log("  Creating wizard session...", end="")
    resp = curl_post(
        f"{BASE}/Customer/LoadCustomOrderCreationPerShop/",
        "itemGroupId=1&itemTypeCategoryId=1&productLineId=1&customerId=503549&isSwipe=false"
    )
    try:
        j = json.loads(resp)
        if j.get("Status") and j.get("RefreshURL"):
            headers = curl_get_redirect(f"{BASE}{j['RefreshURL']}")
            m = re.search(r'/g/([a-f0-9]+)/', headers)
            if m:
                guid = m.group(1)
                wizard_html = curl_get(f"{BASE}/g/{guid}/CustomOrder/Index",
                                       extra_headers=[f"Referer: {BASE}/Customer/Detail/503549"], timeout=20)
                if len(wizard_html) > 5000:
                    print(f" OK (GUID: {guid[:12]}..., page: {len(wizard_html):,}b)", flush=True)
                    return guid
    except:
        pass
    print(" FAILED", flush=True)
    return None

def select_combination(guid, combo_id):
    url = f"{BASE}/g/{guid}/CustomOrder/GetPrimaryInformationMakeView"
    data = f"combinationID={combo_id}&quantity=1&isDuplicateOrder=false&isCallFromResetSSOOrderCopy=false"
    html = curl_post(url, data, extra_headers=[f"Referer: {BASE}/g/{guid}/CustomOrder/Index", "Accept: */*"])
    return len(html) > 100 and "Sorry some error" not in html

script_start = time.time()
log("=" * 60)
log("  GoCreate - Extract ALL Remaining Data")
log("=" * 60)

guid = init_wizard_get_guid()
if not guid:
    log("FATAL: Could not create wizard session")
    sys.exit(1)

REFERER = f"Referer: {BASE}/g/{guid}/CustomOrder/Index"

log("  Selecting 2-piece suit (combo 1) to activate wizard...", end="")
if select_combination(guid, 1):
    print(" OK", flush=True)
else:
    print(" FAILED (continuing anyway)", flush=True)

# ===================================================================
# 1. CANVAS OPTIONS - per make x part
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 1: Canvas Options")
log("=" * 55)

canvas_data = {}
combos_for_canvas = [
    (1, 1), (1, 8), (1, 9), (1, 1), (1, 7), (1, 11), (1, 12),
    (2, 8), (2, 10), (2, 1),
    (3, 8), (3, 9), (3, 1),
    (10, 8), (10, 1),
]
seen_canvas = set()
total_canvas = len(PARTS) * len(MAKES)
done_canvas = 0

for part_id, part_name in PARTS.items():
    for make_id, make_name in MAKES.items():
        done_canvas += 1
        key = f"{part_id}_{make_id}"
        if key in seen_canvas:
            continue
        seen_canvas.add(key)
        progress(done_canvas, total_canvas, f"Canvas: {part_name}/{make_name}")
        
        url = f"{BASE}/g/{guid}/CustomOrder/GetCanvasOptions"
        params = f"productPartId={part_id}&makeId={make_id}&itemNumber=1"
        resp = curl_get_json(url, params, extra_headers=[REFERER])
        time.sleep(0.15)
        
        if not resp or len(resp) < 5:
            continue
        try:
            j = json.loads(resp)
            if j.get("data") or j.get("status"):
                canvas_data[f"part{part_id}_make{make_id}"] = {
                    "partId": part_id, "partName": part_name,
                    "makeId": make_id, "makeName": make_name,
                    "response": j
                }
        except:
            pass

print(flush=True)
log(f"  Canvas: {len(canvas_data)} valid responses")
with open(os.path.join(OUT, "canvas_options.json"), "w") as f:
    json.dump(canvas_data, f, indent=2)

# ===================================================================
# 2. BUTTON OPTIONS - per part
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 2: Button Options")
log("=" * 55)

button_data = {}
parts_list = list(PARTS.items())
for i, (part_id, part_name) in enumerate(parts_list):
    progress(i + 1, len(parts_list), f"Buttons: {part_name}")
    url = f"{BASE}/g/{guid}/CustomOrder/GetPrimaryButtons"
    params = f"productPartId={part_id}&itemNumber=1&isforFabricSelection=false"
    resp = curl_get_json(url, params, extra_headers=[REFERER])
    time.sleep(0.15)
    
    if not resp or len(resp) < 5:
        continue
    try:
        j = json.loads(resp)
        if j.get("data") or j.get("status"):
            button_data[str(part_id)] = {
                "partId": part_id, "partName": part_name,
                "response": j
            }
    except:
        pass

print(flush=True)
log(f"  Buttons: {len(button_data)} valid responses")
with open(os.path.join(OUT, "button_options.json"), "w") as f:
    json.dump(button_data, f, indent=2)

# ===================================================================
# 3. TRIM OPTIONS - per part
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 3: Trim Options")
log("=" * 55)

trim_data = {}
for i, (part_id, part_name) in enumerate(parts_list):
    progress(i + 1, len(parts_list), f"Trims: {part_name}")
    url = f"{BASE}/g/{guid}/CustomOrder/GetPrimaryTrims"
    params = f"productPartId={part_id}&itemNumber=1&isforFabricSelection=false"
    resp = curl_get_json(url, params, extra_headers=[REFERER])
    time.sleep(0.15)
    
    if not resp or len(resp) < 5:
        continue
    try:
        j = json.loads(resp)
        if j.get("data") or j.get("status"):
            trim_data[str(part_id)] = {
                "partId": part_id, "partName": part_name,
                "response": j
            }
    except:
        pass

print(flush=True)
log(f"  Trims: {len(trim_data)} valid responses")
with open(os.path.join(OUT, "trim_options.json"), "w") as f:
    json.dump(trim_data, f, indent=2)

# ===================================================================
# 4. INSIDE LINING OPTIONS - per part x make
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 4: Inside Lining Options")
log("=" * 55)

inside_lining_data = {}
done_il = 0
seen_il = set()
for part_id, part_name in PARTS.items():
    for make_id, make_name in MAKES.items():
        done_il += 1
        key = f"{part_id}_{make_id}"
        if key in seen_il:
            continue
        seen_il.add(key)
        progress(done_il, total_canvas, f"InsideLining: {part_name}/{make_name}")
        
        url = f"{BASE}/g/{guid}/CustomOrder/GetInsideLiningOptions"
        params = f"productPartId={part_id}&makeId={make_id}&itemNumber=1"
        resp = curl_get_json(url, params, extra_headers=[REFERER])
        time.sleep(0.15)
        
        if not resp or len(resp) < 5:
            continue
        try:
            j = json.loads(resp)
            if j.get("data") or j.get("status"):
                inside_lining_data[f"part{part_id}_make{make_id}"] = {
                    "partId": part_id, "partName": part_name,
                    "makeId": make_id, "makeName": make_name,
                    "response": j
                }
        except:
            pass

print(flush=True)
log(f"  Inside Lining: {len(inside_lining_data)} valid responses")
with open(os.path.join(OUT, "inside_lining_options.json"), "w") as f:
    json.dump(inside_lining_data, f, indent=2)

# ===================================================================
# 5. DETACHABLE LINER OPTIONS
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 5: Detachable Liner Options")
log("=" * 55)

detachable_data = {}
for i, (part_id, part_name) in enumerate(parts_list):
    progress(i + 1, len(parts_list), f"DetachableLiner: {part_name}")
    url = f"{BASE}/g/{guid}/CustomOrder/GetDetachableLinerOptions"
    params = f"productPartId={part_id}&itemNumber=1"
    resp = curl_get_json(url, params, extra_headers=[REFERER])
    time.sleep(0.15)
    
    if not resp or len(resp) < 5:
        continue
    try:
        j = json.loads(resp)
        if j.get("data") or j.get("status"):
            detachable_data[str(part_id)] = {
                "partId": part_id, "partName": part_name,
                "response": j
            }
    except:
        pass

print(flush=True)
log(f"  Detachable Liner: {len(detachable_data)} valid responses")
with open(os.path.join(OUT, "detachable_liner_options.json"), "w") as f:
    json.dump(detachable_data, f, indent=2)

# ===================================================================
# 6. FABRIC SEARCH (autosuggest - search common prefixes)
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 6: Fabric Name Search (autosuggest)")
log("=" * 55)

fabric_data = {}
search_terms = list("abcdefghijklmnopqrstuvwxyz0123456789")
for i, term in enumerate(search_terms):
    progress(i + 1, len(search_terms), f"Fabric search: '{term}'")
    url = f"{BASE}/g/{guid}/CustomOrder/GetFabricNames"
    params = f"term={term}"
    resp = curl_get_json(url, params, extra_headers=[REFERER])
    time.sleep(0.2)
    
    if not resp or len(resp) < 3:
        continue
    try:
        j = json.loads(resp)
        if isinstance(j, list) and len(j) > 0:
            fabric_data[term] = j
    except:
        pass

print(flush=True)
all_fabrics = set()
for term, items in fabric_data.items():
    for item in items:
        if isinstance(item, dict):
            all_fabrics.add(json.dumps(item, sort_keys=True))
        elif isinstance(item, str):
            all_fabrics.add(item)
log(f"  Fabrics: {len(all_fabrics)} unique entries from {len(fabric_data)} searches")
with open(os.path.join(OUT, "fabric_names.json"), "w") as f:
    json.dump({"byPrefix": fabric_data, "uniqueCount": len(all_fabrics)}, f, indent=2)

# ===================================================================
# 7. LINING SEARCH (autosuggest)
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 7: Lining Name Search (autosuggest)")
log("=" * 55)

lining_data = {}
for i, term in enumerate(search_terms):
    progress(i + 1, len(search_terms), f"Lining search: '{term}'")
    url = f"{BASE}/g/{guid}/CustomOrder/GetLiningNames"
    params = f"term={term}"
    resp = curl_get_json(url, params, extra_headers=[REFERER])
    time.sleep(0.2)
    
    if not resp or len(resp) < 3:
        continue
    try:
        j = json.loads(resp)
        if isinstance(j, list) and len(j) > 0:
            lining_data[term] = j
    except:
        pass

print(flush=True)
all_linings = set()
for term, items in lining_data.items():
    for item in items:
        if isinstance(item, dict):
            all_linings.add(json.dumps(item, sort_keys=True))
        elif isinstance(item, str):
            all_linings.add(item)
log(f"  Linings: {len(all_linings)} unique entries from {len(lining_data)} searches")
with open(os.path.join(OUT, "lining_names.json"), "w") as f:
    json.dump({"byPrefix": lining_data, "uniqueCount": len(all_linings)}, f, indent=2)

# ===================================================================
# 8. WIZARD STEP 2 - Fit & TryOn (GoToStep?step=2)
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 8: Wizard Step 2 - Fit & TryOn")
log("=" * 55)

log("  Fetching Step 2 HTML...", end="")
step2_url = f"{BASE}/g/{guid}/CustomOrder/GoToStep?step=2"
step2_html = curl_post(step2_url, "", extra_headers=[REFERER, "Accept: */*"], timeout=20)
print(f" {len(step2_html):,}b", flush=True)

if len(step2_html) > 200:
    with open(os.path.join(OUT, "wizard_step2_fit_tryon.html"), "w") as f:
        f.write(step2_html)
    log(f"  Saved wizard_step2_fit_tryon.html")
else:
    log(f"  Step 2 failed or empty: {step2_html[:100]}")

# ===================================================================
# 9. WIZARD STEP 3 - FitTools (GoToStep?step=3)
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 9: Wizard Step 3 - FitTools")
log("=" * 55)

log("  Fetching Step 3 HTML...", end="")
step3_url = f"{BASE}/g/{guid}/CustomOrder/GoToStep?step=3"
step3_html = curl_post(step3_url, "", extra_headers=[REFERER, "Accept: */*"], timeout=20)
print(f" {len(step3_html):,}b", flush=True)

if len(step3_html) > 200:
    with open(os.path.join(OUT, "wizard_step3_fittools.html"), "w") as f:
        f.write(step3_html)
    log(f"  Saved wizard_step3_fittools.html")
else:
    log(f"  Step 3 failed or empty: {step3_html[:100]}")

# ===================================================================
# 10. WIZARD STEP 4 - DesignOptions (GoToStep?step=4)
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 10: Wizard Step 4 - DesignOptions")
log("=" * 55)

log("  Fetching Step 4 HTML...", end="")
step4_url = f"{BASE}/g/{guid}/CustomOrder/GoToStep?step=4"
step4_html = curl_post(step4_url, "", extra_headers=[REFERER, "Accept: */*"], timeout=20)
print(f" {len(step4_html):,}b", flush=True)

if len(step4_html) > 200:
    with open(os.path.join(OUT, "wizard_step4_designoptions.html"), "w") as f:
        f.write(step4_html)
    log(f"  Saved wizard_step4_designoptions.html")
else:
    log(f"  Step 4 failed or empty: {step4_html[:100]}")

# ===================================================================
# 11. WIZARD STEP 5 - BrandingOptions (GoToStep?step=5)
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 11: Wizard Step 5 - BrandingOptions")
log("=" * 55)

log("  Fetching Step 5 HTML...", end="")
step5_url = f"{BASE}/g/{guid}/CustomOrder/GoToStep?step=5"
step5_html = curl_post(step5_url, "", extra_headers=[REFERER, "Accept: */*"], timeout=20)
print(f" {len(step5_html):,}b", flush=True)

if len(step5_html) > 200:
    with open(os.path.join(OUT, "wizard_step5_branding.html"), "w") as f:
        f.write(step5_html)
    log(f"  Saved wizard_step5_branding.html")
else:
    log(f"  Step 5 failed or empty: {step5_html[:100]}")

# ===================================================================
# 12. WIZARD STEP 6 - Summary (GoToStep?step=6)
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 12: Wizard Step 6 - Summary")
log("=" * 55)

log("  Fetching Step 6 HTML...", end="")
step6_url = f"{BASE}/g/{guid}/CustomOrder/GoToStep?step=6"
step6_html = curl_post(step6_url, "", extra_headers=[REFERER, "Accept: */*"], timeout=20)
print(f" {len(step6_html):,}b", flush=True)

if len(step6_html) > 200:
    with open(os.path.join(OUT, "wizard_step6_summary.html"), "w") as f:
        f.write(step6_html)
    log(f"  Saved wizard_step6_summary.html")
else:
    log(f"  Step 6 failed or empty: {step6_html[:100]}")

# ===================================================================
# 13. Body Measurement Settings
# ===================================================================
log("")
log("=" * 55)
log("  PHASE 13: Body Measurement / Calculation Settings")
log("=" * 55)

log("  Fetching body measurement data...", end="")
bm_url = f"{BASE}/g/{guid}/CustomOrder/GetOrderBodyMeasurement"
bm_resp = curl_post(bm_url, "", extra_headers=[REFERER, "Accept: */*"], timeout=15)
print(f" {len(bm_resp):,}b", flush=True)

if len(bm_resp) > 50:
    with open(os.path.join(OUT, "body_measurement.json"), "w") as f:
        f.write(bm_resp)
    log(f"  Saved body_measurement.json")

log("  Fetching body calc settings...", end="")
bc_url = f"{BASE}/g/{guid}/CustomOrder/ApplyBodymeasurementCalculatedValues"
bc_resp = curl_post(bc_url, "", extra_headers=[REFERER, "Accept: */*"], timeout=15)
print(f" {len(bc_resp):,}b", flush=True)

if len(bc_resp) > 50:
    with open(os.path.join(OUT, "body_calc_values.json"), "w") as f:
        f.write(bc_resp)

# ===================================================================
# FINAL SUMMARY
# ===================================================================
total_elapsed = time.time() - script_start
log("")
log("=" * 60)
log("  EXTRACTION COMPLETE")
log("=" * 60)
log(f"  Total time: {total_elapsed:.1f}s")
log(f"  Canvas options: {len(canvas_data)} responses")
log(f"  Button options: {len(button_data)} responses")
log(f"  Trim options: {len(trim_data)} responses")
log(f"  Inside Lining: {len(inside_lining_data)} responses")
log(f"  Detachable Liner: {len(detachable_data)} responses")
log(f"  Fabric names: {len(all_fabrics)} unique")
log(f"  Lining names: {len(all_linings)} unique")
log(f"  Step 2 (Fit&TryOn): {len(step2_html):,}b")
log(f"  Step 3 (FitTools): {len(step3_html):,}b")
log(f"  Step 4 (DesignOpts): {len(step4_html):,}b")
log(f"  Step 5 (Branding): {len(step5_html):,}b")
log(f"  Step 6 (Summary): {len(step6_html):,}b")
log(f"  Files saved in: {OUT}")
log("")
log("DONE.")
