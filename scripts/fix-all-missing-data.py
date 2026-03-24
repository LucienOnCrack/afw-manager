#!/usr/bin/env python3
"""
Fix ALL missing catalog data across all product parts.

Audits every part in catalog_extracted for gaps in:
  - Design option categories, options, and values
  - Fit tools
  - TryOn sizes
  - Branding positions & labels
  - Combo option availability

Parts that GoCreate's ShopSettings returns nothing for are filled
by copying from the closest related "source" part.

Borrowing relationships (target ← source):
  5 Pocket  (14) ← Trousers (2)   — same trouser family, DenimOrder
  Chino     (15) ← Trousers (2)   — same trouser family, DenimOrder
"""
import json, os, sys, subprocess
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUPABASE_URL = None
SUPABASE_KEY = None

# ── Borrowing config ────────────────────────────────────────────────
# Each entry: target part → (source_part_id, source_fit_id, target_fit_id)
# source_fit_id = which fit on the source to copy fit tools from
# target_fit_id = what fit_id to assign on the target
BORROW_MAP = {
    14: {"name": "5 Pocket", "source_part": 2, "source_fit": 1, "target_fit": 37},
    15: {"name": "Chino",    "source_part": 2, "source_fit": 1, "target_fit": 38},
}

# Branding borrowing: target_part_id → source_part_id
# Only copy when target has zero branding positions
BRANDING_BORROW = {
    14: 2,   # 5 Pocket ← Trousers
    15: 2,   # Chino ← Trousers
}

# TryOn borrowing: target_part_id → (source_part_id, source_fit_id, target_fit_id)
# Copies the TryOn size list so "Create from TryOn" works
TRYON_BORROW = {
    14: {"source_part": 2, "source_fit": 1, "target_fit": 37},
    15: {"source_part": 2, "source_fit": 1, "target_fit": 38},
}


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


def sb_get_all(table, params=""):
    """Paginated GET that fetches all rows."""
    all_rows = []
    offset = 0
    limit = 1000
    while True:
        sep = "&" if params else ""
        p = f"{params}{sep}offset={offset}&limit={limit}"
        code, rows = sb("GET", table, params=p)
        if code != 200 or not isinstance(rows, list):
            break
        all_rows.extend(rows)
        if len(rows) < limit:
            break
        offset += limit
    return all_rows


def progress(msg):
    print(f"  → {msg}", flush=True)


def section(title):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


# ════════════════════════════════════════════════════════════════════
# AUDIT: Check what every part has
# ════════════════════════════════════════════════════════════════════
def audit_all_parts():
    section("AUDIT — Checking all parts for missing data")

    parts = sb_get_all("catalog_extracted.gc_product_parts", "select=id,name&order=id")
    cats = sb_get_all("catalog_extracted.gc_option_categories", "select=id,part_id")
    opts = sb_get_all("catalog_extracted.gc_design_options", "select=id,part_id")
    tools = sb_get_all("catalog_extracted.gc_fit_tools", "select=id,part_id")
    tryon = sb_get_all("catalog_extracted.gc_tryon_sizes", "select=id,part_id")
    brand = sb_get_all("catalog_extracted.gc_branding_positions", "select=id,part_id")

    by_part = defaultdict(lambda: {"cats": 0, "opts": 0, "tools": 0, "tryon": 0, "brand": 0})
    for c in cats:
        by_part[c["part_id"]]["cats"] += 1
    for o in opts:
        by_part[o["part_id"]]["opts"] += 1
    for t in tools:
        by_part[t["part_id"]]["tools"] += 1
    for t in tryon:
        by_part[t["part_id"]]["tryon"] += 1
    for b in brand:
        by_part[b["part_id"]]["brand"] += 1

    print(f"\n  {'ID':>4}  {'Part Name':<22} {'Cats':>5} {'DOpts':>5} {'FitTl':>5} {'TryOn':>5} {'Brand':>5}  Status")
    print(f"  {'─'*4}  {'─'*22} {'─'*5} {'─'*5} {'─'*5} {'─'*5} {'─'*5}  {'─'*20}")

    issues = []
    for p in parts:
        pid = p["id"]
        name = p["name"]
        d = by_part[pid]
        flags = []
        if d["cats"] == 0 and d["opts"] == 0:
            flags.append("NO_DESIGN_OPTS")
        if d["tools"] == 0:
            flags.append("NO_FIT_TOOLS")
        if d["tryon"] == 0:
            flags.append("NO_TRYON")
        if d["brand"] == 0:
            flags.append("NO_BRANDING")

        status = ", ".join(flags) if flags else "OK"
        marker = "⚠" if flags else "✓"
        print(f"  {pid:>4}  {name:<22} {d['cats']:>5} {d['opts']:>5} {d['tools']:>5} {d['tryon']:>5} {d['brand']:>5}  {marker} {status}")

        if flags:
            issues.append((pid, name, flags))

    print(f"\n  {len(parts)} parts total, {len(issues)} with gaps")

    borrowable = [i for i in issues if i[0] in BORROW_MAP]
    non_borrowable = [i for i in issues if i[0] not in BORROW_MAP]

    if borrowable:
        print(f"\n  Will fix via borrowing:")
        for pid, name, flags in borrowable:
            src = BORROW_MAP[pid]["source_part"]
            print(f"    {name} (part {pid}) ← part {src}: {', '.join(flags)}")

    if non_borrowable:
        print(f"\n  Parts with gaps but no borrow source (likely intentional):")
        for pid, name, flags in non_borrowable:
            print(f"    {name} (part {pid}): {', '.join(flags)}")

    return issues


# ════════════════════════════════════════════════════════════════════
# FIX: Copy design options (categories + options + values + availability)
# ════════════════════════════════════════════════════════════════════
def fix_design_options(target_part_id, source_part_id):
    borrow = BORROW_MAP[target_part_id]
    tname = borrow["name"]
    progress(f"Design options: copying part {source_part_id} → {tname} (part {target_part_id})")

    # Check if already has data
    existing = sb_get_all("catalog_extracted.gc_option_categories",
        f"select=id&part_id=eq.{target_part_id}")
    if existing:
        progress(f"  Already has {len(existing)} categories — clearing first")
        sb("DELETE", "catalog_extracted.gc_option_values",
           params=f"design_option_id=in.({','.join(str(e['id']) for e in sb_get_all('catalog_extracted.gc_design_options', f'select=id&part_id=eq.{target_part_id}'))})"
        ) if sb_get_all("catalog_extracted.gc_design_options", f"select=id&part_id=eq.{target_part_id}") else None
        sb("DELETE", "catalog_extracted.gc_design_options", params=f"part_id=eq.{target_part_id}")
        sb("DELETE", "catalog_extracted.gc_option_categories", params=f"part_id=eq.{target_part_id}")
        sb("DELETE", "catalog_extracted.gc_combo_option_availability", params=f"part_id=eq.{target_part_id}")

    # Get source data
    src_cats = sb_get_all("catalog_extracted.gc_option_categories",
        f"select=id,part_id,category_name,is_monogram,sort_order&part_id=eq.{source_part_id}&order=sort_order")
    src_opts = sb_get_all("catalog_extracted.gc_design_options",
        f"select=id,category_id,part_id,name,gc_select_id,sort_order&part_id=eq.{source_part_id}&order=sort_order")

    if not src_cats and not src_opts:
        progress(f"  Source part {source_part_id} has no design options either — skipping")
        return

    # Create categories
    cat_rows = [{
        "part_id": target_part_id,
        "category_name": c["category_name"],
        "is_monogram": c.get("is_monogram", False),
        "sort_order": c["sort_order"],
    } for c in src_cats]

    _, new_cats = sb("POST", "catalog_extracted.gc_option_categories", cat_rows)
    if not isinstance(new_cats, list):
        progress(f"  ERROR creating categories: {new_cats}")
        return
    new_cat_map = {c["category_name"]: c["id"] for c in new_cats}
    old_cat_map = {c["id"]: c["category_name"] for c in src_cats}
    progress(f"  {len(new_cats)} categories created")

    # Create design options
    old_to_new_cat = {}
    for c in src_cats:
        old_to_new_cat[c["id"]] = new_cat_map.get(c["category_name"])

    opt_rows = [{
        "part_id": target_part_id,
        "category_id": old_to_new_cat.get(o["category_id"]),
        "name": o["name"],
        "gc_select_id": o["gc_select_id"],
        "sort_order": o["sort_order"],
    } for o in src_opts]

    _, new_opts = sb("POST", "catalog_extracted.gc_design_options", opt_rows)
    if not isinstance(new_opts, list):
        progress(f"  ERROR creating design options: {new_opts}")
        return
    progress(f"  {len(new_opts)} design options created")

    # Map old option ids → new option ids (by gc_select_id)
    old_to_new_opt = {}
    for new_o in new_opts:
        for old_o in src_opts:
            if old_o["gc_select_id"] == new_o["gc_select_id"]:
                old_to_new_opt[old_o["id"]] = new_o["id"]
                break

    # Copy option values
    src_opt_ids = [str(o["id"]) for o in src_opts]
    if src_opt_ids:
        src_vals = sb_get_all("catalog_extracted.gc_option_values",
            f"select=design_option_id,value_id,label,sort_order&design_option_id=in.({','.join(src_opt_ids)})&order=design_option_id,sort_order")

        val_rows = []
        for v in src_vals:
            new_opt_id = old_to_new_opt.get(v["design_option_id"])
            if new_opt_id:
                val_rows.append({
                    "design_option_id": new_opt_id,
                    "value_id": v["value_id"],
                    "label": v["label"],
                    "sort_order": v["sort_order"],
                })

        batch_size = 200
        total_vals = 0
        for i in range(0, len(val_rows), batch_size):
            batch = val_rows[i:i + batch_size]
            code, _ = sb("POST", "catalog_extracted.gc_option_values", batch)
            if code in (200, 201):
                total_vals += len(batch)
        progress(f"  {total_vals} option values created")

    # Copy combo availability
    src_avail = sb_get_all("catalog_extracted.gc_combo_option_availability",
        f"select=part_id,make_id,fit_id,atelier_id,design_option_id,available_value_ids&part_id=eq.{source_part_id}")

    if src_avail:
        avail_rows = []
        for a in src_avail:
            new_opt_id = old_to_new_opt.get(a["design_option_id"])
            if new_opt_id:
                avail_rows.append({
                    "part_id": target_part_id,
                    "make_id": a["make_id"],
                    "fit_id": a["fit_id"],
                    "atelier_id": a["atelier_id"],
                    "design_option_id": new_opt_id,
                    "available_value_ids": json.dumps(a["available_value_ids"]) if isinstance(a["available_value_ids"], list) else a["available_value_ids"],
                })
        total_avail = 0
        for i in range(0, len(avail_rows), batch_size):
            batch = avail_rows[i:i + batch_size]
            code, _ = sb("POST", "catalog_extracted.gc_combo_option_availability", batch)
            if code in (200, 201):
                total_avail += len(batch)
        progress(f"  {total_avail} combo availability rows created")


# ════════════════════════════════════════════════════════════════════
# FIX: Copy fit tools
# ════════════════════════════════════════════════════════════════════
def fix_fit_tools(target_part_id):
    borrow = BORROW_MAP[target_part_id]
    tname = borrow["name"]
    src_part = borrow["source_part"]
    src_fit = borrow["source_fit"]
    tgt_fit = borrow["target_fit"]
    progress(f"Fit tools: copying part {src_part}/fit {src_fit} → {tname} (part {target_part_id}/fit {tgt_fit})")

    existing = sb_get_all("catalog_extracted.gc_fit_tools",
        f"select=id&part_id=eq.{target_part_id}")
    if existing:
        progress(f"  Already has {len(existing)} fit tools — clearing first")
        sb("DELETE", "catalog_extracted.gc_fit_tools", params=f"part_id=eq.{target_part_id}")

    src_tools = sb_get_all("catalog_extracted.gc_fit_tools",
        f"select=name,input_type,min_val,max_val,step_val,default_val,sort_order&part_id=eq.{src_part}&fit_id=eq.{src_fit}&order=sort_order")

    if not src_tools:
        progress(f"  Source part {src_part}/fit {src_fit} has no fit tools — skipping")
        return

    tool_rows = [{
        "part_id": target_part_id,
        "fit_id": tgt_fit,
        "name": t["name"],
        "input_type": t["input_type"],
        "min_val": t["min_val"],
        "max_val": t["max_val"],
        "step_val": t["step_val"],
        "default_val": t["default_val"],
        "sort_order": t["sort_order"],
    } for t in src_tools]

    _, new_tools = sb("POST", "catalog_extracted.gc_fit_tools", tool_rows)
    if isinstance(new_tools, list):
        progress(f"  {len(new_tools)} fit tools created")
    else:
        progress(f"  Result: {str(new_tools)[:200]}")


# ════════════════════════════════════════════════════════════════════
# FIX: Copy TryOn sizes
# ════════════════════════════════════════════════════════════════════
def fix_tryon_sizes(target_part_id):
    if target_part_id not in TRYON_BORROW:
        return
    cfg = TRYON_BORROW[target_part_id]
    src_part = cfg["source_part"]
    src_fit = cfg["source_fit"]
    tgt_fit = cfg["target_fit"]
    tname = BORROW_MAP.get(target_part_id, {}).get("name", f"Part {target_part_id}")
    progress(f"TryOn sizes: copying part {src_part}/fit {src_fit} → {tname} (part {target_part_id}/fit {tgt_fit})")

    existing = sb_get_all("catalog_extracted.gc_tryon_sizes",
        f"select=id&part_id=eq.{target_part_id}")
    if existing:
        progress(f"  Already has {len(existing)} TryOn sizes — clearing first")
        sb("DELETE", "catalog_extracted.gc_tryon_sizes", params=f"part_id=eq.{target_part_id}")

    src_sizes = sb_get_all("catalog_extracted.gc_tryon_sizes",
        f"select=label,value,sort_order&part_id=eq.{src_part}&fit_id=eq.{src_fit}&order=sort_order")

    if not src_sizes:
        progress(f"  Source part {src_part}/fit {src_fit} has no TryOn sizes — skipping")
        return

    tryon_rows = [{
        "part_id": target_part_id,
        "fit_id": tgt_fit,
        "label": s["label"],
        "value": s["value"],
        "sort_order": s["sort_order"],
    } for s in src_sizes]

    code, body = sb("POST", "catalog_extracted.gc_tryon_sizes", tryon_rows)
    if code in (200, 201):
        count = len(body) if isinstance(body, list) else len(tryon_rows)
        progress(f"  {count} TryOn sizes created")
    else:
        progress(f"  ERROR: {code} {str(body)[:200]}")


# ════════════════════════════════════════════════════════════════════
# FIX: Copy branding positions + labels
# ════════════════════════════════════════════════════════════════════
def fix_branding(target_part_id):
    if target_part_id not in BRANDING_BORROW:
        return
    src_part = BRANDING_BORROW[target_part_id]
    tname = BORROW_MAP.get(target_part_id, {}).get("name", f"Part {target_part_id}")
    progress(f"Branding: copying part {src_part} → {tname} (part {target_part_id})")

    existing = sb_get_all("catalog_extracted.gc_branding_positions",
        f"select=id&part_id=eq.{target_part_id}")
    if existing:
        progress(f"  Already has {len(existing)} branding positions — skipping")
        return

    src_positions = sb_get_all("catalog_extracted.gc_branding_positions",
        f"select=id,position_id,position_name&part_id=eq.{src_part}")

    if not src_positions:
        progress(f"  Source part {src_part} has no branding positions — skipping")
        return

    for bp in src_positions:
        bp_row = {
            "part_id": target_part_id,
            "position_id": bp["position_id"],
            "position_name": bp["position_name"],
        }
        _, new_bp = sb("POST", "catalog_extracted.gc_branding_positions", [bp_row])
        if isinstance(new_bp, list) and new_bp:
            new_bp_id = new_bp[0]["id"]
            labels = sb_get_all("catalog_extracted.gc_branding_labels",
                f"select=label_id,label_name&position_fk=eq.{bp['id']}")
            if labels:
                label_rows = [{
                    "position_fk": new_bp_id,
                    "label_id": l["label_id"],
                    "label_name": l["label_name"],
                } for l in labels]
                sb("POST", "catalog_extracted.gc_branding_labels", label_rows)

    progress(f"  Branding positions + labels copied")


# ════════════════════════════════════════════════════════════════════
# FIX: Repair null category_id references on design options
# ════════════════════════════════════════════════════════════════════
def fix_null_category_ids():
    section("Fixing null category_id references on design options")

    null_opts = sb_get_all("catalog_extracted.gc_design_options",
        "select=id,part_id,name,category_id&category_id=is.null")

    if not null_opts:
        progress("No null category_id references found — all good")
        return

    progress(f"Found {len(null_opts)} design options with null category_id")

    all_cats = sb_get_all("catalog_extracted.gc_option_categories",
        "select=id,part_id,category_name")
    cat_lookup = {}
    for c in all_cats:
        cat_lookup[(c["part_id"], c["category_name"])] = c["id"]

    fixes = 0
    for opt in null_opts:
        cat_id = cat_lookup.get((opt["part_id"], opt["name"]))
        if cat_id:
            sb("PATCH", "catalog_extracted.gc_design_options",
               data={"category_id": cat_id}, params=f"id=eq.{opt['id']}")
            fixes += 1

    progress(f"Fixed {fixes}/{len(null_opts)} null category_id links")


# ════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════
def main():
    print("=" * 60)
    print("Fix ALL Missing Catalog Data")
    print("=" * 60)
    load_env()
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Missing Supabase credentials in .env.local")
        sys.exit(1)

    # Phase 1: Audit
    issues = audit_all_parts()

    # Phase 2: Fix parts that have borrow sources
    borrowable_parts = [pid for pid, _, _ in issues if pid in BORROW_MAP]

    if not borrowable_parts:
        print("\n  No fixable gaps found — everything looks good!")
    else:
        for target_pid in borrowable_parts:
            borrow = BORROW_MAP[target_pid]
            tname = borrow["name"]
            src_part = borrow["source_part"]

            section(f"Fixing {tname} (part {target_pid}) ← part {src_part}")

            # Check which data types are missing
            cats = sb_get_all("catalog_extracted.gc_option_categories",
                f"select=id&part_id=eq.{target_pid}")
            opts = sb_get_all("catalog_extracted.gc_design_options",
                f"select=id&part_id=eq.{target_pid}")
            tools = sb_get_all("catalog_extracted.gc_fit_tools",
                f"select=id&part_id=eq.{target_pid}")
            tryon = sb_get_all("catalog_extracted.gc_tryon_sizes",
                f"select=id&part_id=eq.{target_pid}")

            if not cats and not opts:
                fix_design_options(target_pid, src_part)
            else:
                progress(f"Design options: already has {len(cats)} cats, {len(opts)} opts — skipping")

            if not tools:
                fix_fit_tools(target_pid)
            else:
                progress(f"Fit tools: already has {len(tools)} — skipping")

            if not tryon:
                fix_tryon_sizes(target_pid)
            else:
                progress(f"TryOn sizes: already has {len(tryon)} — skipping")

            fix_branding(target_pid)

    # Phase 3: Fix null category_id references
    fix_null_category_ids()

    # Phase 4: Final verification
    section("FINAL VERIFICATION")
    audit_all_parts()

    print("\n" + "=" * 60)
    print("ALL FIXES COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
