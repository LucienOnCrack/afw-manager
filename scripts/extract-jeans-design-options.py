#!/usr/bin/env python3
"""
Extract design options for Jeans / 5 Pocket (combo 21, part 14) from the
GoCreate order wizard (step 4).

ShopSettings/GetDesignOptions doesn't include 5 Pocket in its part dropdown,
so we must go through the order wizard flow instead:
  1. Create a Pants order session
  2. Select combo 21 (Jeans / 5 Pockets) with a make/fabric
  3. Submit primary info to advance
  4. Navigate to step 4 (DesignOptions) to get the actual HTML
  5. Parse the design option dropdowns

Also does the same for Chinos (combo 22, part 15).

Usage:
  python3 scripts/extract-jeans-design-options.py

Requires a valid GoCreate session cookie in COOKIE below.
"""
import subprocess, json, re, os, sys, time, html as html_mod
from html.parser import HTMLParser

COOKIE = "ASP.NET_SessionId=hz3glp3lirj44i2oohgwzyvw; MunroShopSitesFormAuthentication=5E2F7108E62DD67E87BC74CB6C37347C17E4166B99A0FE66272120BC0A77CA7B627FEAC1E15BE3995678B9BA2CA66C1BD07099F3AE0A090093E4C420DF41FDF3716FE7515B3F4FE235141790C8415D370A0E38CE2DA72622859A12B0304C2BC26BD4D47C5864F53A045CCAF655B94D3A38F9D95D"
BASE = "https://gocreate.nu"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "gocreate-jeans")
os.makedirs(OUT, exist_ok=True)

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"

PANTS_GROUP_ID = 8
PANTS_TYPE_ID = 10
COMBOS = [
    {"id": 21, "name": "Jeans / 5 Pockets", "part_id": 14},
    {"id": 22, "name": "Chinos", "part_id": 15},
]


def log(msg, end="\n"):
    print(f"  {msg}", end=end, flush=True)


def curl(method, url, data=None, extra_headers=None, timeout=20, follow=False):
    cmd = ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "5"]
    if follow:
        cmd.append("-L")
    cmd.extend(["-X", method,
                "-H", f"Cookie: {COOKIE}",
                "-H", f"User-Agent: {UA}"])
    if method == "POST":
        cmd.extend(["-H", "X-Requested-With: XMLHttpRequest",
                    "-H", "Content-Type: application/x-www-form-urlencoded"])
    if extra_headers:
        for h in extra_headers:
            cmd.extend(["-H", h])
    if data:
        cmd.extend(["-d", data])
    cmd.append(url)
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 10)
        return r.stdout
    except Exception as e:
        log(f"ERROR: {e}")
        return ""


def curl_redirect_location(url, timeout=10):
    cmd = ["curl", "-s", "--max-time", str(timeout), "-o", "/dev/null", "-D", "-",
           "-H", f"Cookie: {COOKIE}", "-H", f"User-Agent: {UA}", url]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        return r.stdout
    except:
        return ""


def init_wizard():
    """Create a Pants order session and return the GUID."""
    resp = curl("POST", f"{BASE}/Customer/LoadCustomOrderCreationPerShop/",
                f"itemGroupId={PANTS_GROUP_ID}&itemTypeCategoryId={PANTS_TYPE_ID}&productLineId=1&customerId=503549&isSwipe=false")
    try:
        j = json.loads(resp)
        if j.get("Status") and j.get("RefreshURL"):
            headers = curl_redirect_location(f"{BASE}{j['RefreshURL']}")
            m = re.search(r'/g/([a-f0-9]+)/', headers)
            if m:
                return m.group(1)
    except:
        pass
    return None


def get_wizard_page(guid):
    return curl("GET", f"{BASE}/g/{guid}/CustomOrder/Index",
                extra_headers=[f"Referer: {BASE}/Customer/Detail/503549"])


def select_combo_and_get_primary_info(guid, combo_id):
    url = f"{BASE}/g/{guid}/CustomOrder/GetPrimaryInformationMakeView"
    data = f"combinationID={combo_id}&quantity=1&isDuplicateOrder=false&isCallFromResetSSOOrderCopy=false"
    return curl("POST", url, data, extra_headers=[
        f"Referer: {BASE}/g/{guid}/CustomOrder/Index", "Accept: */*"])


def submit_primary_info(guid, combo_id, make_id, fabric_id="", fit_id=""):
    """Submit step 1 (primary info) to advance the wizard."""
    url = f"{BASE}/g/{guid}/CustomOrder/SubmitPrimaryInformation"
    form_data = (
        f"SelectedCombinationID={combo_id}&Quantity=1"
        f"&SelectedMakeID={make_id}"
        f"&SelectedFabricID={fabric_id}"
        f"&SelectedFitID={fit_id}"
        f"&checkValidation=false&wizardNextStep=true"
    )
    return curl("POST", url, form_data, extra_headers=[
        f"Referer: {BASE}/g/{guid}/CustomOrder/Index", "Accept: application/json"])


def goto_step(guid, step_no):
    url = f"{BASE}/g/{guid}/CustomOrder/GoToStep?step={step_no}"
    return curl("POST", url, f"step={step_no}", extra_headers=[
        f"Referer: {BASE}/g/{guid}/CustomOrder/Index", "Accept: application/json"])


def parse_design_options_html(html_str):
    """Parse design option labels + select dropdowns from wizard step 4 HTML."""
    categories = {}

    label_select_pairs = re.findall(
        r'<label[^>]*>\s*(.*?)\s*</label>'
        r'[\s\S]*?'
        r'<select[^>]*(?:id|name)="([^"]*)"[^>]*>([\s\S]*?)</select>',
        html_str, re.I
    )

    for label, sel_id, sel_body in label_select_pairs:
        clean_label = html_mod.unescape(label.strip())
        if not clean_label or clean_label.startswith("<!--"):
            continue
        options = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', sel_body, re.I)
        parsed_opts = []
        for val, text in options:
            if not val or val == "-1":
                continue
            parsed_opts.append({"value": val, "text": html_mod.unescape(text.strip())})
        if parsed_opts:
            categories[clean_label] = {"selectId": sel_id, "options": parsed_opts}

    if not categories:
        all_selects = re.findall(
            r'<select[^>]*(?:id|name)="([^"]*)"[^>]*>([\s\S]*?)</select>',
            html_str, re.I
        )
        for sel_id, sel_body in all_selects:
            options = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', sel_body, re.I)
            parsed_opts = []
            for val, text in options:
                if not val or val == "-1":
                    continue
                parsed_opts.append({"value": val, "text": html_mod.unescape(text.strip())})
            if parsed_opts:
                categories[sel_id] = {"selectId": sel_id, "options": parsed_opts}

    return categories


def main():
    print("=" * 60)
    print("  Extract Jeans + Chinos Design Options from Order Wizard")
    print("=" * 60)

    log("Initializing Pants wizard session...")
    guid = init_wizard()
    if not guid:
        log("FAILED to create wizard session. Cookie may be expired.")
        log("Update the COOKIE variable with a fresh session from your browser.")
        sys.exit(1)
    log(f"Session GUID: {guid}")

    wizard_html = get_wizard_page(guid)
    log(f"Wizard page: {len(wizard_html):,} bytes")

    with open(os.path.join(OUT, "wizard_pants.html"), "w") as f:
        f.write(wizard_html)

    all_results = {}

    for combo in COMBOS:
        combo_id = combo["id"]
        combo_name = combo["name"]
        part_id = combo["part_id"]

        print(f"\n{'─' * 55}")
        log(f"Processing: {combo_name} (combo={combo_id}, part={part_id})")
        print(f"{'─' * 55}")

        log("Selecting product combination...")
        primary_html = select_combo_and_get_primary_info(guid, combo_id)
        if len(primary_html) < 200:
            log(f"FAILED: primary info returned {len(primary_html)} bytes")
            log(f"Response: {primary_html[:200]}")
            continue
        log(f"Primary info: {len(primary_html):,} bytes")

        with open(os.path.join(OUT, f"primary_info_{combo_id}.html"), "w") as f:
            f.write(primary_html)

        make_match = re.search(r'<select[^>]*id="[^"]*[Mm]ake[^"]*"[^>]*>([\s\S]*?)</select>', primary_html)
        make_id = ""
        if make_match:
            make_opts = re.findall(r'<option[^>]*value="(\d+)"', make_match.group(1))
            if make_opts:
                make_id = make_opts[0]
                log(f"Using make_id={make_id}")

        log("Submitting primary info (advancing wizard)...")
        step1_resp = submit_primary_info(guid, combo_id, make_id)
        log(f"Step 1 response: {len(step1_resp)} bytes")

        with open(os.path.join(OUT, f"step1_response_{combo_id}.txt"), "w") as f:
            f.write(step1_resp)

        log("Navigating to step 2 (Fit & TryOn)...")
        step2 = goto_step(guid, 2)
        log(f"Step 2: {len(step2)} bytes")

        log("Navigating to step 3 (FitTools)...")
        step3 = goto_step(guid, 3)
        log(f"Step 3: {len(step3)} bytes")

        log("Navigating to step 4 (DesignOptions)...")
        step4 = goto_step(guid, 4)
        log(f"Step 4: {len(step4)} bytes")

        with open(os.path.join(OUT, f"step4_raw_{combo_id}.txt"), "w") as f:
            f.write(step4)

        design_html = ""
        try:
            j = json.loads(step4)
            design_html = j.get("MessageHtml", j.get("ViewString", ""))
            if isinstance(j, dict):
                log(f"Step 4 keys: {list(j.keys())}")
        except json.JSONDecodeError:
            design_html = step4
            log("Step 4 is not JSON, treating as raw HTML")

        if not design_html or len(design_html) < 200:
            log(f"Design options HTML too small ({len(design_html)} bytes)")
            log("Trying alternative: direct GET to GoToStep...")
            alt = curl("GET", f"{BASE}/g/{guid}/CustomOrder/GoToStep",
                       extra_headers=[f"Referer: {BASE}/g/{guid}/CustomOrder/Index"],
                       data=f"step=4")
            if len(alt) > len(design_html):
                design_html = alt
                log(f"Alternative returned {len(alt)} bytes")

        with open(os.path.join(OUT, f"design_options_{combo_id}.html"), "w") as f:
            f.write(design_html)

        categories = parse_design_options_html(design_html)
        log(f"Parsed {len(categories)} design option categories")

        for cat_name, cat_data in categories.items():
            n_opts = len(cat_data["options"])
            preview = ", ".join(o["text"] for o in cat_data["options"][:3])
            if n_opts > 3:
                preview += f" (+{n_opts - 3} more)"
            log(f"  {cat_name}: {n_opts} options [{preview}]")

        result = {
            "comboId": combo_id,
            "comboName": combo_name,
            "partId": part_id,
            "designOptions": categories,
            "rawHtmlSize": len(design_html),
        }
        all_results[str(combo_id)] = result

        with open(os.path.join(OUT, f"design_options_parsed_{combo_id}.json"), "w") as f:
            json.dump(result, f, indent=2)
        log(f"Saved design_options_parsed_{combo_id}.json")

    with open(os.path.join(OUT, "all_design_options.json"), "w") as f:
        json.dump(all_results, f, indent=2)

    print(f"\n{'=' * 60}")
    print("  SUMMARY")
    print(f"{'=' * 60}")
    for cid, r in all_results.items():
        cats = r["designOptions"]
        total_vals = sum(len(c["options"]) for c in cats.values())
        log(f"{r['comboName']}: {len(cats)} categories, {total_vals} option values")
    log(f"\nFiles saved to: {OUT}")
    print("=" * 60)


if __name__ == "__main__":
    main()
