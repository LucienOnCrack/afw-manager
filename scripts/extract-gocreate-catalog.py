#!/usr/bin/env python3
"""
Resilient GoCreate catalog extraction.
Uses curl subprocess for hard timeouts. Resumable - skips already-downloaded parts.

Usage:
    python3 scripts/extract-gocreate-catalog.py

Requires the GoCreate session cookie (hardcoded below - update if expired).
"""
import json, re, os, subprocess, sys, time

COOKIE = "ASP.NET_SessionId=kef4nm3qyjz2oif030vvvoek; MunroShopSitesFormAuthentication=734894C36A165619745FBA8249BEC8F8601C989B8BFE514FAFBAFAF914474D043DE79F959E40978978B9610DDEEAA5A4ADFB4E1667CDD4FAA6A7256C1865AECAC6AC667877E9B026A476F39F3998FBFE690EDADF7F918211A5AEBFCC565E1FAAF4EFC7F9862F96F539A2867DE423BF950C39EBA2"
BASE = "https://gocreate.nu"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "data", "gocreate-web")
os.makedirs(OUT_DIR, exist_ok=True)

TIMEOUT = 6

def curl_post(path, data=""):
    """POST via curl with hard timeout. Returns (http_code, body_text)."""
    try:
        result = subprocess.run(
            ["curl", "-s", "--max-time", str(TIMEOUT), "--connect-timeout", "3",
             "-w", "\n__HTTP_CODE__%{http_code}", "-X", "POST",
             "-b", COOKIE,
             "-H", "X-Requested-With: XMLHttpRequest",
             "-H", "Content-Type: application/x-www-form-urlencoded",
             "-d", data,
             f"{BASE}{path}"],
            capture_output=True, text=True, timeout=TIMEOUT + 5
        )
        out = result.stdout
        idx = out.rfind("__HTTP_CODE__")
        if idx == -1:
            return 0, ""
        code = int(out[idx + 13:].strip())
        body = out[:idx]
        return code, body
    except (subprocess.TimeoutExpired, Exception) as e:
        return 0, f"ERROR: {e}"

def curl_get(path):
    """GET via curl with hard timeout."""
    try:
        result = subprocess.run(
            ["curl", "-s", "--max-time", str(TIMEOUT), "--connect-timeout", "3",
             "-w", "\n__HTTP_CODE__%{http_code}",
             "-b", COOKIE,
             "-H", "X-Requested-With: XMLHttpRequest",
             f"{BASE}{path}"],
            capture_output=True, text=True, timeout=TIMEOUT + 5
        )
        out = result.stdout
        idx = out.rfind("__HTTP_CODE__")
        if idx == -1:
            return 0, ""
        code = int(out[idx + 13:].strip())
        body = out[:idx]
        return code, body
    except (subprocess.TimeoutExpired, Exception) as e:
        return 0, f"ERROR: {e}"

def parse_design_opts(html):
    """Parse design option dropdowns from ShopSettings HTML."""
    result = {}
    for label, sel_id, sel_body in re.findall(
        r'<label[^>]*>([^<]*)</label>[\s\S]*?<select[^>]*(?:id|name)="([^"]*)"[^>]*>([\s\S]*?)</select>',
        html, re.I
    ):
        opts = [{"value": v, "text": t} for v, t in
                re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]*)</option>', sel_body)
                if v and v != "-1"]
        if opts:
            result[label.strip()] = {"selectId": sel_id, "options": opts}
    return result

# ──────────────────────────────────────────────────────────────────────────────
# Part 1: Product Lines / Makes / Fits per part
# ──────────────────────────────────────────────────────────────────────────────

PARTS = {
    1: "Jacket", 2: "Trousers", 3: "Waistcoat", 4: "Shirt",
    5: "Overcoat", 12: "Bermuda", 13: "Pea coat",
    26: "Coat", 27: "Detachable liner", 31: "Informal jacket",
}

PLM_FILE = os.path.join(OUT_DIR, "product_lines_makes_fits.json")

def extract_product_lines_makes_fits():
    if os.path.exists(PLM_FILE):
        with open(PLM_FILE) as f:
            existing = json.load(f)
        if len(existing) >= len(PARTS):
            print(f"  [SKIP] product_lines_makes_fits.json already has {len(existing)} parts")
            return existing

    print("  Fetching product lines/makes/fits per part...")
    configs = {}
    for pid, pname in PARTS.items():
        code, body = curl_get(f"/ShopSettings/GetProductLineMakeAndFits?productPartId={pid}")
        if code == 200 and body:
            try:
                data = json.loads(body)
                cfg = {"partId": pid, "partName": pname}
                if data.get("ProductLines"):
                    cfg["productLines"] = [{"atelierId": pl["AtelierId"], "name": pl["ProductLineLocalizedName"]} for pl in data["ProductLines"]]
                if data.get("ProductMakes"):
                    cfg["productMakes"] = [{"id": pm["ID"], "name": pm["Name"]} for pm in data["ProductMakes"]]
                if data.get("ProductFits"):
                    cfg["productFits"] = [{"id": pf["ID"], "name": pf["Name"]} for pf in data["ProductFits"]]
                configs[pname] = cfg
                print(f"    {pname}: {len(cfg.get('productMakes',[]))} makes, {len(cfg.get('productFits',[]))} fits")
            except json.JSONDecodeError:
                print(f"    {pname}: JSON decode error")
        else:
            print(f"    {pname}: HTTP {code}")
    with open(PLM_FILE, "w") as f:
        json.dump(configs, f, indent=2)
    return configs

# ──────────────────────────────────────────────────────────────────────────────
# Part 2: Design Options per part (using correct make/fit combos)
# ──────────────────────────────────────────────────────────────────────────────

DO_FILE = os.path.join(OUT_DIR, "design_options_all_parts.json")

def extract_design_options(plm_configs):
    existing = {}
    if os.path.exists(DO_FILE):
        with open(DO_FILE) as f:
            existing = json.load(f)
    already_done = {v["productPartId"] for v in existing.values()}

    parts_todo = {pid: pname for pid, pname in PARTS.items() if pid not in already_done}
    if not parts_todo:
        print(f"  [SKIP] design_options_all_parts.json already has all {len(PARTS)} parts")
        return existing

    print(f"  Extracting design options for {len(parts_todo)} remaining parts...")
    for pid, pname in parts_todo.items():
        cfg = plm_configs.get(pname, {})
        product_lines = cfg.get("productLines", [{"atelierId": 1}])
        product_makes = cfg.get("productMakes", [{"id": 8}])
        product_fits = cfg.get("productFits", [{"id": 38}])

        found = False
        for pl in product_lines:
            if found: break
            for mk in product_makes:
                if found: break
                for ft in product_fits:
                    data = f"SelectedProductPartID={pid}&SelectedProductMakeIDs={mk['id']}&SelectedProductFitIDs={ft['id']}&SelectedProductLineAtelierID={pl['atelierId']}"
                    code, body = curl_post("/ShopSettings/GetDesignOptions", data)
                    if code == 200 and len(body) > 200:
                        try:
                            resp = json.loads(body)
                            vs = resp.get("ViewString", "")
                            if resp.get("Status") and len(vs) > 500:
                                opts = parse_design_opts(vs)
                                if opts:
                                    key = f"part{pid}_{pname}_make{mk['id']}_fit{ft['id']}_atelier{pl['atelierId']}"
                                    existing[key] = {
                                        "productPartId": pid, "productPart": pname,
                                        "makeId": mk["id"], "fitId": ft["id"], "atelierId": pl["atelierId"],
                                        "designOptions": opts,
                                    }
                                    oc = sum(len(v["options"]) for v in opts.values())
                                    print(f"    {pname:20s}: {len(opts)} options, {oc} values (make={mk.get('name','?')}, fit={ft.get('name','?')})")
                                    with open(DO_FILE, "w") as f:
                                        json.dump(existing, f, indent=2)
                                    found = True
                                    break
                        except json.JSONDecodeError:
                            pass
                    time.sleep(0.2)
        if not found:
            print(f"    {pname:20s}: NO DESIGN OPTIONS FOUND")
    return existing

# ──────────────────────────────────────────────────────────────────────────────
# Part 3: Fit Tools per part (all 29 fittools parts)
# ──────────────────────────────────────────────────────────────────────────────

FT_FILE = os.path.join(OUT_DIR, "fit_tools_all_parts.json")

FITTOOL_PARTS = {
    1: "Jacket", 2: "Trousers", 3: "Waistcoat", 4: "Shirt",
    5: "Overcoat", 12: "Bermuda", 13: "Pea coat", 14: "5 Pocket",
    15: "Chino", 16: "Formal round", 18: "Informal", 20: "Flex",
    21: "Sneaker", 22: "Tie", 23: "Bow tie", 24: "Pocket square",
    25: "Belt", 26: "Coat", 27: "Detachable liner", 31: "Informal jacket",
    32: "Knitwear", 33: "City loafer", 34: "Beanie", 35: "Scarf",
    36: "Quilted vest", 37: "Cummerbund", 38: "Vest", 40: "Pants", 41: "Runner",
}

FITTOOL_FITS = [38, 41, 39, 1, 40, 42, 43, 44, 45]

def extract_fit_tools():
    existing = {}
    if os.path.exists(FT_FILE):
        with open(FT_FILE) as f:
            existing = json.load(f)
    already_done = {v["productPartId"] for v in existing.values()}

    parts_todo = {pid: pname for pid, pname in FITTOOL_PARTS.items() if pid not in already_done}
    if not parts_todo:
        print(f"  [SKIP] fit_tools_all_parts.json already has all {len(FITTOOL_PARTS)} parts")
        return existing

    total = len(FITTOOL_PARTS)
    done_count = len(already_done)
    print(f"  Extracting fit tools for {len(parts_todo)} remaining parts (have {done_count}/{total})...")

    for pid, pname in parts_todo.items():
        done_count += 1
        sys.stdout.write(f"    [{done_count}/{total}] {pname:20s}")
        sys.stdout.flush()

        found = False
        for fid in FITTOOL_FITS:
            data = f"SelectedProductPartID={pid}&SelectedProductFitID={fid}"
            code, body = curl_post("/ShopSettings/GetFitTools", data)

            if code == 200 and len(body) > 300:
                labels = [l.strip() for l in re.findall(r'<label[^>]*>([^<]+)</label>', body) if l.strip()]
                labels = [l for l in labels if l not in ("FitTools", "Is visible", "Do not show this message again", "#")]
                if labels:
                    existing[f"part{pid}_{pname}_fit{fid}"] = {
                        "productPartId": pid, "productPart": pname, "fitId": fid,
                        "fitTools": labels,
                    }
                    with open(FT_FILE, "w") as f:
                        json.dump(existing, f, indent=2)
                    print(f" -> {len(labels)} tools (fit={fid})")
                    found = True
                    break

        if not found:
            existing[f"part{pid}_{pname}_none"] = {
                "productPartId": pid, "productPart": pname, "fitId": 0,
                "fitTools": [],
            }
            with open(FT_FILE, "w") as f:
                json.dump(existing, f, indent=2)
            print(f" -> (no fit tools)")

    return existing

# ──────────────────────────────────────────────────────────────────────────────
# Part 4: Additional design option combos (multiple makes per part)
# ──────────────────────────────────────────────────────────────────────────────

DO_ALL_FILE = os.path.join(OUT_DIR, "design_options_all_combos.json")

def extract_all_design_option_combos(plm_configs):
    existing = {}
    if os.path.exists(DO_ALL_FILE):
        with open(DO_ALL_FILE) as f:
            existing = json.load(f)

    print(f"  Extracting design options for ALL make/fit combos...")
    total_combos = 0
    new_combos = 0

    for pname, cfg in plm_configs.items():
        pid = cfg["partId"]
        product_lines = cfg.get("productLines", [])
        product_makes = cfg.get("productMakes", [])
        product_fits = cfg.get("productFits", [])

        for pl in product_lines:
            for mk in product_makes:
                for ft in product_fits:
                    total_combos += 1
                    key = f"part{pid}_{pname}_make{mk['id']}_fit{ft['id']}_atelier{pl['atelierId']}"
                    if key in existing:
                        continue

                    data = f"SelectedProductPartID={pid}&SelectedProductMakeIDs={mk['id']}&SelectedProductFitIDs={ft['id']}&SelectedProductLineAtelierID={pl['atelierId']}"
                    code, body = curl_post("/ShopSettings/GetDesignOptions", data)
                    if code == 200 and len(body) > 200:
                        try:
                            resp = json.loads(body)
                            vs = resp.get("ViewString", "")
                            if resp.get("Status") and len(vs) > 500:
                                opts = parse_design_opts(vs)
                                if opts:
                                    existing[key] = {
                                        "productPartId": pid, "productPart": pname,
                                        "makeId": mk["id"], "makeName": mk.get("name"),
                                        "fitId": ft["id"], "fitName": ft.get("name"),
                                        "atelierId": pl["atelierId"],
                                        "designOptions": opts,
                                    }
                                    oc = sum(len(v["options"]) for v in opts.values())
                                    new_combos += 1
                                    print(f"    {pname} make={mk.get('name','?')} fit={ft.get('name','?')}: {len(opts)} options, {oc} values")
                                    with open(DO_ALL_FILE, "w") as f:
                                        json.dump(existing, f, indent=2)
                            else:
                                existing[key] = {"productPartId": pid, "productPart": pname, "empty": True}
                        except json.JSONDecodeError:
                            pass
                    time.sleep(0.15)

    with open(DO_ALL_FILE, "w") as f:
        json.dump(existing, f, indent=2)
    print(f"  Total combos: {total_combos}, new extracted: {new_combos}, total in file: {len(existing)}")
    return existing


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  GoCreate Catalog Extraction")
    print("=" * 60)

    # Test session
    sys.stdout.write("\nTesting session... ")
    sys.stdout.flush()
    code, body = curl_post("/Login/CheckIfSessionIsExpired")
    if code == 200:
        try:
            d = json.loads(body)
            if d.get("IsSessionExpired"):
                print("SESSION EXPIRED! Update the cookie in this script.")
                sys.exit(1)
            print("OK (session active)")
        except:
            print(f"unexpected response: {body[:100]}")
    else:
        print(f"HTTP {code} - session may be expired")

    print("\n[1/4] Product Lines, Makes & Fits")
    plm = extract_product_lines_makes_fits()

    print("\n[2/4] Design Options (one combo per part)")
    extract_design_options(plm)

    print("\n[3/4] Fit Tools (29 parts)")
    extract_fit_tools()

    print("\n[4/4] Design Options (all make/fit combos)")
    extract_all_design_option_combos(plm)

    print("\n" + "=" * 60)
    print("  EXTRACTION COMPLETE")
    print("=" * 60)

    # Print summary
    for fname in ["product_lines_makes_fits.json", "design_options_all_parts.json",
                   "fit_tools_all_parts.json", "design_options_all_combos.json"]:
        fpath = os.path.join(OUT_DIR, fname)
        if os.path.exists(fpath):
            size = os.path.getsize(fpath)
            print(f"  {fname}: {size/1024:.1f} KB")

if __name__ == "__main__":
    main()
