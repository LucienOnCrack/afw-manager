#!/usr/bin/env python3
"""
Extract ALL primary info (Model, Make, Fabric, Lining, Button, Canvas, Trim, etc.)
for EVERY product combination via GetPrimaryInformationMakeView.

Key discovery: must include Referer + User-Agent headers to avoid redirect.
Flow: LoadCustomOrderCreationPerShop -> follow 302 to get GUID -> GET wizard page -> POST GetPrimaryInformationMakeView
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
    print(f"\r[{ts}] [{bar}] {pct:5.1f}% ({current}/{total}) {label}", end="", flush=True)

COOKIE = "ASP.NET_SessionId=um0ei1tbctr1p0wf5t4sbdrl; MunroShopSitesFormAuthentication=26896477E61D864518EEFE147411352EB8A71AD47D5AF263675E981B2BDD071B3607C0647BDD7C9D1B344111E271AA8EDC75D935F0C0CD1826D6104003DFFF84643184FE5678F7A84E79877BD0B5A4437F16049AE5EBFD0207EECC0E8B269D7B2B7E92B254854DA650AE4B919C98EFF21792B013"
BASE = "https://gocreate.nu"
OUT = "/Users/lucien/poopy doopy fabric dookie/data/gocreate-primary-info"
os.makedirs(OUT, exist_ok=True)

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"

ITEM_GROUPS = [
    (1, 1, "Formal"),
    (2, 1, "Informal"),
    (3, 1, "Trousers_group"),
    (4, 2, "Shirts"),
    (5, 3, "Outerwear"),
    (6, 8, "Shoes"),
    (7, 9, "Ties"),
    (8, 10, "Pants"),
    (9, 11, "Knitwear"),
    (10, 12, "Vests"),
]

def curl_post(url, data, extra_headers=None, timeout=15):
    cmd = ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5",
           "-X", "POST",
           "-H", f"Cookie: {COOKIE}",
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
            log(f"  (slow request: {elapsed:.1f}s for {url.split('/')[-1]})")
        return r.stdout
    except Exception as e:
        log(f"  TIMEOUT/ERROR: {e}")
        return ""

def curl_get(url, timeout=15, extra_headers=None):
    cmd = ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5",
           "-H", f"Cookie: {COOKIE}",
           "-H", f"User-Agent: {UA}",
           "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"]
    if extra_headers:
        for h in extra_headers:
            cmd.extend(["-H", h])
    cmd.append(url)
    try:
        t0 = time.time()
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
        elapsed = time.time() - t0
        if elapsed > 5:
            log(f"  (slow request: {elapsed:.1f}s for GET)")
        return r.stdout
    except Exception as e:
        log(f"  TIMEOUT/ERROR: {e}")
        return ""

def curl_get_redirect(url, timeout=10):
    cmd = ["curl", "-s", "--max-time", str(timeout), "-o", "/dev/null", "-D", "-",
           "-H", f"Cookie: {COOKIE}",
           "-H", f"User-Agent: {UA}",
           "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
           url]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
        return r.stdout
    except Exception as e:
        log(f"  TIMEOUT/ERROR on redirect: {e}")
        return ""

class SelectParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.selects = []
        self.hiddens = []
        self.in_select = False
        self.in_option = False
        self.current_select = None
        self.current_option = None
        self.text_inputs = []

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        if tag == "select":
            self.in_select = True
            self.current_select = {
                "id": ad.get("id", ""), "name": ad.get("name", ""),
                "class": ad.get("class", ""),
                "data": {k: v for k, v in attrs if k.startswith("data-")},
                "options": []
            }
        elif tag == "option" and self.in_select:
            self.in_option = True
            data_attrs = {k: v for k, v in attrs if k.startswith("data-")}
            self.current_option = {
                "value": ad.get("value", ""), "selected": "selected" in ad,
                "data": data_attrs, "text": ""
            }
        elif tag == "input":
            itype = ad.get("type", "text")
            if itype == "hidden":
                self.hiddens.append({"id": ad.get("id", ""), "name": ad.get("name", ""), "value": ad.get("value", "")})
            elif itype == "text":
                self.text_inputs.append({"id": ad.get("id", ""), "name": ad.get("name", ""),
                                         "data": {k: v for k, v in attrs if k.startswith("data-")}})

    def handle_endtag(self, tag):
        if tag == "select":
            self.in_select = False
            if self.current_select:
                self.selects.append(self.current_select)
            self.current_select = None
        elif tag == "option" and self.in_option:
            self.in_option = False
            if self.current_option and self.current_select:
                self.current_option["text"] = self.current_option["text"].strip()
                self.current_select["options"].append(self.current_option)
            self.current_option = None

    def handle_data(self, data):
        if self.in_option and self.current_option:
            self.current_option["text"] += data

def parse_html(html):
    p = SelectParser()
    try:
        p.feed(html)
    except:
        pass
    js_vars = {}
    for m in re.finditer(r'var\s+(\w+)\s*=\s*(["\'][^"\']*["\']|\d+|true|false|\[.*?\])', html):
        js_vars[m.group(1)] = m.group(2)
    json_args = []
    for m in re.finditer(r'UpdateItemDetails\("(.*?)"\)', html, re.DOTALL):
        try:
            raw = m.group(1).replace('\\"', '"').replace('\\\\', '\\')
            json_args.append(json.loads(raw))
        except:
            pass
    return {
        "selects": [{"id": s["id"], "name": s["name"], "data": s["data"],
                     "options": [{"value": o["value"], "text": o["text"], "selected": o["selected"], "data": o["data"]} for o in s["options"]]}
                    for s in p.selects],
        "hiddens": p.hiddens,
        "textInputs": p.text_inputs,
        "jsVars": js_vars,
        "itemDetails": json_args
    }

def init_wizard(item_group_id, item_type_category_id):
    resp = curl_post(
        f"{BASE}/Customer/LoadCustomOrderCreationPerShop/",
        f"itemGroupId={item_group_id}&itemTypeCategoryId={item_type_category_id}&productLineId=1&customerId=503549&isSwipe=false"
    )
    try:
        j = json.loads(resp)
        if j.get("Status") and j.get("RefreshURL"):
            url = j["RefreshURL"]
            headers = curl_get_redirect(f"{BASE}{url}")
            m = re.search(r'/g/([a-f0-9]+)/', headers)
            if m:
                guid = m.group(1)
                wizard_html = curl_get(f"{BASE}/g/{guid}/CustomOrder/Index",
                                       extra_headers=[f"Referer: {BASE}/Customer/Detail/503549"],
                                       timeout=20)
                if len(wizard_html) > 5000:
                    return guid, wizard_html
                return guid, None
    except:
        pass
    return None, None

def get_primary_info(guid, combination_id, quantity=1):
    url = f"{BASE}/g/{guid}/CustomOrder/GetPrimaryInformationMakeView"
    data = f"combinationID={combination_id}&quantity={quantity}&isDuplicateOrder=false&isCallFromResetSSOOrderCopy=false"
    html = curl_post(url, data,
                     extra_headers=[f"Referer: {BASE}/g/{guid}/CustomOrder/Index",
                                    "Accept: */*"])
    return html

def extract_combos_from_wizard(html):
    combos = []
    for m in re.finditer(r'<option\s+value="(\d+)"[^>]*>(.*?)</option>', html):
        combos.append({"id": int(m.group(1)), "name": m.group(2).strip()})
    return combos

script_start = time.time()
log("=" * 60)
log("  GoCreate - Extract ALL Primary Info for ALL Combinations")
log("=" * 60)
log(f"  {len(ITEM_GROUPS)} item groups to process")
log("")

all_data = {}
total_combos = 0
total_selects = 0
total_options = 0
total_errors = 0

for gi, (group_id, type_id, group_name) in enumerate(ITEM_GROUPS):
    group_start = time.time()
    log("")
    log(f"{'─' * 55}")
    log(f"  [{gi+1}/{len(ITEM_GROUPS)}] {group_name} (group={group_id}, type={type_id})")
    log(f"{'─' * 55}")

    log(f"  Initializing wizard session...", end="")
    guid, wizard_html = init_wizard(group_id, type_id)
    if not guid:
        print(f" FAILED", flush=True)
        log(f"  Skipping {group_name}")
        continue
    print(f" OK (GUID: {guid[:12]}...)", flush=True)

    if wizard_html:
        wz_size = len(wizard_html)
        with open(os.path.join(OUT, f"{group_name}_wizard.html"), "w") as f:
            f.write(wizard_html)
        log(f"  Wizard page loaded: {wz_size:,}b")

        combos = extract_combos_from_wizard(wizard_html)
        if combos:
            log(f"  Found {len(combos)} product combinations:")
            for c in combos:
                log(f"    {c['id']:3d} = {c['name']}")
    else:
        log(f"  Could not load wizard page (will try default IDs)")
        combos = []

    if not combos:
        log(f"  Using default combo IDs 1-69")
        combos = [{"id": i, "name": f"combo_{i}"} for i in range(1, 70)]

    group_data = {"guid": guid, "combinations": {}}
    group_ok = 0
    group_skip = 0

    for ci, combo in enumerate(combos):
        combo_id = combo["id"]
        combo_name = combo.get("name", f"combo_{combo_id}")
        progress(ci + 1, len(combos), f"{combo_name[:25]}")
        time.sleep(0.3)

        html = get_primary_info(guid, combo_id)
        sz = len(html)

        if sz < 100 or "Sorry some error" in html or "Runtime Error" in html:
            group_skip += 1
            total_errors += 1
            continue

        with open(os.path.join(OUT, f"{group_name}_combo{combo_id}.html"), "w") as f:
            f.write(html)

        parsed = parse_html(html)
        num_selects = len(parsed["selects"])
        num_options = sum(len(s["options"]) for s in parsed["selects"])

        total_combos += 1
        total_selects += num_selects
        total_options += num_options
        group_ok += 1

        combo_data = {
            "combinationId": combo_id,
            "combinationName": combo_name,
            "htmlSize": sz,
            "selects": parsed["selects"],
            "hiddens": parsed["hiddens"],
            "textInputs": parsed["textInputs"],
            "itemDetails": parsed["itemDetails"],
            "jsVars": parsed["jsVars"],
        }

        group_data["combinations"][str(combo_id)] = combo_data

    print(flush=True)
    group_elapsed = time.time() - group_start
    log(f"  {group_name} done: {group_ok} OK, {group_skip} skipped ({group_elapsed:.1f}s)")

    for cid, cd in group_data["combinations"].items():
        cname = cd.get("combinationName", cid)
        log(f"    combo {cid:>3s} ({cname}): {cd['htmlSize']:,}b, {len(cd['selects'])} selects")
        for s in cd["selects"]:
            nopts = len(s["options"])
            opts_preview = ", ".join(f"{o['text']}({o['value']})" for o in s["options"][:4])
            if nopts > 4:
                opts_preview += f"... (+{nopts-4} more)"
            log(f"      {s['id']:35s}: {nopts:3d} opts [{opts_preview}]")

    all_data[group_name] = group_data

    with open(os.path.join(OUT, f"{group_name}_all.json"), "w") as f:
        json.dump(group_data, f, indent=2)
    log(f"  Saved {group_name}_all.json")

with open(os.path.join(OUT, "all_primary_info.json"), "w") as f:
    json.dump(all_data, f, indent=2)

total_elapsed = time.time() - script_start
log("")
log("=" * 60)
log("  FINAL SUMMARY")
log("=" * 60)
log(f"  Total time: {total_elapsed:.1f}s")
log(f"  Total combinations extracted: {total_combos}")
log(f"  Total errors/skipped: {total_errors}")
log(f"  Total select dropdowns: {total_selects}")
log(f"  Total options across all dropdowns: {total_options}")
log(f"  Files saved in: {OUT}")

all_select_ids = set()
for gn, gd in all_data.items():
    for ci, cd in gd.get("combinations", {}).items():
        for s in cd.get("selects", []):
            sid = s.get("id", "")
            base_id = re.sub(r'_\d+_\d+$', '', sid)
            base_id = re.sub(r'_\d+$', '', base_id)
            all_select_ids.add(base_id)

log(f"\n  Unique dropdown types ({len(all_select_ids)}):")
for sid in sorted(all_select_ids):
    log(f"    - {sid}")
log("")
log("DONE.")
