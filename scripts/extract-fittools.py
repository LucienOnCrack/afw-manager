#!/usr/bin/env python3
"""Extract FitTools for all 29 product parts from GoCreate ShopSettings.
Run: python3 scripts/extract-fittools.py
"""
import json, re, urllib.request, os, sys

COOKIE = "ASP.NET_SessionId=kef4nm3qyjz2oif030vvvoek; MunroShopSitesFormAuthentication=734894C36A165619745FBA8249BEC8F8601C989B8BFE514FAFBAFAF914474D043DE79F959E40978978B9610DDEEAA5A4ADFB4E1667CDD4FAA6A7256C1865AECAC6AC667877E9B026A476F39F3998FBFE690EDADF7F918211A5AEBFCC565E1FAAF4EFC7F9862F96F539A2867DE423BF950C39EBA2"
BASE = "https://gocreate.nu"
DIR = os.path.join(os.path.dirname(__file__), "..", "data", "gocreate-web")
OUTFILE = os.path.join(DIR, "fit_tools_all_parts.json")

def fetch_post(path, data=""):
    headers = {
        "Cookie": COOKIE,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    req = urllib.request.Request(BASE + path, data=data.encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, str(e)

PARTS = {
    1: "Jacket", 2: "Trousers", 3: "Waistcoat", 4: "Shirt",
    5: "Overcoat", 12: "Bermuda", 13: "Pea coat", 14: "5 Pocket",
    15: "Chino", 16: "Formal round", 18: "Informal", 20: "Flex",
    21: "Sneaker", 22: "Tie", 23: "Bow tie", 24: "Pocket square",
    25: "Belt", 26: "Coat", 27: "Detachable liner", 31: "Informal jacket",
    32: "Knitwear", 33: "City loafer", 34: "Beanie", 35: "Scarf",
    36: "Quilted vest", 37: "Cummerbund", 38: "Vest", 40: "Pants", 41: "Runner",
}
FITS = [38, 41, 39, 1, 40, 42, 43, 44, 45]

total = len(PARTS)
all_fittools = {}

print(f"\n{'='*60}")
print(f"  FIT TOOLS EXTRACTION - {total} product parts")
print(f"{'='*60}\n")
sys.stdout.flush()

done = 0
for part_id, part_name in PARTS.items():
    done += 1
    bar = "█" * (done * 30 // total) + "░" * (30 - done * 30 // total)
    print(f"  [{bar}] {done}/{total}  {part_name:20s}", end="", flush=True)

    found = False
    for fit_id in FITS:
        data = f"SelectedProductPartID={part_id}&SelectedProductFitID={fit_id}"
        code, body = fetch_post("/ShopSettings/GetFitTools", data)

        if code == 200 and len(body) > 300:
            labels = [l.strip() for l in re.findall(r'<label[^>]*>([^<]+)</label>', body) if l.strip()]
            labels = [l for l in labels if l not in ("FitTools", "Is visible", "Do not show this message again", "#")]
            checkboxes = re.findall(r'<input[^>]*type="checkbox"[^>]*id="([^"]*)"[^>]*', body, re.I)
            checked = re.findall(r'<input[^>]*type="checkbox"[^>]*id="([^"]*)"[^>]*checked', body, re.I)

            if labels:
                all_fittools[f"part{part_id}_{part_name}_fit{fit_id}"] = {
                    "productPartId": part_id,
                    "productPart": part_name,
                    "fitId": fit_id,
                    "fitTools": labels,
                    "totalCheckboxes": len(checkboxes),
                    "checkedCheckboxes": len(checked),
                }
                print(f" -> {len(labels)} tools, {len(checked)}/{len(checkboxes)} enabled")
                sys.stdout.flush()
                found = True
                break

    if not found:
        print(f" -> (no fit tools)")
        sys.stdout.flush()

    # Save after each part so we don't lose progress
    with open(OUTFILE, "w") as f:
        json.dump(all_fittools, f, indent=2)

print(f"\n{'='*60}")
print(f"  DONE! Saved {len(all_fittools)} fit tool configs to:")
print(f"  {OUTFILE}")
print(f"{'='*60}\n")
