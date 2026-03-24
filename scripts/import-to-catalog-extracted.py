#!/usr/bin/env python3
"""
Import ALL GoCreate-extracted data into catalog_extracted schema.

DATA SOURCES: Only GoCreate-extracted JSON files from data/gocreate-web/,
              data/gocreate-deep/, data/gocreate-api/, data/gocreate-primary-info/.
NEVER imports from the manual catalog schema.
"""

import json
import os
import sys
import subprocess
import html
import re
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_WEB = os.path.join(BASE, "data", "gocreate-web")
DATA_DEEP = os.path.join(BASE, "data", "gocreate-deep")
DATA_API = os.path.join(BASE, "data", "gocreate-api")
DATA_PRIMARY = os.path.join(BASE, "data", "gocreate-primary-info")

SUPABASE_URL = None
SUPABASE_KEY = None

def load_env():
    global SUPABASE_URL, SUPABASE_KEY
    env_path = os.path.join(BASE, ".env.local")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                SUPABASE_URL = line.split("=", 1)[1].strip().strip('"')
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                SUPABASE_KEY = line.split("=", 1)[1].strip().strip('"')

def split_table(table):
    parts = table.split(".", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return "public", parts[0]

def supabase_rpc(method, table, data=None, query_params="", params=None):
    schema, tbl = split_table(table)
    qs = query_params or (f"?{params}" if params else "")
    url = f"{SUPABASE_URL}/rest/v1/{tbl}{qs}"
    if method == "GET":
        prefer = ""
    elif method == "POST":
        prefer = "resolution=merge-duplicates,return=minimal"
    else:
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

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    raw = result.stdout
    lines = raw.strip().rsplit("\n", 1)
    if len(lines) == 2:
        body_str, code_str = lines
    elif len(lines) == 1 and lines[0].isdigit() and len(lines[0]) == 3:
        body_str, code_str = "", lines[0]
    else:
        body_str, code_str = raw, "0"
    try:
        code = int(code_str)
    except ValueError:
        code = 0
    if method == "GET" and body_str:
        try:
            return code, json.loads(body_str)
        except json.JSONDecodeError:
            return code, body_str
    return code, body_str

def upsert(table, rows):
    if not rows:
        return 0
    batch_size = 500
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        code, body = supabase_rpc("POST", table, batch)
        if code not in (200, 201):
            print(f"  ERROR upserting to {table}: HTTP {code} - {body[:200]}")
            return total
        total += len(batch)
    return total

def supabase_post_returning(table, rows):
    """POST with return=representation to get IDs back."""
    schema, tbl = split_table(table)
    url = f"{SUPABASE_URL}/rest/v1/{tbl}"
    cmd = [
        "curl", "-s", "-w", "\n%{http_code}", "-X", "POST", url,
        "-H", f"apikey: {SUPABASE_KEY}",
        "-H", f"Authorization: Bearer {SUPABASE_KEY}",
        "-H", "Content-Type: application/json",
        "-H", "Prefer: resolution=merge-duplicates,return=representation",
        "-H", f"Accept-Profile: {schema}",
        "-H", f"Content-Profile: {schema}",
        "-d", json.dumps(rows),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    lines = result.stdout.strip().rsplit("\n", 1)
    body = lines[0] if len(lines) > 1 else result.stdout
    code = lines[-1] if len(lines) > 1 else "???"
    try:
        parsed = json.loads(body)
        if isinstance(parsed, list):
            return parsed
        print(f"  ERROR: Unexpected response for {table} (HTTP {code}): {body[:300]}")
        return []
    except json.JSONDecodeError:
        print(f"  ERROR: Could not parse response for {table} (HTTP {code}): {body[:300]}")
        return []

def load_json(path):
    with open(path) as f:
        return json.load(f)

def decode_html(text):
    return html.unescape(text).strip()

def progress(msg):
    print(f"  → {msg}")

# ──────────────────────────────────────────────────────────────────────
# 1. Product Parts
# ──────────────────────────────────────────────────────────────────────
def import_product_parts():
    print("\n[1/14] Product Parts")
    data = load_json(os.path.join(DATA_WEB, "product_lines_makes_fits.json"))
    rows = []
    for part_name, info in data.items():
        slug = part_name.lower().replace(" ", "-").replace("/", "-")
        rows.append({"id": info["partId"], "name": part_name, "slug": slug})
    n = upsert("catalog_extracted.gc_product_parts", rows)
    progress(f"{n} product parts imported")
    return data

# ──────────────────────────────────────────────────────────────────────
# 2. Product Lines (Ateliers) + line-part mappings
# ──────────────────────────────────────────────────────────────────────
def import_product_lines(plmf_data):
    print("\n[2/14] Product Lines & Mappings")
    ateliers = {}
    line_parts = []
    for part_name, info in plmf_data.items():
        part_id = info["partId"]
        for pl in info["productLines"]:
            aid = pl["atelierId"]
            ateliers[aid] = pl["name"]
            line_parts.append({"atelier_id": aid, "part_id": part_id})

    atelier_rows = [{"atelier_id": aid, "name": name} for aid, name in ateliers.items()]
    n1 = upsert("catalog_extracted.gc_product_lines", atelier_rows)
    progress(f"{n1} ateliers imported")

    n2 = upsert("catalog_extracted.gc_product_line_parts", line_parts)
    progress(f"{n2} atelier-part mappings imported")

# ──────────────────────────────────────────────────────────────────────
# 3. Item Combinations
# ──────────────────────────────────────────────────────────────────────
def import_item_combinations():
    print("\n[3/14] Item Combinations")
    data = load_json(os.path.join(DATA_WEB, "product_combinations.json"))
    rows = []
    for item in data:
        if item["value"]:
            rows.append({"id": int(item["value"]), "name": item["text"]})
    n = upsert("catalog_extracted.gc_item_combinations", rows)
    progress(f"{n} item combinations imported")

# ──────────────────────────────────────────────────────────────────────
# 4. Models (SPP) — extracted from wizard primary info
# ──────────────────────────────────────────────────────────────────────
def import_models():
    print("\n[4/14] Models (SPP)")
    import glob
    all_spps = {}
    for fpath in glob.glob(os.path.join(DATA_PRIMARY, "*_all.json")):
        data = load_json(fpath)
        combos = data.get("combinations", {})
        for cid, combo in combos.items():
            for s in combo["selects"]:
                sid = s["id"]
                if not sid.startswith("Spp_"):
                    continue
                parts = sid.split("_")
                if len(parts) >= 2:
                    part_id = int(parts[1])
                else:
                    continue
                for o in s["options"]:
                    if o["value"]:
                        key = (int(o["value"]), part_id)
                        all_spps[key] = decode_html(o["text"])

    rows = [{"id": spp_id, "part_id": pid, "name": name} for (spp_id, pid), name in all_spps.items()]
    n = upsert("catalog_extracted.gc_models", rows)
    progress(f"{n} models (SPP) imported")

# ──────────────────────────────────────────────────────────────────────
# 5. Makes & Fits
# ──────────────────────────────────────────────────────────────────────
def import_makes_fits(plmf_data):
    print("\n[5/14] Makes & Fits")
    make_rows = []
    fit_rows = []
    seen_makes = set()
    seen_fits = set()

    # Primary source for fits (and fallback makes): product_lines_makes_fits.json
    for part_name, info in plmf_data.items():
        part_id = info["partId"]
        for m in info["productMakes"]:
            key = (m["id"], part_id)
            if key not in seen_makes:
                seen_makes.add(key)
                make_rows.append({"id": m["id"], "part_id": part_id, "name": m["name"], "make_price_categories": None})
        for f in info["productFits"]:
            key = (f["id"], part_id)
            if key not in seen_fits:
                seen_fits.add(key)
                fit_rows.append({"id": f["id"], "part_id": part_id, "name": f["name"].strip()})

    # Merge ALL makes from all_makes_fits_detailed.json (has MakePriceCategories)
    detailed_path = os.path.join(DATA_WEB, "all_makes_fits_detailed.json")
    if os.path.exists(detailed_path):
        detailed = load_json(detailed_path)
        for entry in detailed:
            part_id = entry["partId"]
            for m in entry.get("makes", []):
                if not m.get("IsActive", True):
                    continue
                key = (m["ID"], part_id)
                cat_val = m.get("CategoryNameValue", {})
                price_cats = (cat_val.get("MakePriceCategories") or "").strip() or None
                if key not in seen_makes:
                    seen_makes.add(key)
                    make_rows.append({
                        "id": m["ID"],
                        "part_id": part_id,
                        "name": m.get("LocalizedName") or m["Name"],
                        "make_price_categories": price_cats,
                    })
                else:
                    # Update price categories on existing row if we now have them
                    if price_cats:
                        for row in make_rows:
                            if row["id"] == m["ID"] and row["part_id"] == part_id:
                                row["make_price_categories"] = price_cats
                                break
        progress(f"Merged makes from all_makes_fits_detailed.json")

    n1 = upsert("catalog_extracted.gc_makes", make_rows)
    progress(f"{n1} makes imported")
    n2 = upsert("catalog_extracted.gc_fits", fit_rows)
    progress(f"{n2} fits imported")

# ──────────────────────────────────────────────────────────────────────
# 6. Canvas Options — from primary info wizard
# ──────────────────────────────────────────────────────────────────────
def import_canvas_options():
    print("\n[6/14] Canvas Options")
    import glob
    all_canvas = {}
    for fpath in glob.glob(os.path.join(DATA_PRIMARY, "*_all.json")):
        data = load_json(fpath)
        combos = data.get("combinations", {})
        for cid, combo in combos.items():
            for s in combo["selects"]:
                if s["id"].startswith("Canvas_"):
                    for o in s["options"]:
                        if o["value"]:
                            all_canvas[int(o["value"])] = decode_html(o["text"])
    if not all_canvas:
        progress("No canvas options found (shop doesn't use canvas selection)")
        return
    rows = [{"value_id": vid, "label": label} for vid, label in all_canvas.items()]
    n = upsert("catalog_extracted.gc_canvas_options", rows)
    progress(f"{n} canvas options imported")

# ──────────────────────────────────────────────────────────────────────
# 7. Lining Modes — from primary info wizard
# ──────────────────────────────────────────────────────────────────────
def import_lining_modes():
    print("\n[7/14] Lining Modes")
    import glob
    all_lining = {}
    for fpath in glob.glob(os.path.join(DATA_PRIMARY, "*_all.json")):
        data = load_json(fpath)
        combos = data.get("combinations", {})
        for cid, combo in combos.items():
            for s in combo["selects"]:
                if s["id"].startswith("InsideLining_"):
                    for o in s["options"]:
                        if o["value"]:
                            all_lining[int(o["value"])] = decode_html(o["text"])
    rows = [{"id": lid, "name": name} for lid, name in all_lining.items()]
    n = upsert("catalog_extracted.gc_lining_modes", rows)
    progress(f"{n} lining modes imported")

# ──────────────────────────────────────────────────────────────────────
# 8. Buttons / Trims — from primary info wizard
# ──────────────────────────────────────────────────────────────────────
def import_buttons():
    print("\n[8/14] Buttons / Trims")
    import glob
    all_trims = {}
    for fpath in glob.glob(os.path.join(DATA_PRIMARY, "*_all.json")):
        data = load_json(fpath)
        combos = data.get("combinations", {})
        for cid, combo in combos.items():
            for s in combo["selects"]:
                if s["id"].startswith("Trim_"):
                    for idx, o in enumerate(s["options"]):
                        if o["value"] and o["value"] != "-1":
                            all_trims[int(o["value"])] = (decode_html(o["text"]), idx)
    rows = [{"trim_id": tid, "label": label, "sort_order": sort} for tid, (label, sort) in all_trims.items()]
    n = upsert("catalog_extracted.gc_buttons", rows)
    progress(f"{n} buttons/trims imported")

# ──────────────────────────────────────────────────────────────────────
# 9. TryOn Sizes
# ──────────────────────────────────────────────────────────────────────
def _detect_shoe_part_ids() -> set[int]:
    """Return part_ids that belong to shoe categories by checking part names."""
    SHOE_KW = {"sneaker", "runner", "loafer", "shoe", "boot", "derby", "oxford", "monk"}
    code, rows = supabase_rpc(
        "GET", "catalog_extracted.gc_item_parts",
        params="select=part_id,part_name",
    )
    if code != 200 or not rows:
        return set()
    ids: set[int] = set()
    for r in rows:
        if any(kw in r["part_name"].lower() for kw in SHOE_KW):
            ids.add(r["part_id"])
    return ids

def _format_shoe_label(raw_label: str) -> str:
    """Convert numeric shoe size to 'EU X / UK Y' (UK = EU - 34)."""
    try:
        eu = float(raw_label)
    except ValueError:
        return raw_label
    uk = eu - 34
    eu_s = str(int(eu)) if eu == int(eu) else str(eu)
    uk_s = str(int(uk)) if uk == int(uk) else str(uk)
    return f"EU {eu_s} / UK {uk_s}"

def import_tryon_sizes():
    print("\n[9/14] TryOn Sizes")

    # Clear existing rows to prevent duplicates (no unique constraint on this table)
    supabase_rpc("DELETE", "catalog_extracted.gc_tryon_sizes", params="id=gt.0")
    progress("cleared old tryon sizes")

    shoe_part_ids = _detect_shoe_part_ids()
    if shoe_part_ids:
        progress(f"shoe part IDs for EU/UK formatting: {sorted(shoe_part_ids)}")

    data = load_json(os.path.join(DATA_WEB, "tryon_sizes_all.json"))
    seen: set[tuple[int, int, str]] = set()
    rows = []
    for entry in data:
        part_id = entry["partId"]
        fit_id = entry.get("fitId", 0)
        for idx, ts in enumerate(entry.get("tryOnSizes", [])):
            label = ts["text"]
            if part_id in shoe_part_ids:
                label = _format_shoe_label(label)
            key = (part_id, fit_id, label)
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                "part_id": part_id,
                "fit_id": fit_id,
                "label": label,
                "value": ts["value"],
                "sort_order": idx,
            })
    n = upsert("catalog_extracted.gc_tryon_sizes", rows)
    progress(f"{n} tryon sizes imported (deduplicated, {len(shoe_part_ids)} shoe parts formatted EU/UK)")

# ──────────────────────────────────────────────────────────────────────
# 10. Design Options + Option Values + Categories + Combo Availability
# ──────────────────────────────────────────────────────────────────────
def import_design_options():
    print("\n[10/14] Design Options, Values & Combo Availability")
    # Use all_combos (149 combos) for full availability data
    data = load_json(os.path.join(DATA_WEB, "design_options_all_combos.json"))
    progress(f"Loaded {len(data)} combo entries")

    # Build mapping of GoCreate option IDs to proper display names from order data
    # (e.g. dd_282 → "Width" instead of the HTML category name "Ties")
    api_option_names = {}
    order_opts_path = os.path.join(DATA_API, "design_option_values_from_orders.json")
    if os.path.exists(order_opts_path):
        order_opts = load_json(order_opts_path)
        for opt_id_str, info in order_opts.items():
            api_option_names[f"dd_{opt_id_str}"] = info.get("name", "")
        progress(f"Loaded {len(api_option_names)} API option name overrides")

    # Phase 1: Collect all unique categories per part
    cat_set = set()
    for key, combo in data.items():
        pid = combo["productPartId"]
        for cat_name in combo["designOptions"]:
            cat_set.add((pid, decode_html(cat_name)))

    # Detect monogram categories dynamically:
    # 1. Any category with "monogram" in its name
    # 2. A "DesignOptions" category whose selectId is dd_452 (monogram colour picker)
    #    GoCreate reuses "DesignOptions" for both real options (Closure, Waistband)
    #    AND monogram colour. Only dd_452 is monogram; everything else is a real option.
    design_opts_select_ids = {}
    for key, combo in data.items():
        pid = combo["productPartId"]
        for cat_name, cat_data in combo["designOptions"].items():
            if cat_name == "DesignOptions":
                design_opts_select_ids[pid] = cat_data.get("selectId", "")
                break

    def is_monogram_category(pid, cname):
        if "monogram" in cname.lower():
            return True
        if cname == "DesignOptions" and design_opts_select_ids.get(pid) == "dd_452":
            return True
        return False

    # Rename "DesignOptions" to proper names for non-monogram categories
    DESIGN_OPTS_PROPER_NAMES = {
        "dd_183": "Canvas", "dd_6": "Waistband", "dd_46": "Closure",
        "dd_104": "Collar style", "dd_157": "Closure", "dd_313": "Style",
        "dd_316": "Width", "dd_363": "Closure", "dd_486": "Closure",
        "dd_528": "Style", "dd_547": "Closure", "dd_562": "Closure",
        "dd_595": "Style", "dd_623": "Width",
    }

    cat_rows = []
    cat_map = {}
    for idx, (pid, cname) in enumerate(sorted(cat_set)):
        display_name = cname
        if cname == "DesignOptions" and not is_monogram_category(pid, cname):
            sid = design_opts_select_ids.get(pid, "")
            display_name = DESIGN_OPTS_PROPER_NAMES.get(sid, cname)
        cat_rows.append({
            "part_id": pid,
            "category_name": display_name,
            "sort_order": idx,
            "is_monogram": is_monogram_category(pid, cname),
        })

    progress(f"Importing {len(cat_rows)} option categories ({sum(1 for r in cat_rows if r['is_monogram'])} monogram)...")
    batch_size = 500
    for i in range(0, len(cat_rows), batch_size):
        batch = cat_rows[i:i+batch_size]
        resp = supabase_post_returning("catalog_extracted.gc_option_categories", batch)
        for r in resp:
            cat_map[(r["part_id"], r["category_name"])] = r["id"]

    progress(f"{len(cat_map)} categories created")

    # Phase 2: Collect all unique design options per part (UNION across combos)
    # Key by (part_id, gc_select_id) to avoid merging different GoCreate dropdowns
    # that share a category name across ateliers (e.g. ties: "Ties" = width in one
    # atelier but "Ties" = length in another)
    opt_key_set = {}
    select_id_name_weights = {}

    for key, combo in data.items():
        pid = combo["productPartId"]
        combo_cat_count = len(combo.get("designOptions", {}))
        for sort_idx, (cat_name, cat_data) in enumerate(combo["designOptions"].items()):
            dname = decode_html(cat_name)
            select_id = cat_data.get("selectId", "")
            sid_key = (pid, select_id)

            w = select_id_name_weights.setdefault(sid_key, {})
            w[dname] = w.get(dname, 0) + combo_cat_count

            if sid_key not in opt_key_set:
                cat_id = cat_map.get((pid, dname))
                opt_key_set[sid_key] = {
                    "part_id": pid,
                    "category_id": cat_id,
                    "gc_select_id": select_id,
                    "name": dname,
                    "sort_order": sort_idx,
                }

    for sid_key, name_weights in select_id_name_weights.items():
        if len(name_weights) > 1:
            best_name = max(name_weights, key=name_weights.get)
            opt_key_set[sid_key]["name"] = best_name
            pid = sid_key[0]
            opt_key_set[sid_key]["category_id"] = cat_map.get((pid, best_name))

    # Override option names with proper API display names where available
    overrides = 0
    for sid_key, row in opt_key_set.items():
        api_name = api_option_names.get(row["gc_select_id"], "").strip()
        if api_name and api_name != row["name"]:
            row["name"] = api_name
            overrides += 1
    if overrides:
        progress(f"Applied {overrides} API name overrides")

    opt_rows = list(opt_key_set.values())
    progress(f"Importing {len(opt_rows)} design options...")

    for i in range(0, len(opt_rows), batch_size):
        batch = opt_rows[i:i+batch_size]
        supabase_post_returning("catalog_extracted.gc_design_options", batch)

    # Fetch the full mapping from the DB — more robust than relying on POST
    # response which can be truncated on re-runs with merge-duplicates.
    opt_map = {}
    page = 0
    while True:
        code, rows = supabase_rpc(
            "GET", "catalog_extracted.gc_design_options",
            params=f"select=id,part_id,gc_select_id&offset={page * 1000}&limit=1000",
        )
        if code != 200 or not rows:
            break
        for r in rows:
            opt_map[(r["part_id"], r["gc_select_id"])] = r["id"]
        if len(rows) < 1000:
            break
        page += 1

    progress(f"{len(opt_map)} design options mapped (fetched from DB)")

    # Phase 3: Collect all unique option values (UNION across combos)
    # Dedup by (design_option_id, label) to avoid duplicate labels in dropdowns
    val_set = {}
    for key, combo in data.items():
        pid = combo["productPartId"]
        for cat_name, cat_data in combo["designOptions"].items():
            select_id = cat_data.get("selectId", "")
            do_id = opt_map.get((pid, select_id))
            if not do_id:
                continue
            for idx, o in enumerate(cat_data.get("options", [])):
                label = decode_html(o["text"])
                vkey = (do_id, label)
                if vkey not in val_set:
                    val_set[vkey] = {
                        "design_option_id": do_id,
                        "value_id": str(o["value"]),
                        "label": label,
                        "sort_order": idx,
                    }

    val_rows = list(val_set.values())
    progress(f"Importing {len(val_rows)} option values...")
    total_vals = 0
    for i in range(0, len(val_rows), batch_size):
        batch = val_rows[i:i+batch_size]
        code, body = supabase_rpc("POST", "catalog_extracted.gc_option_values", batch)
        if code in (200, 201):
            total_vals += len(batch)
        else:
            print(f"  ERROR: HTTP {code} - {body[:200]}")
    progress(f"{total_vals} option values imported")

    # Phase 4: Combo option availability
    avail_rows = []
    for key, combo in data.items():
        pid = combo["productPartId"]
        mid = combo["makeId"]
        fid = combo["fitId"]
        aid = combo.get("atelierId", 1)
        for cat_name, cat_data in combo["designOptions"].items():
            select_id = cat_data.get("selectId", "")
            do_id = opt_map.get((pid, select_id))
            if not do_id:
                continue
            value_ids = [str(o["value"]) for o in cat_data.get("options", [])]
            avail_rows.append({
                "part_id": pid,
                "make_id": mid,
                "fit_id": fid,
                "atelier_id": aid,
                "design_option_id": do_id,
                "available_value_ids": json.dumps(value_ids),
            })

    progress(f"Importing {len(avail_rows)} combo availability rows...")
    total_avail = 0
    for i in range(0, len(avail_rows), batch_size):
        batch = avail_rows[i:i+batch_size]
        code, body = supabase_rpc("POST", "catalog_extracted.gc_combo_option_availability", batch)
        if code in (200, 201):
            total_avail += len(batch)
        else:
            print(f"  ERROR: HTTP {code} - {body[:200]}")
    progress(f"{total_avail} combo availability rows imported")

# ──────────────────────────────────────────────────────────────────────
# 11. Fit Tools
# ──────────────────────────────────────────────────────────────────────
def import_fit_tools():
    print("\n[11/14] Fit Tools")
    data = load_json(os.path.join(DATA_WEB, "fit_tools_all_parts.json"))
    rows = []
    for key, info in data.items():
        pid = info["productPartId"]
        fid = info.get("fitId", 0)
        for idx, tool_name in enumerate(info.get("fitTools", [])):
            rows.append({
                "part_id": pid,
                "fit_id": fid,
                "name": decode_html(tool_name),
                "input_type": "numeric",
                "sort_order": idx,
            })
    n = upsert("catalog_extracted.gc_fit_tools", rows)
    progress(f"{n} fit tools imported")

# ──────────────────────────────────────────────────────────────────────
# 12. Branding Positions & Labels — from orders extraction
# ──────────────────────────────────────────────────────────────────────
def import_branding():
    print("\n[12/14] Branding Positions & Labels")
    fpath = os.path.join(DATA_API, "branding_from_orders.json")
    if not os.path.exists(fpath):
        progress("No branding data file found, skipping")
        return
    data = load_json(fpath)

    pos_rows = []
    for part_id_str, part_data in data.items():
        part_id = int(part_id_str)
        for pos_id_str, pos_data in part_data.get("positions", {}).items():
            pos_id = int(pos_id_str)
            pos_rows.append({
                "part_id": part_id,
                "position_id": pos_id,
                "position_name": pos_data["positionName"],
            })

    progress(f"Importing {len(pos_rows)} branding positions...")
    pos_resp = supabase_post_returning("catalog_extracted.gc_branding_positions", pos_rows)
    pos_map = {}
    for r in pos_resp:
        pos_map[(r["part_id"], r["position_id"])] = r["id"]
    progress(f"{len(pos_map)} branding positions created")

    label_rows = []
    for part_id_str, part_data in data.items():
        part_id = int(part_id_str)
        for pos_id_str, pos_data in part_data.get("positions", {}).items():
            pos_id = int(pos_id_str)
            pos_fk = pos_map.get((part_id, pos_id))
            if not pos_fk:
                continue
            for label_id_str, label_name in pos_data.get("labels", {}).items():
                label_rows.append({
                    "position_fk": pos_fk,
                    "label_id": int(label_id_str),
                    "label_name": label_name,
                })

    n = upsert("catalog_extracted.gc_branding_labels", label_rows)
    progress(f"{n} branding labels imported")

# ──────────────────────────────────────────────────────────────────────
# 13. Item Type Categories + Category-Part mappings
# ──────────────────────────────────────────────────────────────────────
def import_item_type_categories():
    print("\n[13/14] Item Type Categories")

    category_part_map = load_json(os.path.join(DATA_WEB, "category_part_mapping.json"))
    if not category_part_map:
        print("  ERROR: category_part_mapping.json not found")
        return

    plmf = load_json(os.path.join(DATA_WEB, "product_lines_makes_fits.json"))
    valid_part_ids = set()
    for info in plmf.values():
        valid_part_ids.add(info["partId"])

    cat_rows = []
    for idx, cat_name in enumerate(category_part_map.keys()):
        cat_rows.append({"name": cat_name, "sort_order": idx})

    resp = supabase_post_returning("catalog_extracted.gc_item_type_categories", cat_rows)
    cat_id_map = {r["name"]: r["id"] for r in resp}
    progress(f"{len(cat_id_map)} item type categories created")

    mapping_rows = []
    for cat_name, part_ids in category_part_map.items():
        cat_id = cat_id_map.get(cat_name)
        if not cat_id:
            continue
        for pid in part_ids:
            if pid in valid_part_ids:
                mapping_rows.append({"category_id": cat_id, "part_id": pid})

    n = upsert("catalog_extracted.gc_item_type_category_parts", mapping_rows)
    progress(f"{n} category-part mappings imported")

# ──────────────────────────────────────────────────────────────────────
# 14. Customer Fields, Dropdowns, Localized Messages
# ──────────────────────────────────────────────────────────────────────
def import_customer_and_messages():
    print("\n[14/14] Customer Fields, Dropdowns & Localized Messages")

    # Customer fields
    cust = load_json(os.path.join(DATA_WEB, "customer_create_fields.json"))
    field_rows = []
    for fname, ftype in cust.get("formFields", {}).items():
        section = "hidden" if ftype == "hidden" else "general"
        field_rows.append({"field_name": fname, "field_type": ftype, "section": section})
    n1 = upsert("catalog_extracted.gc_customer_fields", field_rows)
    progress(f"{n1} customer fields imported")

    # Customer dropdowns
    dd_data = cust.get("dropdowns", {})
    dd_rows = [{"dropdown_name": name, "label": name} for name in dd_data.keys()]
    resp = supabase_post_returning("catalog_extracted.gc_customer_dropdowns", dd_rows)
    dd_map = {r["dropdown_name"]: r["id"] for r in resp}
    progress(f"{len(dd_map)} customer dropdowns created")

    dd_opt_rows = []
    for dd_name, options in dd_data.items():
        dd_id = dd_map.get(dd_name)
        if not dd_id:
            continue
        for idx, o in enumerate(options):
            dd_opt_rows.append({
                "dropdown_id": dd_id,
                "value": str(o["value"]),
                "label": o["text"],
                "sort_order": idx,
            })
    n2 = upsert("catalog_extracted.gc_customer_dropdown_options", dd_opt_rows)
    progress(f"{n2} customer dropdown options imported")

    # Localized messages
    msgs = load_json(os.path.join(DATA_WEB, "localized_messages.json"))
    msg_rows = [{"key": k, "value": v} for k, v in msgs.items()]
    n3 = upsert("catalog_extracted.gc_localized_messages", msg_rows)
    progress(f"{n3} localized messages imported")

# ──────────────────────────────────────────────────────────────────────
# BONUS: Sales Associates from wizard
# ──────────────────────────────────────────────────────────────────────
def import_sales_associates():
    print("\n[BONUS] Sales Associates")
    all_sa = {}
    # Sales associates are stored as SelectedTailorID in the wizard
    fp = os.path.join(DATA_WEB, "wizard_formal_selects.json")
    if os.path.exists(fp):
        ws = load_json(fp)
        for sname in ["SelectedTailorID", "SelectedSalesAssociateID"]:
            if sname in ws:
                for o in ws[sname]:
                    if o.get("value"):
                        all_sa[int(o["value"])] = decode_html(o["text"])

    rows = [{"id": sid, "name": name} for sid, name in all_sa.items()]
    n = upsert("catalog_extracted.gc_sales_associates", rows)
    progress(f"{n} sales associates imported")

# ──────────────────────────────────────────────────────────────────────
# BONUS: Detachable Liner options
# ──────────────────────────────────────────────────────────────────────
def import_detachable_liners():
    print("\n[BONUS] Detachable Liner Options")
    import glob
    all_liners = {}
    for fpath in glob.glob(os.path.join(DATA_PRIMARY, "*_all.json")):
        data = load_json(fpath)
        combos = data.get("combinations", {})
        for cid, combo in combos.items():
            for s in combo["selects"]:
                if s["id"].startswith("SelectedDetachableLiner"):
                    for o in s["options"]:
                        if o["value"] and o["value"] != "-1":
                            all_liners[int(o["value"])] = decode_html(o["text"])

    if all_liners:
        progress(f"Found {len(all_liners)} detachable liner options")
        for lid, name in sorted(all_liners.items()):
            progress(f"  [{lid}] {name}")
    else:
        progress("No detachable liner options found")

# ──────────────────────────────────────────────────────────────────────
# BONUS: Item Parts mapping from primary info per combo
# ──────────────────────────────────────────────────────────────────────
def import_item_parts():
    print("\n[BONUS] Item Parts (combo → product parts)")
    import glob

    plmf = load_json(os.path.join(DATA_WEB, "product_lines_makes_fits.json"))
    part_name_to_id = {}
    for info in plmf.values():
        part_name_to_id[info["partName"]] = info["partId"]

    combo_parts = defaultdict(dict)
    for fpath in glob.glob(os.path.join(DATA_PRIMARY, "*_all.json")):
        data = load_json(fpath)
        combos = data.get("combinations", {})
        for cid, combo in combos.items():
            combo_id = int(cid) if cid.isdigit() else combo.get("combinationId")
            if not combo_id:
                continue
            for s in combo["selects"]:
                sid = s["id"]
                if sid.startswith("Spp_"):
                    parts = sid.split("_")
                    if len(parts) >= 2:
                        part_id = int(parts[1])
                        combo_parts[combo_id][part_id] = True
                elif sid.startswith("Make_"):
                    parts = sid.split("_")
                    if len(parts) >= 2:
                        part_id = int(parts[1])
                        combo_parts[combo_id][part_id] = True

    KNOWN_ITEM_PARTS = {
        29: [(22, "Tie")],
        32: [(23, "Bow tie")],
        31: [(24, "Pocket square")],
    }
    for item_id, parts_list in KNOWN_ITEM_PARTS.items():
        for part_id, _ in parts_list:
            combo_parts[item_id][part_id] = True
        for pn, pid in part_name_to_id.items():
            if pid == part_id:
                break

    rows = []
    for combo_id, parts in combo_parts.items():
        for sort_idx, part_id in enumerate(sorted(parts.keys())):
            part_name = ""
            for pn, pid in part_name_to_id.items():
                if pid == part_id:
                    part_name = pn
                    break
            for known_item, known_parts in KNOWN_ITEM_PARTS.items():
                if combo_id == known_item:
                    for kpid, kpname in known_parts:
                        if kpid == part_id and not part_name:
                            part_name = kpname
            rows.append({
                "item_id": combo_id,
                "part_id": part_id,
                "part_name": part_name or f"Part {part_id}",
                "sort_order": sort_idx,
            })

    n = upsert("catalog_extracted.gc_item_parts", rows)
    progress(f"{n} item-part mappings imported")


def compute_and_store_field_config():
    """Compute per-category field_config from primary info extraction data.

    Uses reliable signals from the per-combo HTML extraction:
      - Canvas:      Canvas_X_Y selects (3-part ID) present → showCanvas
      - Lining Mode: drpbgroup_* selects present → showLiningMode
      - Lining:      HDLining_*, CLLining_*, BembergLiningId_*, UniLiningId_*,
                     EDLining_* hidden inputs present → showLining
      - Buttons:     Whitelist-based.  GoCreate includes PartTrimDoId_* and
                     HideButton in ALL combo HTML (JS hides dynamically), so
                     automated detection is unreliable.  Only jacket/coat
                     categories actually use the Trim selector.

    Matching logic: a combo belongs to a category when the combo's parts
    (from 3-part select IDs) are a subset of the category's part set.
    """
    print("\n[POST] Computing field_config per category")
    import glob

    LINING_HIDDEN_PREFIXES = (
        "HDLining_", "CLLining_", "BembergLiningId_",
        "UniLiningId_", "EDLining_",
    )
    # Whitelist: only these categories show the Buttons/Trim selector.
    # GoCreate has PartTrimDoId_* and HideButton in ALL combo HTML (JS hides
    # dynamically), so automated detection produces false positives.  The trim
    # system is only used for jacket/coat buttons — not for trousers, pants,
    # shirts, knitwear, shoes, ties, or vests.
    BUTTONS_WHITELIST = {"Formal suits & Jacket", "Informal suits & Jacket", "Outerwear"}

    # ── Phase 1: build per-combo signals from ALL extraction files ────
    combo_signals: dict[int, dict] = {}

    for fpath in glob.glob(os.path.join(DATA_PRIMARY, "*_all.json")):
        data = load_json(fpath)
        for cid_str, combo in data.get("combinations", {}).items():
            cid = int(cid_str)
            selects = combo.get("selects", [])
            hiddens = combo.get("hiddens", [])

            parts = set()
            for s in selects:
                tokens = s["id"].split("_")
                if len(tokens) >= 3 and tokens[1].isdigit():
                    parts.add(int(tokens[1]))

            has_canvas = any(
                s["id"].startswith("Canvas_") and len(s["id"].split("_")) >= 3
                for s in selects
            )
            has_lining_mode = any(
                s["id"].startswith("drpbgroup") for s in selects
            )
            has_lining = any(
                any(h["id"].startswith(p) for p in LINING_HIDDEN_PREFIXES)
                for h in hiddens
            )
            combo_signals[cid] = {
                "parts": parts,
                "has_canvas": has_canvas,
                "has_lining_mode": has_lining_mode,
                "has_lining": has_lining,
            }

    progress(f"Analysed {len(combo_signals)} combos from primary info extraction")

    # ── Phase 2: fetch categories + parts from DB ─────────────────────
    code, cats = supabase_rpc(
        "GET", "catalog_extracted.gc_item_type_categories",
        params="select=id,name",
    )
    if code != 200:
        progress(f"ERROR fetching categories: {code}")
        return

    code, cat_parts_rows = supabase_rpc(
        "GET", "catalog_extracted.gc_item_type_category_parts",
        params="select=category_id,part_id",
    )
    if code != 200:
        progress(f"ERROR fetching category parts: {code}")
        return

    cat_part_map: dict[int, set[int]] = defaultdict(set)
    for cp in cat_parts_rows:
        cat_part_map[cp["category_id"]].add(cp["part_id"])

    # ── Phase 3: aggregate signals per category ───────────────────────
    for cat in cats:
        cat_id = cat["id"]
        cat_name = cat["name"]
        cat_pids = cat_part_map.get(cat_id, set())

        any_canvas = False
        any_lining_mode = False
        any_lining = False
        matched_combos = []

        for cid, sig in combo_signals.items():
            if sig["parts"] and sig["parts"].issubset(cat_pids):
                matched_combos.append(cid)
                if sig["has_canvas"]:
                    any_canvas = True
                if sig["has_lining_mode"]:
                    any_lining_mode = True
                if sig["has_lining"]:
                    any_lining = True

        show_buttons = cat_name in BUTTONS_WHITELIST

        # Detect material design options for parts in this category
        material_opt_names: list[str] = []
        is_shoe = False
        code2, do_rows = supabase_rpc(
            "GET", "catalog_extracted.gc_design_options",
            params=f"select=part_id,name&part_id=in.({','.join(str(p) for p in cat_pids)})"
            "&name=ilike.*material*",
        )
        if code2 == 200 and do_rows:
            material_opt_names = sorted(set(r["name"] for r in do_rows))

        # Shoe detection: if category parts include sneaker/runner/loafer-type names
        SHOE_PART_KEYWORDS = {"sneaker", "runner", "loafer", "shoe", "boot", "derby", "oxford", "monk"}
        code3, part_rows = supabase_rpc(
            "GET", "catalog_extracted.gc_item_parts",
            params=f"select=part_id,part_name&part_id=in.({','.join(str(p) for p in cat_pids)})",
        )
        if code3 == 200 and part_rows:
            part_names_lower = set(r["part_name"].lower() for r in part_rows)
            is_shoe = any(kw in pn for pn in part_names_lower for kw in SHOE_PART_KEYWORDS)

        show_fabric = not is_shoe and len(material_opt_names) == 0

        config = {
            "showCanvas": any_canvas,
            "showLiningMode": any_lining_mode,
            "showLining": any_lining,
            "showButtons": show_buttons,
            "showFabricSearch": show_fabric,
            "materialDesignOptionNames": material_opt_names,
            "isShoeOrder": is_shoe,
        }

        progress(
            f"  {cat_name}: {config}  "
            f"(matched {len(matched_combos)} combos: {sorted(matched_combos)})"
        )

        code, body = supabase_rpc(
            "PATCH",
            "catalog_extracted.gc_item_type_categories",
            data={"field_config": config},
            params=f"id=eq.{cat_id}",
        )
        if code not in (200, 204):
            progress(
                f"  ERROR updating {cat_name}: {code} "
                f"{body[:200] if isinstance(body, str) else body}"
            )

    progress("field_config computation complete")


def main():
    print("=" * 60)
    print("GoCreate → catalog_extracted Import")
    print("=" * 60)
    print("SOURCE: GoCreate extracted JSON files ONLY")
    print("TARGET: catalog_extracted schema")
    print("NEVER touches the manual catalog schema")
    print("=" * 60)

    load_env()
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Could not load Supabase credentials from .env.local")
        sys.exit(1)

    progress(f"Supabase URL: {SUPABASE_URL}")

    plmf_data = import_product_parts()
    import_product_lines(plmf_data)
    import_item_combinations()
    import_models()
    import_makes_fits(plmf_data)
    import_canvas_options()
    import_lining_modes()
    import_buttons()
    import_tryon_sizes()
    import_design_options()
    import_fit_tools()
    import_branding()
    import_item_type_categories()
    import_customer_and_messages()
    import_sales_associates()
    import_detachable_liners()
    import_item_parts()
    compute_and_store_field_config()

    print("\n" + "=" * 60)
    print("IMPORT COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
