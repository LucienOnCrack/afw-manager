#!/usr/bin/env python3
"""
Extract ALL remaining GoCreate combos and fit tools.
99 missing design option combos + 27 missing fit tool combos.
Resumable - skips already-extracted entries.
"""
import json, re, os, subprocess, sys, time

COOKIE = "ASP.NET_SessionId=kef4nm3qyjz2oif030vvvoek; MunroShopSitesFormAuthentication=734894C36A165619745FBA8249BEC8F8601C989B8BFE514FAFBAFAF914474D043DE79F959E40978978B9610DDEEAA5A4ADFB4E1667CDD4FAA6A7256C1865AECAC6AC667877E9B026A476F39F3998FBFE690EDADF7F918211A5AEBFCC565E1FAAF4EFC7F9862F96F539A2867DE423BF950C39EBA2"
BASE = "https://gocreate.nu"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "data", "gocreate-web")
TIMEOUT = 8

def curl_post(path, data=""):
    try:
        result = subprocess.run(
            ["curl", "-s", "--max-time", str(TIMEOUT), "--connect-timeout", "4",
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

def parse_design_opts(html):
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

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def main():
    print("=" * 60)
    print("  GoCreate: Extract ALL remaining combos & fit tools")
    print("=" * 60)

    sys.stdout.write("\nTesting session... ")
    sys.stdout.flush()
    code, body = curl_post("/Login/CheckIfSessionIsExpired")
    if code == 200:
        try:
            d = json.loads(body)
            if d.get("IsSessionExpired"):
                print("SESSION EXPIRED! Update the cookie.")
                sys.exit(1)
            print("OK")
        except:
            print(f"unexpected: {body[:100]}")
    else:
        print(f"HTTP {code} - may be expired")
        sys.exit(1)

    with open(os.path.join(OUT_DIR, "product_lines_makes_fits.json")) as f:
        plm = json.load(f)

    # ── PHASE 1: All remaining design option combos ──────────────────────
    DO_ALL_FILE = os.path.join(OUT_DIR, "design_options_all_combos.json")
    existing_combos = {}
    if os.path.exists(DO_ALL_FILE):
        with open(DO_ALL_FILE) as f:
            existing_combos = json.load(f)

    all_combos = []
    for pname, pinfo in plm.items():
        pid = pinfo["partId"]
        for pl in pinfo.get("productLines", []):
            for mk in pinfo.get("productMakes", []):
                for ft in pinfo.get("productFits", []):
                    key = f"part{pid}_{pname}_make{mk['id']}_fit{ft['id']}_atelier{pl['atelierId']}"
                    all_combos.append({
                        "key": key, "pid": pid, "pname": pname,
                        "makeId": mk["id"], "makeName": mk.get("name", "?"),
                        "fitId": ft["id"], "fitName": ft.get("name", "?"),
                        "atelierId": pl["atelierId"], "atelierName": pl.get("name", "?"),
                    })

    missing_combos = [c for c in all_combos if c["key"] not in existing_combos]
    total = len(all_combos)
    done = total - len(missing_combos)

    print(f"\n[1/2] Design Options: {done}/{total} done, {len(missing_combos)} remaining\n")

    for i, combo in enumerate(missing_combos):
        done += 1
        pct = done * 100 // total
        sys.stdout.write(f"  [{done}/{total} {pct}%] {combo['pname']:20s} make={combo['makeName']:30s} fit={combo['fitName']:12s} atelier={combo['atelierId']} ... ")
        sys.stdout.flush()

        data = (f"SelectedProductPartID={combo['pid']}"
                f"&SelectedProductMakeIDs={combo['makeId']}"
                f"&SelectedProductFitIDs={combo['fitId']}"
                f"&SelectedProductLineAtelierID={combo['atelierId']}")

        retries = 0
        success = False
        while retries < 3:
            code, body = curl_post("/ShopSettings/GetDesignOptions", data)
            if code == 200 and len(body) > 100:
                try:
                    resp = json.loads(body)
                    vs = resp.get("ViewString", "")
                    if resp.get("Status") and len(vs) > 200:
                        opts = parse_design_opts(vs)
                        if opts:
                            oc = sum(len(v["options"]) for v in opts.values())
                            existing_combos[combo["key"]] = {
                                "productPartId": combo["pid"], "productPart": combo["pname"],
                                "makeId": combo["makeId"], "makeName": combo["makeName"],
                                "fitId": combo["fitId"], "fitName": combo["fitName"],
                                "atelierId": combo["atelierId"],
                                "designOptions": opts,
                            }
                            print(f"{len(opts)} options, {oc} values")
                            success = True
                        else:
                            existing_combos[combo["key"]] = {
                                "productPartId": combo["pid"], "productPart": combo["pname"],
                                "empty": True
                            }
                            print("(no options in HTML)")
                            success = True
                    else:
                        existing_combos[combo["key"]] = {
                            "productPartId": combo["pid"], "productPart": combo["pname"],
                            "empty": True
                        }
                        print("(empty response)")
                        success = True
                except json.JSONDecodeError:
                    retries += 1
                    print(f"JSON error, retry {retries}...")
                    time.sleep(1)
                    continue
            else:
                retries += 1
                if retries < 3:
                    print(f"HTTP {code}, retry {retries}...")
                    time.sleep(1)
                else:
                    print(f"FAILED after 3 retries (HTTP {code})")
            break

        if (i + 1) % 5 == 0:
            save_json(DO_ALL_FILE, existing_combos)
        time.sleep(0.15)

    save_json(DO_ALL_FILE, existing_combos)
    non_empty = sum(1 for v in existing_combos.values() if not v.get("empty"))
    print(f"\n  Saved: {len(existing_combos)} total combos ({non_empty} with options)")

    # ── PHASE 2: All remaining fit tools (per part x fit) ────────────────
    FT_FILE = os.path.join(OUT_DIR, "fit_tools_all_parts.json")
    existing_ft = {}
    if os.path.exists(FT_FILE):
        with open(FT_FILE) as f:
            existing_ft = json.load(f)

    extracted_pairs = set()
    for key, val in existing_ft.items():
        extracted_pairs.add((val["productPartId"], val.get("fitId", 0)))

    all_part_fits = []
    for pname, pinfo in plm.items():
        pid = pinfo["partId"]
        for ft in pinfo.get("productFits", []):
            if (pid, ft["id"]) not in extracted_pairs:
                all_part_fits.append({
                    "pid": pid, "pname": pname,
                    "fitId": ft["id"], "fitName": ft.get("name", "?"),
                })

    total_ft = len(extracted_pairs) + len(all_part_fits)
    done_ft = len(extracted_pairs)

    print(f"\n[2/2] Fit Tools: {done_ft}/{total_ft} done, {len(all_part_fits)} remaining\n")

    for i, pf in enumerate(all_part_fits):
        done_ft += 1
        pct = done_ft * 100 // total_ft
        sys.stdout.write(f"  [{done_ft}/{total_ft} {pct}%] {pf['pname']:20s} fit={pf['fitName']:12s} (fitId={pf['fitId']}) ... ")
        sys.stdout.flush()

        data = f"SelectedProductPartID={pf['pid']}&SelectedProductFitID={pf['fitId']}"
        code, body = curl_post("/ShopSettings/GetFitTools", data)

        key = f"part{pf['pid']}_{pf['pname']}_fit{pf['fitId']}"
        if code == 200 and len(body) > 100:
            labels = [l.strip() for l in re.findall(r'<label[^>]*>([^<]+)</label>', body) if l.strip()]
            labels = [l for l in labels if l not in ("FitTools", "Is visible", "Do not show this message again", "#")]
            if labels:
                existing_ft[key] = {
                    "productPartId": pf["pid"], "productPart": pf["pname"],
                    "fitId": pf["fitId"],
                    "fitTools": labels,
                }
                print(f"{len(labels)} tools")
            else:
                existing_ft[key] = {
                    "productPartId": pf["pid"], "productPart": pf["pname"],
                    "fitId": pf["fitId"],
                    "fitTools": [],
                }
                print("(no tools)")
        else:
            existing_ft[key] = {
                "productPartId": pf["pid"], "productPart": pf["pname"],
                "fitId": pf["fitId"],
                "fitTools": [],
            }
            print(f"(HTTP {code})")

        save_json(FT_FILE, existing_ft)
        time.sleep(0.15)

    has_tools = sum(1 for v in existing_ft.values() if v.get("fitTools"))
    print(f"\n  Saved: {len(existing_ft)} entries ({has_tools} with tools)")

    # ── Summary ──────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  ALL EXTRACTION COMPLETE")
    print("=" * 60)

    # Compute total unique values across all combos merged
    merged_vals = {}
    for key, entry in existing_combos.items():
        if entry.get("empty"):
            continue
        pid = entry["productPartId"]
        if pid not in merged_vals:
            merged_vals[pid] = {}
        for opt_name, opt_data in entry.get("designOptions", {}).items():
            if opt_name not in merged_vals[pid]:
                merged_vals[pid][opt_name] = set()
            for v in opt_data["options"]:
                merged_vals[pid][opt_name].add(v["value"])

    total_opts = sum(len(v) for v in merged_vals.values())
    total_vals = sum(len(vals) for part in merged_vals.values() for vals in part.values())
    print(f"  Total unique options across all parts: {total_opts}")
    print(f"  Total unique option VALUES across all combos: {total_vals}")
    print(f"  Total fit tool entries: {len(existing_ft)} ({has_tools} with tools)")

if __name__ == "__main__":
    main()
