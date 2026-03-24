#!/usr/bin/env python3
"""
Fix missing design options, fit tools, and branding for Chino (part_id=15) and
5 Pocket (part_id=14) by copying from Trousers (part_id=2).

GoCreate's ShopSettings has zero design options/fit tools configured for these
parts, but the order wizard uses Trousers' settings. This script replicates that.
"""
import json, os, sys, subprocess

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUPABASE_URL = None
SUPABASE_KEY = None

SOURCE_PART_ID = 2  # Trousers
TARGET_PARTS = [
    {"part_id": 15, "name": "Chino", "fit_id": 38},
    {"part_id": 14, "name": "5 Pocket", "fit_id": 37},
]
# Use Trousers fit_id=1 as the template (most complete)
SOURCE_FIT_ID = 1


def load_env():
    global SUPABASE_URL, SUPABASE_KEY
    with open(os.path.join(BASE, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                SUPABASE_URL = line.split("=", 1)[1].strip().strip('"')
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                SUPABASE_KEY = line.split("=", 1)[1].strip().strip('"')


def sb(method, table, data=None, params=""):
    schema, tbl = table.split(".", 1) if "." in table else ("public", table)
    qs = f"?{params}" if params else ""
    url = f"{SUPABASE_URL}/rest/v1/{tbl}{qs}"
    prefer = ""
    if method == "POST":
        prefer = "resolution=merge-duplicates,return=representation"
    elif method == "PATCH":
        prefer = "return=minimal"
    elif method == "DELETE":
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


def progress(msg):
    print(f"  → {msg}", flush=True)


def main():
    print("=" * 60)
    print("Fix Missing Pants Data (Chino + 5 Pocket)")
    print("=" * 60)
    load_env()
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Missing Supabase credentials")
        sys.exit(1)

    # ── Step 1: Get source data from Trousers ──────────────────────
    print("\n[1/4] Loading Trousers (part_id=2) data...")

    code, src_cats = sb("GET", "catalog_extracted.gc_option_categories",
        params=f"select=id,part_id,category_name,is_monogram,sort_order&part_id=eq.{SOURCE_PART_ID}&order=sort_order")
    progress(f"{len(src_cats)} categories")

    code, src_opts = sb("GET", "catalog_extracted.gc_design_options",
        params=f"select=id,category_id,part_id,name,gc_select_id,sort_order&part_id=eq.{SOURCE_PART_ID}&order=sort_order")
    progress(f"{len(src_opts)} design options")

    opt_ids = ",".join(str(o["id"]) for o in src_opts)
    code, src_vals = sb("GET", "catalog_extracted.gc_option_values",
        params=f"select=design_option_id,value_id,label,sort_order&design_option_id=in.({opt_ids})&order=design_option_id,sort_order&limit=1000")
    progress(f"{len(src_vals)} option values")

    code, src_tools = sb("GET", "catalog_extracted.gc_fit_tools",
        params=f"select=id,part_id,fit_id,name,input_type,min_val,max_val,step_val,default_val,sort_order&part_id=eq.{SOURCE_PART_ID}&fit_id=eq.{SOURCE_FIT_ID}&order=sort_order")
    progress(f"{len(src_tools)} fit tools (fit_id={SOURCE_FIT_ID})")

    code, src_branding = sb("GET", "catalog_extracted.gc_branding_positions",
        params=f"select=id,part_id,position_id,position_name&part_id=eq.{SOURCE_PART_ID}")
    if isinstance(src_branding, list):
        progress(f"{len(src_branding)} branding positions")
    else:
        src_branding = []
        progress("0 branding positions")

    # Build category name → id map for source
    src_cat_map = {c["category_name"]: c for c in src_cats}
    # Build design option id → option data map
    src_opt_by_id = {o["id"]: o for o in src_opts}

    # ── Step 2: Copy data to each target part ──────────────────────
    for target in TARGET_PARTS:
        tpid = target["part_id"]
        tname = target["name"]
        tfid = target["fit_id"]
        print(f"\n[2/4] Copying to {tname} (part_id={tpid}, fit_id={tfid})...")

        # Check if already has data
        code, existing = sb("GET", "catalog_extracted.gc_option_categories",
            params=f"select=id&part_id=eq.{tpid}&limit=1")
        if isinstance(existing, list) and len(existing) > 0:
            progress(f"Already has {len(existing)} categories — clearing old data first")
            sb("DELETE", "catalog_extracted.gc_option_categories", params=f"part_id=eq.{tpid}")
            sb("DELETE", "catalog_extracted.gc_design_options", params=f"part_id=eq.{tpid}")
            sb("DELETE", "catalog_extracted.gc_fit_tools", params=f"part_id=eq.{tpid}")

        # 2a: Create categories
        cat_rows = []
        for c in src_cats:
            cat_rows.append({
                "part_id": tpid,
                "category_name": c["category_name"],
                "is_monogram": c["is_monogram"],
                "sort_order": c["sort_order"],
            })
        code, new_cats = sb("POST", "catalog_extracted.gc_option_categories", cat_rows)
        if not isinstance(new_cats, list):
            progress(f"ERROR creating categories: {code} {new_cats}")
            continue
        new_cat_map = {c["category_name"]: c["id"] for c in new_cats}
        progress(f"{len(new_cats)} categories created")

        # 2b: Create design options
        old_to_new_cat = {}
        for c in src_cats:
            old_to_new_cat[c["id"]] = new_cat_map.get(c["category_name"])

        opt_rows = []
        for o in src_opts:
            new_cat_id = old_to_new_cat.get(o["category_id"])
            # Try matching by name if category_id was null
            if not new_cat_id and o["name"]:
                new_cat_id = new_cat_map.get(o["name"])
            # Last resort: match by category_name from source
            if not new_cat_id:
                for src_cat in src_cats:
                    if src_cat["category_name"] == o["name"] or src_cat["category_name"].lower() == o["name"].lower():
                        new_cat_id = new_cat_map.get(src_cat["category_name"])
                        break
            opt_rows.append({
                "part_id": tpid,
                "category_id": new_cat_id,
                "name": o["name"],
                "gc_select_id": o["gc_select_id"],
                "sort_order": o["sort_order"],
            })

        code, new_opts = sb("POST", "catalog_extracted.gc_design_options", opt_rows)
        if not isinstance(new_opts, list):
            progress(f"ERROR creating design options: {code} {new_opts}")
            continue
        progress(f"{len(new_opts)} design options created")

        # Build old opt id → new opt id map
        old_to_new_opt = {}
        for new_o in new_opts:
            for old_o in src_opts:
                if old_o["gc_select_id"] == new_o["gc_select_id"]:
                    old_to_new_opt[old_o["id"]] = new_o["id"]
                    break

        # 2c: Create option values
        val_rows = []
        for v in src_vals:
            new_opt_id = old_to_new_opt.get(v["design_option_id"])
            if not new_opt_id:
                continue
            val_rows.append({
                "design_option_id": new_opt_id,
                "value_id": v["value_id"],
                "label": v["label"],
                "sort_order": v["sort_order"],
            })

        # Batch insert values
        batch_size = 200
        total_vals = 0
        for i in range(0, len(val_rows), batch_size):
            batch = val_rows[i:i+batch_size]
            code, body = sb("POST", "catalog_extracted.gc_option_values", batch)
            if code in (200, 201):
                total_vals += len(batch)
            else:
                progress(f"ERROR inserting values batch: {code}")
                break
        progress(f"{total_vals} option values created")

        # 2d: Create fit tools
        tool_rows = []
        for t in src_tools:
            tool_rows.append({
                "part_id": tpid,
                "fit_id": tfid,
                "name": t["name"],
                "input_type": t["input_type"],
                "min_val": t["min_val"],
                "max_val": t["max_val"],
                "step_val": t["step_val"],
                "default_val": t["default_val"],
                "sort_order": t["sort_order"],
            })
        if tool_rows:
            code, new_tools = sb("POST", "catalog_extracted.gc_fit_tools", tool_rows)
            if isinstance(new_tools, list):
                progress(f"{len(new_tools)} fit tools created")
            else:
                progress(f"Fit tools result: {code} {str(new_tools)[:200]}")

        # 2e: Copy branding positions + labels
        if src_branding:
            for bp in src_branding:
                bp_row = {
                    "part_id": tpid,
                    "position_id": bp["position_id"],
                    "position_name": bp["position_name"],
                }
                code, new_bp = sb("POST", "catalog_extracted.gc_branding_positions", [bp_row])
                if isinstance(new_bp, list) and new_bp:
                    new_bp_id = new_bp[0]["id"]
                    # Get labels for source position
                    code, labels = sb("GET", "catalog_extracted.gc_branding_labels",
                        params=f"select=label_id,label_name&position_fk=eq.{bp['id']}")
                    if isinstance(labels, list) and labels:
                        label_rows = [{"position_fk": new_bp_id, "label_id": l["label_id"], "label_name": l["label_name"]} for l in labels]
                        sb("POST", "catalog_extracted.gc_branding_labels", label_rows)
            progress(f"Branding positions + labels copied")

    # ── Step 3: Fix null category_id on Trousers design options ────
    print("\n[3/4] Fixing null category_id on Trousers design options...")
    # Build a mapping of category_name → category_id for Trousers
    cat_name_to_id = {c["category_name"]: c["id"] for c in src_cats}
    fixes = 0
    for opt in src_opts:
        if opt["category_id"] is not None:
            continue
        cat_id = cat_name_to_id.get(opt["name"])
        if cat_id:
            sb("PATCH", "catalog_extracted.gc_design_options",
                data={"category_id": cat_id}, params=f"id=eq.{opt['id']}")
            fixes += 1
    progress(f"Fixed {fixes} null category_id links on Trousers")

    # Also fix for ALL parts with null category_id
    code, all_null_opts = sb("GET", "catalog_extracted.gc_design_options",
        params="select=id,part_id,name,category_id&category_id=is.null")
    if isinstance(all_null_opts, list) and all_null_opts:
        # Get all categories
        code, all_cats = sb("GET", "catalog_extracted.gc_option_categories",
            params="select=id,part_id,category_name")
        cat_lookup = {}
        for c in (all_cats if isinstance(all_cats, list) else []):
            cat_lookup[(c["part_id"], c["category_name"])] = c["id"]

        global_fixes = 0
        for opt in all_null_opts:
            cat_id = cat_lookup.get((opt["part_id"], opt["name"]))
            if cat_id:
                sb("PATCH", "catalog_extracted.gc_design_options",
                    data={"category_id": cat_id}, params=f"id=eq.{opt['id']}")
                global_fixes += 1
        progress(f"Fixed {global_fixes} additional null category_id links across all parts")

    # ── Step 4: Verify ─────────────────────────────────────────────
    print("\n[4/4] Verification...")
    for target in TARGET_PARTS:
        tpid = target["part_id"]
        tname = target["name"]
        code, cats = sb("GET", "catalog_extracted.gc_option_categories",
            params=f"select=id&part_id=eq.{tpid}")
        code, opts = sb("GET", "catalog_extracted.gc_design_options",
            params=f"select=id&part_id=eq.{tpid}")
        code, tools = sb("GET", "catalog_extracted.gc_fit_tools",
            params=f"select=id&part_id=eq.{tpid}")
        n_cats = len(cats) if isinstance(cats, list) else 0
        n_opts = len(opts) if isinstance(opts, list) else 0
        n_tools = len(tools) if isinstance(tools, list) else 0
        progress(f"{tname} (part_id={tpid}): {n_cats} categories, {n_opts} design options, {n_tools} fit tools")

    print("\n" + "=" * 60)
    print("DONE — Chino and 5 Pocket now have design options + fit tools")
    print("=" * 60)


if __name__ == "__main__":
    main()
