#!/usr/bin/env python3
"""
Phase 2: Extract full order data from GoCreate REST API.
Uses OtherDetails param to get ItemDetails, DesignOptions, FitTools, BrandingOptions.
"""
import json, os, subprocess, sys, time

API_BASE = "https://api.gocreate.nu"
CREDS = {
    "UserName": "ANTHO_API",
    "Password": "3364f04c99e7abc03bd04eb521f4f6da",
    "AuthenticationToken": "EAAAAHo4+kCbKYt1wfaLa/hqobii9OGMfboFIRcTcwFWy7zk"
}
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "gocreate-api")
os.makedirs(OUT_DIR, exist_ok=True)

def api_post(endpoint, extra_data=None, timeout=30):
    data = {**CREDS}
    if extra_data:
        data.update(extra_data)
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", str(timeout), "--connect-timeout", "10",
             "-X", "POST", "-H", "Content-Type: application/json",
             "-d", json.dumps(data), f"{API_BASE}{endpoint}"],
            capture_output=True, text=True, timeout=timeout + 10
        )
        return json.loads(r.stdout) if r.stdout.strip() else None
    except Exception as e:
        print(f"  ERROR {endpoint}: {e}")
        return None

print("=" * 70)
print("  Phase 2: Extract full order data from GoCreate REST API")
print("=" * 70)

# Step 1: Find all orders from recent dates
print("\n[1] Finding orders by date...")
all_order_summaries = []
for date in ["2026-03-17", "2026-03-16", "2026-03-15", "2026-03-14", "2026-03-13",
             "2026-03-12", "2026-03-11", "2026-03-10", "2026-03-09", "2026-03-08",
             "2026-03-07", "2026-03-06", "2026-03-05", "2026-03-04", "2026-03-03",
             "2026-02-28", "2026-02-21", "2026-02-14", "2026-02-07", "2026-01-31",
             "2026-01-15", "2026-01-01", "2025-12-15", "2025-12-01", "2025-11-15",
             "2025-11-01", "2025-10-15", "2025-10-01", "2025-09-15", "2025-09-01"]:
    d = api_post("/Order/ByOrderdate", {"OrderDate": date})
    if d and d.get("IsValidResult") and d.get("Orders"):
        orders = d["Orders"]
        all_order_summaries.extend(orders)
        print(f"  {date}: {len(orders)} orders")
    time.sleep(0.05)

print(f"\n  Total order summaries: {len(all_order_summaries)}")

# Deduplicate by order number
seen = set()
unique_orders = []
for o in all_order_summaries:
    num = o.get("OrderNumber")
    if num and num not in seen:
        seen.add(num)
        unique_orders.append(o)
print(f"  Unique orders: {len(unique_orders)}")

# Categorize by order type
by_type = {}
for o in unique_orders:
    ot = o.get("OrderType", "unknown")
    if ot not in by_type:
        by_type[ot] = []
    by_type[ot].append(o)

print("\n  By type:")
for ot, orders in sorted(by_type.items()):
    print(f"    {ot}: {len(orders)}")

# Step 2: Fetch FULL details for diverse set of orders
print(f"\n{'=' * 70}")
print("[2] Fetching FULL order details with OtherDetails param...")
print("=" * 70)

# Pick up to 3 orders per type to get diverse data
orders_to_fetch = []
for ot, orders in by_type.items():
    for o in orders[:3]:
        orders_to_fetch.append(o["OrderNumber"])

# Add the known reference order
orders_to_fetch.append("ANTHO.BIL.GB.2371641")
orders_to_fetch = list(set(orders_to_fetch))
print(f"\n  Fetching {len(orders_to_fetch)} orders with full details...\n")

full_orders = []
for i, order_num in enumerate(orders_to_fetch):
    sys.stdout.write(f"  [{i+1}/{len(orders_to_fetch)}] {order_num}... ")
    sys.stdout.flush()
    d = api_post("/Order/ByOrderNumber", {
        "OrderNumber": order_num,
        "OtherDetails": {
            "FetchFitTools": True,
            "FetchDesignOptions": True,
            "FetchItemDetails": True,
            "FetchBrandingOptions": True,
        }
    })
    if d and d.get("IsValidResult"):
        full_orders.append(d)
        ot = d.get("OrderInfo", {}).get("OrderType", "?")
        items = d.get("ItemDetails") or []
        options = d.get("Options") or []
        branding = d.get("BrandingOptions") or []
        fittools = d.get("FitTools") or []
        print(f"{ot} | items={len(items)}, options={len(options)}, branding={len(branding)}, fittools={len(fittools)}")
    else:
        err = d.get("ErrorMessage", "?") if d else "no response"
        print(f"ERROR: {err}")
    time.sleep(0.1)

with open(os.path.join(OUT_DIR, "full_orders_diverse.json"), "w") as f:
    json.dump(full_orders, f, indent=2)
print(f"\n  Saved {len(full_orders)} full orders")

# Step 3: Deep analysis
print(f"\n{'=' * 70}")
print("[3] Analyzing all order data...")
print("=" * 70)

# 3a: Combination → parts mapping (from ItemDetails)
combo_parts = {}
for o in full_orders:
    info = o.get("OrderInfo", {})
    ot = info.get("OrderType", "?")
    otid = info.get("OrderTypeId", -1)
    parts = [(d["ProductPartId"], d["ProductPartName"]) for d in (o.get("ItemDetails") or [])]
    if parts:
        key = f"{otid}_{ot}"
        if key not in combo_parts or len(parts) > len(combo_parts[key]["parts"]):
            combo_parts[key] = {"orderType": ot, "orderTypeId": otid, "parts": parts}

print(f"\n  Combination → Parts ({len(combo_parts)} types):")
for key, val in sorted(combo_parts.items()):
    print(f"    {val['orderType']} (id={val['orderTypeId']}): {[p[1] for p in val['parts']]}")

with open(os.path.join(OUT_DIR, "combination_parts.json"), "w") as f:
    json.dump(combo_parts, f, indent=2)

# 3b: ALL branding positions/labels seen in orders
all_branding = {}
for o in full_orders:
    for bp in (o.get("BrandingOptions") or []):
        pid = bp.get("ProductPartId")
        pname = bp.get("ProductPartName", "?")
        for bd in (bp.get("BrandingOptionDetails") or []):
            pos_id = bd.get("PositionId")
            pos_name = bd.get("PositionName", "?")
            label_id = bd.get("LabelId")
            label_name = bd.get("LabelName", "?")
            if pid not in all_branding:
                all_branding[pid] = {"partName": pname, "positions": {}}
            if pos_id not in all_branding[pid]["positions"]:
                all_branding[pid]["positions"][pos_id] = {"positionName": pos_name, "labels": {}}
            all_branding[pid]["positions"][pos_id]["labels"][str(label_id)] = label_name

print(f"\n  Branding ({len(all_branding)} parts):")
for pid, data in sorted(all_branding.items()):
    print(f"    {data['partName']} (id={pid}):")
    for pos_id, pos_data in sorted(data["positions"].items()):
        labels = list(pos_data["labels"].values())
        print(f"      Pos {pos_id} '{pos_data['positionName']}': {labels}")

with open(os.path.join(OUT_DIR, "branding_from_orders.json"), "w") as f:
    json.dump(all_branding, f, indent=2, default=str)

# 3c: ALL ItemDetail fields (makes, fits, tryon, styles, models)
all_item_details = []
for o in full_orders:
    for item in (o.get("ItemDetails") or []):
        all_item_details.append(item)

item_detail_fields = set()
for item in all_item_details:
    item_detail_fields.update(item.keys())
print(f"\n  ItemDetail fields: {sorted(item_detail_fields)}")

unique_makes = set()
unique_fits = set()
unique_styles = set()
unique_tryons = set()
for item in all_item_details:
    unique_makes.add(item.get("MakeName", ""))
    unique_fits.add(item.get("FitName", ""))
    unique_styles.add(item.get("StyleName", ""))
    unique_tryons.add(item.get("TryOn", ""))

print(f"  Makes: {sorted(unique_makes - {''})}")
print(f"  Fits: {sorted(unique_fits - {''})}")
print(f"  Styles: {sorted(unique_styles - {''})}")
print(f"  TryOns (sample): {sorted(list(unique_tryons - {''}))[:10]}")

with open(os.path.join(OUT_DIR, "item_details_from_orders.json"), "w") as f:
    json.dump(all_item_details, f, indent=2)

# 3d: ALL design option categories and values seen
all_option_categories = {}
all_option_values = {}
trim_master_ids = set()
for o in full_orders:
    for part in (o.get("Options") or []):
        ppid = part.get("ProductPartId")
        ppname = part.get("ProductPartName", "?")
        for cat in (part.get("OptionCategories") or []):
            cid = cat.get("CategoryId")
            cname = cat.get("CategoryName", "?")
            if cid not in all_option_categories:
                all_option_categories[cid] = {"name": cname, "parts": set()}
            all_option_categories[cid]["parts"].add(ppname)
            for opt in (cat.get("OptionDetails") or []):
                oid = opt.get("OptionId")
                if oid not in all_option_values:
                    all_option_values[oid] = {
                        "name": opt.get("Name"),
                        "value": opt.get("Value"),
                        "optionValueId": opt.get("OptionValueId"),
                        "isForTrim": opt.get("IsForTrim"),
                        "trimMasterId": opt.get("TrimMasterId"),
                        "optionValueType": opt.get("OptionValueType"),
                        "categoryId": cid,
                        "categoryName": cname,
                        "partName": ppname,
                    }
                if opt.get("IsForTrim"):
                    trim_master_ids.add(opt.get("TrimMasterId"))

print(f"\n  Design option categories: {len(all_option_categories)}")
for cid, data in sorted(all_option_categories.items()):
    print(f"    {data['name']} (id={cid}): parts={sorted(data['parts'])}")

print(f"\n  Unique option values: {len(all_option_values)}")
print(f"  Trim master IDs: {sorted(trim_master_ids)}")

# Convert sets to lists for JSON
for cid in all_option_categories:
    all_option_categories[cid]["parts"] = sorted(all_option_categories[cid]["parts"])

with open(os.path.join(OUT_DIR, "design_option_categories_from_orders.json"), "w") as f:
    json.dump(all_option_categories, f, indent=2, default=str)
with open(os.path.join(OUT_DIR, "design_option_values_from_orders.json"), "w") as f:
    json.dump(all_option_values, f, indent=2, default=str)

# 3e: ALL OrderInfo fields (complete schema)
all_order_info_keys = set()
for o in full_orders:
    all_order_info_keys.update((o.get("OrderInfo") or {}).keys())

print(f"\n  OrderInfo fields ({len(all_order_info_keys)}):")
for k in sorted(all_order_info_keys):
    samples = set()
    for o in full_orders:
        v = (o.get("OrderInfo") or {}).get(k)
        if v is not None and v != "" and v != 0:
            samples.add(str(v)[:50])
        if len(samples) >= 3:
            break
    print(f"    {k}: {sorted(samples) if samples else '(empty)'}")

# 3f: FitTool IDs and names
all_fit_tool_ids = {}
for o in full_orders:
    for part in (o.get("FitTools") or []):
        ppid = part.get("ProductPartId")
        ppname = part.get("ProductPartName", "?")
        for ft in (part.get("FitToolDetails") or []):
            fid = ft.get("Id")
            if fid not in all_fit_tool_ids:
                all_fit_tool_ids[fid] = {"name": ft.get("Name"), "partId": ppid, "partName": ppname}

print(f"\n  FitTool IDs seen: {len(all_fit_tool_ids)}")

with open(os.path.join(OUT_DIR, "fit_tool_ids_from_orders.json"), "w") as f:
    json.dump(all_fit_tool_ids, f, indent=2, default=str)

# 3g: ALL top-level keys from orders
top_keys = set()
for o in full_orders:
    top_keys.update(o.keys())
print(f"\n  Full order top-level keys: {sorted(top_keys)}")

# 3h: FinishMeasurement and BodyMeasurement structure
finish_fields = set()
body_fields = set()
for o in full_orders:
    for part in (o.get("FinishMeasurement") or []):
        if isinstance(part, dict):
            finish_fields.update(part.keys())
            for m in (part.get("MeasurementDetails") or []):
                finish_fields.update(f"detail.{k}" for k in m.keys())
    for part in (o.get("BodyMeasurements") or []):
        if isinstance(part, dict):
            body_fields.update(part.keys())
            for m in (part.get("BodyMeasurementDetails") or part.get("MeasurementDetails") or []):
                if isinstance(m, dict):
                    body_fields.update(f"detail.{k}" for k in m.keys())

print(f"  FinishMeasurement fields: {sorted(finish_fields)}")
print(f"  BodyMeasurement fields: {sorted(body_fields)}")

# 3i: PriceDetails structure
price_fields = set()
for o in full_orders:
    for p in (o.get("PriceDetails") or []):
        if isinstance(p, dict):
            price_fields.update(p.keys())

print(f"  PriceDetails fields: {sorted(price_fields)}")

# Final summary
summary = {
    "total_unique_orders": len(unique_orders),
    "full_orders_fetched": len(full_orders),
    "order_types": {ot: len(orders) for ot, orders in by_type.items()},
    "combination_parts_types": len(combo_parts),
    "branding_parts": len(all_branding),
    "item_detail_fields": sorted(item_detail_fields),
    "design_option_categories": len(all_option_categories),
    "design_option_unique_values": len(all_option_values),
    "trim_master_ids": sorted(trim_master_ids),
    "fit_tool_ids": len(all_fit_tool_ids),
    "order_info_fields": sorted(all_order_info_keys),
    "finish_measurement_fields": sorted(finish_fields),
    "body_measurement_fields": sorted(body_fields),
    "price_detail_fields": sorted(price_fields),
}
with open(os.path.join(OUT_DIR, "extraction_summary.json"), "w") as f:
    json.dump(summary, f, indent=2)

print(f"\n{'=' * 70}")
print(f"  Phase 2 COMPLETE")
print(f"  {len(full_orders)} orders with full details saved")
print(f"  All data saved to data/gocreate-api/")
print(f"{'=' * 70}")
