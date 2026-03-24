#!/usr/bin/env python3
"""Extract design options for ALL product parts from GoCreate ShopSettings.

Uses product_lines_makes_fits.json for the actual valid make/fit/atelier
combos per part instead of brute-forcing.
"""
import json, re, os, urllib.request, time, sys

COOKIE = "ASP.NET_SessionId=vjy1b23y1jjkobt2a3nsglb3; MunroShopSitesFormAuthentication=4A87319A48CA9D90FEC516E2C767185DCA423AEED09E047F36422AFED4622857E094B1113A9C34F0C112FBFE54906141555FD9186E26F94675C4DFC024F5DCCB2F92468EFC2FB4245FCD75B21A67AF72A422204751BFCD6173FF310EF1C681A718D47D4D61E6C4A527EB70D1AC0C951544C35FD8"
BASE = "https://gocreate.nu"
DIR = "/Users/lucien/poopy doopy fabric dookie/data/gocreate-web"


def log(msg, end="\n"):
    sys.stdout.write(msg + end)
    sys.stdout.flush()


def fetch_post(path, data=""):
    headers = {
        "Cookie": COOKIE,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    req = urllib.request.Request(BASE + path, data=data.encode(), headers=headers, method="POST")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            elapsed = time.time() - t0
            if elapsed > 5:
                log(f" [slow: {elapsed:.1f}s]", end="")
            return resp.status, body
    except urllib.error.HTTPError as e:
        elapsed = time.time() - t0
        log(f" [HTTP err {e.code} {elapsed:.1f}s]", end="")
        return e.code, ""
    except Exception as e:
        elapsed = time.time() - t0
        log(f" [ERR: {e} {elapsed:.1f}s]", end="")
        return 0, str(e)


def parse_design_options(view_html):
    """Parse design option dropdowns from HTML."""
    labels_and_selects = re.findall(
        r'<label[^>]*>([^<]*)</label>[\s\S]*?<select[^>]*(?:id|name)="([^"]*)"[^>]*>([\s\S]*?)</select>',
        view_html, re.I,
    )
    options_data = {}
    for label, sel_id, sel_body in labels_and_selects:
        options = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]*)</option>', sel_body)
        if options:
            options_data[label.strip()] = {
                "selectId": sel_id,
                "options": [{"value": v, "text": t} for v, t in options if v and v != "-1"],
            }

    selects = re.findall(r'<select[^>]*(?:id|name)="([^"]*)"[^>]*>([\s\S]*?)</select>', view_html, re.I)
    if not options_data and selects:
        for sel_id, sel_body in selects:
            options = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]*)</option>', sel_body)
            if options:
                options_data[sel_id] = {"options": [{"value": v, "text": t} for v, t in options if v and v != "-1"]}

    return options_data, len(selects)


# ── Load known-good combos from data ────────────────────────────────
plmf_path = os.path.join(DIR, "product_lines_makes_fits.json")
with open(plmf_path) as f:
    plmf = json.load(f)

all_data = {}
outfile = os.path.join(DIR, "design_options_all_parts.json")
if os.path.exists(outfile):
    with open(outfile) as f:
        all_data = json.load(f)

# ── Phase 1: Design Options ─────────────────────────────────────────
total_parts = len(plmf)
total_combos = sum(
    len(p["productLines"]) * len(p["productMakes"]) * len(p["productFits"])
    for p in plmf.values()
)
log(f"\n{'='*60}")
log(f"  DESIGN OPTIONS EXTRACTION (data-driven)")
log(f"  {total_parts} parts, {total_combos} actual combos (from product_lines_makes_fits.json)")
log(f"  Loaded {len(all_data)} existing cached entries")
log(f"{'='*60}")

hits = 0
skipped = 0
misses = 0
requests_made = 0
start_time = time.time()

for part_idx, (part_name, info) in enumerate(plmf.items(), 1):
    part_id = info["partId"]
    part_ateliers = [pl["atelierId"] for pl in info["productLines"]]
    part_makes = [m["id"] for m in info["productMakes"]]
    part_fits = [f["id"] for f in info["productFits"]]
    max_combos = len(part_ateliers) * len(part_makes) * len(part_fits)

    log(f"\n[{part_idx}/{total_parts}] {part_name} (id={part_id}) — {max_combos} combos "
        f"({len(part_ateliers)}a × {len(part_makes)}m × {len(part_fits)}f)")

    found = False
    part_start = time.time()
    part_requests = 0

    for atelier_id in part_ateliers:
        if found:
            break
        for make_id in part_makes:
            if found:
                break
            for fit_id in part_fits:
                key = f"part{part_id}_{part_name}_make{make_id}_fit{fit_id}_atelier{atelier_id}"
                if key in all_data:
                    found = True
                    skipped += 1
                    log(f"  ✓ CACHED: atelier={atelier_id} make={make_id} fit={fit_id}")
                    break

                part_requests += 1
                requests_made += 1
                log(f"  [{part_requests}/{max_combos}] atelier={atelier_id} make={make_id} fit={fit_id} ...", end="")

                data = f"SelectedProductPartID={part_id}&SelectedProductMakeIDs={make_id}&SelectedProductFitIDs={fit_id}&SelectedProductLineAtelierID={atelier_id}"
                code, body = fetch_post("/ShopSettings/GetDesignOptions", data)

                if code != 200 or len(body) < 100:
                    log(f" HTTP {code}, {len(body)}b — skip")
                    time.sleep(0.3)
                    continue

                try:
                    resp = json.loads(body)
                    view_html = resp.get("ViewString", "")
                    if len(view_html) < 200:
                        log(f" tiny HTML ({len(view_html)}b) — skip")
                        time.sleep(0.3)
                        continue
                except Exception:
                    log(f" JSON parse error — skip")
                    time.sleep(0.3)
                    continue

                options_data, select_count = parse_design_options(view_html)

                if options_data:
                    all_data[key] = {
                        "productPartId": part_id,
                        "productPart": part_name,
                        "makeId": make_id,
                        "fitId": fit_id,
                        "atelierId": atelier_id,
                        "designOptions": options_data,
                        "totalSelectDropdowns": select_count,
                    }
                    opt_count = sum(len(v.get("options", [])) for v in options_data.values())
                    log(f" HIT! {len(options_data)} categories, {opt_count} values")

                    with open(outfile, "w") as f:
                        json.dump(all_data, f, indent=2)

                    found = True
                    hits += 1
                    break
                else:
                    log(f" no options found — skip")

                time.sleep(0.5)

    elapsed = time.time() - part_start
    if found:
        log(f"  → Done in {elapsed:.1f}s ({part_requests} requests)")
    else:
        misses += 1
        log(f"  → MISS ({part_requests} requests, {elapsed:.1f}s)")

total_elapsed = time.time() - start_time
log(f"\n  Summary: {hits} new + {skipped} cached, {misses} missing | {requests_made} requests | {total_elapsed:.1f}s")


# ── Phase 2: Fit Tools ──────────────────────────────────────────────
log(f"\n{'='*60}")
log(f"  FIT TOOLS EXTRACTION (data-driven)")
log(f"{'='*60}")

fit_tools_all = {}
ft_outfile = os.path.join(DIR, "fit_tools_all_parts.json")
if os.path.exists(ft_outfile):
    with open(ft_outfile) as f:
        fit_tools_all = json.load(f)

ft_hits = 0
ft_cached = 0
ft_misses = 0
ft_start = time.time()

for ft_idx, (part_name, info) in enumerate(plmf.items(), 1):
    part_id = info["partId"]
    part_fits = [f["id"] for f in info["productFits"]]

    log(f"\n[{ft_idx}/{total_parts}] {part_name} (id={part_id}) — {len(part_fits)} fits")
    found_ft = False
    ft_part_start = time.time()

    for fit_idx, fit_id in enumerate(part_fits, 1):
        cache_key = f"part{part_id}_{part_name}_fit{fit_id}"
        if cache_key in fit_tools_all:
            log(f"  ✓ CACHED: fit={fit_id}")
            found_ft = True
            ft_cached += 1
            break

        log(f"  [{fit_idx}/{len(part_fits)}] fit={fit_id} ...", end="")
        data = f"SelectedProductPartID={part_id}&SelectedProductFitID={fit_id}"
        code, body = fetch_post("/ShopSettings/GetFittools", data)

        if code == 200 and len(body) > 200:
            labels = re.findall(r'<label[^>]*>([^<]+)</label>', body)
            selects = re.findall(r'<select[^>]*(?:id|name)="([^"]*)"[^>]*>([\s\S]*?)</select>', body, re.I)

            fit_options = {}
            for sel_id, sel_body in selects:
                options = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]*)</option>', sel_body)
                if options:
                    fit_options[sel_id] = [{"value": v, "text": t} for v, t in options if v]

            if fit_options or labels:
                fit_tools_all[cache_key] = {
                    "productPartId": part_id,
                    "productPart": part_name,
                    "fitId": fit_id,
                    "labels": labels,
                    "fitToolDropdowns": fit_options,
                }
                ft_hits += 1
                found_ft = True
                log(f" HIT! {len(labels)} labels, {len(fit_options)} dropdowns")
                break
            else:
                log(f" no useful data — skip")
        else:
            log(f" HTTP {code}, {len(body)}b — skip")

        time.sleep(0.3)

    ft_part_elapsed = time.time() - ft_part_start
    if not found_ft:
        ft_misses += 1
        log(f"  → MISS ({ft_part_elapsed:.1f}s)")
    else:
        log(f"  → Done in {ft_part_elapsed:.1f}s")

with open(ft_outfile, "w") as f:
    json.dump(fit_tools_all, f, indent=2)

ft_elapsed = time.time() - ft_start
log(f"\n  Fit tools: {ft_hits} new + {ft_cached} cached, {ft_misses} missing | {ft_elapsed:.1f}s")

# ── Final Summary ────────────────────────────────────────────────────
grand_total = time.time() - start_time
log(f"\n{'='*60}")
log(f"  COMPLETE in {grand_total:.1f}s")
log(f"  Design options: {len(all_data)} total → {outfile}")
log(f"  Fit tools: {len(fit_tools_all)} total → {ft_outfile}")
log(f"{'='*60}")
