#!/usr/bin/env python3
"""
Update gc_fit_tools in catalog_extracted with full metadata from extracted data.
Updates input_type to 'checkbox' and sets default_val based on checked state.
"""

import json
import os
import subprocess
import html

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SUPABASE_URL = None
SUPABASE_KEY = None

def load_env():
    global SUPABASE_URL, SUPABASE_KEY
    with open(os.path.join(BASE, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                SUPABASE_URL = line.split("=", 1)[1].strip().strip('"')
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                SUPABASE_KEY = line.split("=", 1)[1].strip().strip('"')

def supabase_patch(table, match_params, updates):
    schema = "catalog_extracted"
    tbl = table
    url = f"{SUPABASE_URL}/rest/v1/{tbl}?{match_params}"
    cmd = [
        "curl", "-s", "-w", "\n%{http_code}", "-X", "PATCH", url,
        "-H", f"apikey: {SUPABASE_KEY}",
        "-H", f"Authorization: Bearer {SUPABASE_KEY}",
        "-H", "Content-Type: application/json",
        "-H", "Prefer: return=minimal",
        "-H", f"Accept-Profile: {schema}",
        "-H", f"Content-Profile: {schema}",
        "-d", json.dumps(updates),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    lines = result.stdout.strip().rsplit("\n", 1)
    code = int(lines[-1]) if len(lines) > 1 else 0
    return code

def progress(msg):
    print(f"  → {msg}", flush=True)

def main():
    print("Updating gc_fit_tools with metadata from extraction...")
    load_env()

    fittool_path = os.path.join(BASE, "data", "gocreate-deep", "fittool_metadata_all.json")
    with open(fittool_path) as f:
        data = json.load(f)

    updated = 0
    total = 0

    for key, info in data.items():
        part_id = info["productPartId"]
        fit_id = info["fitId"]

        for tool in info["tools"]:
            total += 1
            tool_name = html.unescape(tool["name"])
            default_val = "1" if tool["default_checked"] else "0"

            match_params = f"part_id=eq.{part_id}&fit_id=eq.{fit_id}&name=eq.{tool_name}"
            updates = {
                "input_type": "checkbox",
                "default_val": default_val,
            }

            code = supabase_patch("gc_fit_tools", match_params, updates)
            if code in (200, 204):
                updated += 1

        progress(f"{info['productPart']} × {info['fitName']}: {len(info['tools'])} tools updated")

    progress(f"Total updated: {updated}/{total}")

if __name__ == "__main__":
    main()
