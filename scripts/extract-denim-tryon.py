#!/usr/bin/env python3
"""
Extract TryOn data for denim parts (5 Pocket / Chino) from GoCreate.

The DenimOrder flow has a 3-level TryOn hierarchy:
  TryOn Fit → TryOn Type → TryOn Size

Standard parts only have Fit → Size, but denim adds the Type level
(e.g. "Rigid", "Stretch") and uses waist/inseam sizes like "46/30".

This script:
  1. Creates a Pants order session in GoCreate
  2. Selects each combo (Jeans / Chinos)
  3. Navigates to step 2 (Fit & TryOn)
  4. Extracts TryOn fits, types, and sizes from the HTML
  5. Calls /CustomOrder/FillTryOnSizes for each fit to get full size data
  6. Imports the data into catalog_extracted.gc_tryon_sizes

Requires a valid GoCreate session cookie.
"""
import subprocess, json, re, os, sys, time, html as html_mod

COOKIE = "ASP.NET_SessionId=hz3glp3lirj44i2oohgwzyvw; MunroShopSitesFormAuthentication=5E2F7108E62DD67E87BC74CB6C37347C17E4166B99A0FE66272120BC0A77CA7B627FEAC1E15BE3995678B9BA2CA66C1BD07099F3AE0A090093E4C420DF41FDF3716FE7515B3F4FE235141790C8415D370A0E38CE2DA72622859A12B0304C2BC26BD4D47C5864F53A045CCAF655B94D3A38F9D95D"
BASE = "https://gocreate.nu"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
OUT = os.path.join(BASE_DIR, "data", "gocreate-jeans")
os.makedirs(OUT, exist_ok=True)

SUPABASE_URL = None
SUPABASE_KEY = None

PANTS_GROUP_ID = 8
PANTS_TYPE_ID = 10
COMBOS = [
    {"id": 21, "name": "Jeans / 5 Pockets", "part_id": 14, "fit_id": 37},
    {"id": 22, "name": "Chinos", "part_id": 15, "fit_id": 38},
]


def load_env():
    global SUPABASE_URL, SUPABASE_KEY
    with open(os.path.join(BASE_DIR, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                SUPABASE_URL = line.split("=", 1)[1].strip().strip('"')
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                SUPABASE_KEY = line.split("=", 1)[1].strip().strip('"')


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


def sb(method, table, data=None, params=""):
    schema, tbl = table.split(".", 1) if "." in table else ("public", table)
    qs = f"?{params}" if params else ""
    url = f"{SUPABASE_URL}/rest/v1/{tbl}{qs}"
    prefer = ""
    if method == "POST":
        prefer = "resolution=merge-duplicates,return=representation"
    elif method in ("PATCH", "DELETE"):
        prefer = "return=minimal"
    headers = [
        "-H", f"apikey: {SUPABASE_KEY}",
        "-H", f"Authorization: Bearer {SUPABASE_KEY}",
        "-H", "Content-Type: application/json",
        "-H", f"Prefer: {prefer}",
        "-H", f"Accept-Profile: {schema}",
        "-H", f"Content-Profile: {schema}",
    ]
    cmd = ["curl", "-s", "-w", "\n%{http_code}", "-X", method, url] + headers
    if data is not None:
        cmd += ["-d", json.dumps(data)]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    raw = result.stdout.strip()
    lines = raw.rsplit("\n", 1)
    if len(lines) == 2:
        body_str, code_str = lines
    else:
        body_str, code_str = raw, "0"
    code = int(code_str) if code_str.isdigit() else 0
    if body_str:
        try:
            return code, json.loads(body_str)
        except json.JSONDecodeError:
            return code, body_str
    return code, ""


# ── GoCreate wizard navigation ────────────────────────────────────

def init_wizard():
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


def select_combo_and_get_primary_info(guid, combo_id):
    url = f"{BASE}/g/{guid}/CustomOrder/GetPrimaryInformationMakeView"
    data = f"combinationID={combo_id}&quantity=1&isDuplicateOrder=false&isCallFromResetSSOOrderCopy=false"
    return curl("POST", url, data, extra_headers=[
        f"Referer: {BASE}/g/{guid}/CustomOrder/Index", "Accept: */*"])


def submit_primary_info(guid, combo_id, make_id, fabric_id="", fit_id=""):
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


def fill_tryon_sizes(guid, part_id, fit_id, advise_id=1):
    url = f"{BASE}/g/{guid}/CustomOrder/FillTryOnSizes"
    data = f"productPartID={part_id}&productFitID={fit_id}&adviseID={advise_id}"
    resp = curl("GET", f"{url}?{data}", extra_headers=[
        f"Referer: {BASE}/g/{guid}/CustomOrder/Index", "Accept: application/json"])
    try:
        return json.loads(resp)
    except:
        return None


def fill_tryon_sizes_customer(part_id, fit_id):
    url = f"{BASE}/Customer/FillTryOnSizes"
    resp = curl("GET", f"{url}?productPartID={part_id}&productFitID={fit_id}")
    try:
        return json.loads(resp)
    except:
        return None


# ── Parsing ───────────────────────────────────────────────────────

def parse_fit_and_tryon_html(html_str):
    """Parse step 2 HTML for TryOn fits, types, and sizes."""
    result = {"fits": [], "types": [], "sizes": [], "raw_selects": {}}

    selects = re.findall(
        r'<select[^>]*(?:id|name)="([^"]*)"[^>]*>([\s\S]*?)</select>',
        html_str, re.I
    )

    for sel_id, sel_body in selects:
        options = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', sel_body, re.I)
        parsed = [{"value": v, "text": html_mod.unescape(t.strip())} for v, t in options if v and v != "-1"]
        if parsed:
            result["raw_selects"][sel_id] = parsed

        sid_lower = sel_id.lower()
        if "productfit" in sid_lower or "ddproductfit" in sid_lower:
            result["fits"] = parsed
        elif "tryontype" in sid_lower:
            result["types"] = parsed
        elif "tryonsize" in sid_lower:
            result["sizes"] = parsed

    return result


def parse_step2_json(resp_str):
    """Try parsing step2 response as JSON to extract ViewString/MessageHtml."""
    try:
        j = json.loads(resp_str)
        html_content = j.get("ViewString", j.get("MessageHtml", ""))
        return html_content, j
    except json.JSONDecodeError:
        return resp_str, None


# ── Main ──────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Extract Denim TryOn Data (Jeans + Chinos)")
    print("=" * 60)

    load_env()
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("WARNING: No Supabase credentials — will extract only, not import")

    log("Initializing Pants wizard session...")
    guid = init_wizard()
    if not guid:
        log("FAILED to create wizard session. Cookie may be expired.")
        log("Update the COOKIE variable with a fresh session from your browser.")
        sys.exit(1)
    log(f"Session GUID: {guid}")

    all_tryon_data = {}

    for combo in COMBOS:
        combo_id = combo["id"]
        combo_name = combo["name"]
        part_id = combo["part_id"]
        gc_fit_id = combo["fit_id"]

        print(f"\n{'─' * 55}")
        log(f"Processing: {combo_name} (combo={combo_id}, part={part_id})")
        print(f"{'─' * 55}")

        # Select combo
        log("Selecting product combination...")
        primary_html = select_combo_and_get_primary_info(guid, combo_id)
        if len(primary_html) < 200:
            log(f"FAILED: primary info returned {len(primary_html)} bytes")
            continue
        log(f"Primary info: {len(primary_html):,} bytes")

        make_match = re.search(r'<select[^>]*id="[^"]*[Mm]ake[^"]*"[^>]*>([\s\S]*?)</select>', primary_html)
        make_id = ""
        if make_match:
            make_opts = re.findall(r'<option[^>]*value="(\d+)"', make_match.group(1))
            if make_opts:
                make_id = make_opts[0]
                log(f"Using make_id={make_id}")

        # Submit to advance
        log("Submitting primary info...")
        submit_primary_info(guid, combo_id, make_id)

        # Step 2: Fit & TryOn
        log("Navigating to step 2 (Fit & TryOn)...")
        step2_resp = goto_step(guid, 2)
        step2_html, step2_json = parse_step2_json(step2_resp)
        log(f"Step 2: {len(step2_html):,} bytes HTML")

        with open(os.path.join(OUT, f"step2_fit_tryon_{combo_id}.html"), "w") as f:
            f.write(step2_html)
        if step2_json:
            with open(os.path.join(OUT, f"step2_fit_tryon_{combo_id}.json"), "w") as f:
                json.dump(step2_json, f, indent=2)

        tryon_data = parse_fit_and_tryon_html(step2_html)
        log(f"Fits: {len(tryon_data['fits'])}  Types: {len(tryon_data['types'])}  Sizes: {len(tryon_data['sizes'])}")

        for sel_id, opts in tryon_data["raw_selects"].items():
            preview = ", ".join(o["text"] for o in opts[:4])
            if len(opts) > 4:
                preview += f" (+{len(opts)-4} more)"
            log(f"  Select [{sel_id}]: {len(opts)} options — {preview}")

        # Try FillTryOnSizes via wizard for each fit
        log("Calling FillTryOnSizes for each fit...")
        tryon_by_fit = {}

        fits_to_try = tryon_data["fits"] if tryon_data["fits"] else [{"value": str(gc_fit_id), "text": "P14" if part_id == 14 else "P15"}]

        for fit in fits_to_try:
            fit_id_val = fit["value"]
            fit_name = fit["text"]
            log(f"  Fit: {fit_name} (id={fit_id_val})...")

            # Try via wizard endpoint
            data = fill_tryon_sizes(guid, part_id, fit_id_val)
            if data and data.get("TryOnSizes"):
                sizes = [{"value": s["Value"], "text": s["Text"]} for s in data["TryOnSizes"]]
                types_data = data.get("TryOnTypes", [])
                types = [{"id": t.get("TryOnTypeId", t.get("ID", "")), "name": t.get("TryOnType", t.get("Name", ""))} for t in types_data] if types_data else []
                log(f"    → {len(sizes)} sizes, {len(types)} types")
                tryon_by_fit[fit_id_val] = {"fitId": fit_id_val, "fitName": fit_name, "sizes": sizes, "types": types, "source": "wizard"}
            else:
                log(f"    → Wizard returned nothing, trying Customer endpoint...")
                data2 = fill_tryon_sizes_customer(part_id, fit_id_val)
                if data2 and data2.get("TryOnSizes"):
                    sizes = [{"value": s["Value"], "text": s["Text"]} for s in data2["TryOnSizes"]]
                    types_data = data2.get("TryOnTypes", [])
                    types = [{"id": t.get("TryOnTypeId", t.get("ID", "")), "name": t.get("TryOnType", t.get("Name", ""))} for t in types_data] if types_data else []
                    log(f"    → {len(sizes)} sizes, {len(types)} types (Customer endpoint)")
                    tryon_by_fit[fit_id_val] = {"fitId": fit_id_val, "fitName": fit_name, "sizes": sizes, "types": types, "source": "customer"}
                else:
                    log(f"    → No TryOn data returned from either endpoint")
                    log(f"    → Response: {str(data2)[:200]}")

        # If we got types, try FillTryOnSizes per type too
        for fit_val, fit_data in list(tryon_by_fit.items()):
            if fit_data["types"]:
                log(f"  Fetching sizes per TryOn Type for fit {fit_data['fitName']}...")
                sizes_by_type = {}
                for t in fit_data["types"]:
                    type_id = t["id"]
                    type_name = t["name"]
                    # TryOn types may require a different endpoint or parameter
                    type_url = f"{BASE}/g/{guid}/CustomOrder/FillTryOnSizes?productPartID={part_id}&productFitID={fit_val}&tryOnTypeID={type_id}&adviseID=1"
                    resp = curl("GET", type_url, extra_headers=[f"Referer: {BASE}/g/{guid}/CustomOrder/Index"])
                    try:
                        type_data = json.loads(resp)
                        if type_data and type_data.get("TryOnSizes"):
                            type_sizes = [{"value": s["Value"], "text": s["Text"]} for s in type_data["TryOnSizes"]]
                            sizes_by_type[type_name] = type_sizes
                            log(f"    Type '{type_name}': {len(type_sizes)} sizes")
                    except:
                        pass
                if sizes_by_type:
                    fit_data["sizesByType"] = sizes_by_type

        combo_result = {
            "comboId": combo_id,
            "comboName": combo_name,
            "partId": part_id,
            "gcFitId": gc_fit_id,
            "tryon": tryon_data,
            "tryonByFit": tryon_by_fit,
        }
        all_tryon_data[str(combo_id)] = combo_result

    # Save extracted data
    out_path = os.path.join(OUT, "tryon_data_all.json")
    with open(out_path, "w") as f:
        json.dump(all_tryon_data, f, indent=2)
    log(f"\nSaved: {out_path}")

    # ── Import to Supabase ────────────────────────────────────────
    if SUPABASE_URL and SUPABASE_KEY and all_tryon_data:
        print(f"\n{'─' * 55}")
        log("Importing TryOn data to Supabase...")
        print(f"{'─' * 55}")

        for combo_key, combo_data in all_tryon_data.items():
            part_id = combo_data["partId"]
            gc_fit_id = combo_data["gcFitId"]
            combo_name = combo_data["comboName"]

            # Clear old borrowed data
            log(f"Clearing old TryOn data for part {part_id}...")
            sb("DELETE", "catalog_extracted.gc_tryon_sizes", params=f"part_id=eq.{part_id}")

            rows = []
            sort = 0
            tryon_by_fit = combo_data.get("tryonByFit", {})

            for fit_val, fit_data in tryon_by_fit.items():
                fit_name = fit_data["fitName"]

                if fit_data.get("sizesByType"):
                    for type_name, type_sizes in fit_data["sizesByType"].items():
                        for s in type_sizes:
                            rows.append({
                                "part_id": part_id,
                                "fit_id": gc_fit_id,
                                "label": s["text"],
                                "value": s["value"],
                                "tryon_type": f"{fit_name} / {type_name}" if fit_name else type_name,
                                "sort_order": sort,
                            })
                            sort += 1
                elif fit_data.get("types"):
                    for s in fit_data["sizes"]:
                        rows.append({
                            "part_id": part_id,
                            "fit_id": gc_fit_id,
                            "label": s["text"],
                            "value": s["value"],
                            "tryon_type": fit_name,
                            "sort_order": sort,
                        })
                        sort += 1
                else:
                    for s in fit_data["sizes"]:
                        rows.append({
                            "part_id": part_id,
                            "fit_id": gc_fit_id,
                            "label": s["text"],
                            "value": s["value"],
                            "tryon_type": None,
                            "sort_order": sort,
                        })
                        sort += 1

            if rows:
                batch_size = 200
                total = 0
                for i in range(0, len(rows), batch_size):
                    batch = rows[i:i+batch_size]
                    code, _ = sb("POST", "catalog_extracted.gc_tryon_sizes", batch)
                    if code in (200, 201):
                        total += len(batch)
                log(f"{combo_name}: imported {total} TryOn sizes")
            else:
                log(f"{combo_name}: no TryOn sizes to import")

    # Summary
    print(f"\n{'=' * 60}")
    print("  SUMMARY")
    print(f"{'=' * 60}")
    for combo_key, combo_data in all_tryon_data.items():
        name = combo_data["comboName"]
        fits = combo_data.get("tryonByFit", {})
        total = sum(len(f.get("sizes", [])) for f in fits.values())
        types = sum(len(f.get("types", [])) for f in fits.values())
        log(f"{name}: {len(fits)} fits, {types} types, {total} sizes")
        for fv, fd in fits.items():
            log(f"  Fit {fd['fitName']} ({fv}): {len(fd.get('sizes', []))} sizes, {len(fd.get('types', []))} types")
            if fd.get("sizesByType"):
                for tn, ts in fd["sizesByType"].items():
                    log(f"    Type '{tn}': {len(ts)} sizes")
    log(f"\nFiles saved to: {OUT}")
    print("=" * 60)


if __name__ == "__main__":
    main()
