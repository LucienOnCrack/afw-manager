#!/usr/bin/env python3
"""
Extract FitTool full metadata (checkbox IDs, default checked state) 
and Branding label data from GoCreate ShopSettings and Stock pages.
"""

import json
import os
import sys
import subprocess
import html
import re
from html.parser import HTMLParser

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_WEB = os.path.join(BASE, "data", "gocreate-web")
DATA_OUT = os.path.join(BASE, "data", "gocreate-deep")

COOKIE = "ASP.NET_SessionId=um0ei1tbctr1p0wf5t4sbdrl; MunroShopSitesFormAuthentication=26896477E61D864518EEFE147411352EB8A71AD47D5AF263675E981B2BDD071B3607C0647BDD7C9D1B344111E271AA8EDC75D935F0C0CD1826D6104003DFFF84643184FE5678F7A84E79877BD0B5A4437F16049AE5EBFD0207EECC0E8B269D7B2B7E92B254854DA650AE4B919C98EFF21792B013"
HEADERS = [
    "-H", f"Cookie: {COOKIE}",
    "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "-H", "Referer: https://gocreate.nu/ShopSettings/FitTools",
]

def curl_post(url, data_str):
    cmd = [
        "curl", "-s", "-w", "\n%{http_code}", "-X", "POST", url,
        "-H", "Content-Type: application/x-www-form-urlencoded",
        *HEADERS,
        "-d", data_str,
        "--max-time", "15",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        lines = result.stdout.rsplit("\n", 1)
        body = lines[0] if len(lines) > 1 else result.stdout
        code = int(lines[-1]) if len(lines) > 1 else 0
        return code, body
    except Exception as e:
        return 0, str(e)

def curl_get(url):
    cmd = [
        "curl", "-s", "-w", "\n%{http_code}", url,
        *HEADERS,
        "--max-time", "15",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        lines = result.stdout.rsplit("\n", 1)
        body = lines[0] if len(lines) > 1 else result.stdout
        code = int(lines[-1]) if len(lines) > 1 else 0
        return code, body
    except Exception as e:
        return 0, str(e)

def progress(msg):
    print(f"  → {msg}", flush=True)

# ──────────────────────────────────────────────────────────────────
# FitTool Metadata Extraction
# ──────────────────────────────────────────────────────────────────

class FitToolHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tools = []
        self.current_label = ""
        self.in_label = False
        self.current_checkbox = None

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == "input" and attr_dict.get("type") == "checkbox":
            tool_id = attr_dict.get("id", "")
            name = attr_dict.get("name", "")
            checked = "checked" in attr_dict
            self.current_checkbox = {
                "id": tool_id,
                "name": name,
                "checked": checked,
            }
        elif tag == "label":
            self.in_label = True
            self.current_label = ""

    def handle_endtag(self, tag):
        if tag == "label" and self.in_label:
            self.in_label = False
            label_text = self.current_label.strip()
            if self.current_checkbox and label_text:
                self.current_checkbox["label"] = label_text
                self.tools.append(self.current_checkbox)
                self.current_checkbox = None

    def handle_data(self, data):
        if self.in_label:
            self.current_label += data

def extract_fittool_metadata():
    print("\n[1/2] Extracting FitTool metadata for all part×fit combos")

    plmf = json.load(open(os.path.join(DATA_WEB, "product_lines_makes_fits.json")))

    all_results = {}
    total_tools = 0
    combo_count = 0

    for part_name, info in plmf.items():
        part_id = info["partId"]
        fits = info.get("productFits", [])

        for fit in fits:
            fit_id = fit["id"]
            fit_name = fit["name"].strip()
            combo_count += 1

            data_str = f"SelectedProductPartID={part_id}&SelectedProductFitID={fit_id}"
            code, body = curl_post("https://gocreate.nu/ShopSettings/GetFitTools", data_str)

            if code != 200:
                progress(f"FAILED {part_name} × {fit_name}: HTTP {code}")
                continue

            parser = FitToolHTMLParser()
            parser.feed(body)

            key = f"part{part_id}_{part_name}_fit{fit_id}"
            tools = []
            for t in parser.tools:
                if t.get("id", "").startswith("chk_"):
                    tools.append({
                        "checkbox_id": t["id"],
                        "name": html.unescape(t.get("label", "")),
                        "default_checked": t["checked"],
                        "input_type": "checkbox",
                    })

            all_results[key] = {
                "productPartId": part_id,
                "productPart": part_name,
                "fitId": fit_id,
                "fitName": fit_name,
                "tools": tools,
                "tool_count": len(tools),
            }
            total_tools += len(tools)

            progress(f"[{combo_count}] {part_name} × {fit_name}: {len(tools)} tools")

    out_path = os.path.join(DATA_OUT, "fittool_metadata_all.json")
    with open(out_path, "w") as f:
        json.dump(all_results, f, indent=2)

    progress(f"Total: {total_tools} tools across {combo_count} combos → {out_path}")
    return all_results

# ──────────────────────────────────────────────────────────────────
# Branding / Label Extraction from Stocks > Label page
# ──────────────────────────────────────────────────────────────────

class LabelPageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.cells = []
        self.current_cell = ""
        self.rows = []
        self.in_th = False
        self.headers = []

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.in_table = True
        elif tag == "tr" and self.in_table:
            self.in_row = True
            self.cells = []
        elif tag in ("td", "th") and self.in_row:
            self.in_cell = True
            self.in_th = (tag == "th")
            self.current_cell = ""

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.in_cell:
            self.in_cell = False
            if self.in_th:
                self.headers.append(self.current_cell.strip())
            else:
                self.cells.append(self.current_cell.strip())
        elif tag == "tr" and self.in_row:
            self.in_row = False
            if self.cells:
                self.rows.append(self.cells)
        elif tag == "table":
            self.in_table = False

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell += data


def extract_branding_labels():
    print("\n[2/2] Extracting Branding/Label data from Stocks > Label")

    code, body = curl_get("https://gocreate.nu/Label/Index")
    if code != 200:
        progress(f"FAILED to load Label page: HTTP {code}")
        # Try alternate URL
        code, body = curl_get("https://gocreate.nu/Stock/Label")
        if code != 200:
            progress(f"FAILED alternate too: HTTP {code}")
            return {}

    progress(f"Label page loaded: {len(body)} bytes")

    # Parse the HTML for label data
    parser = LabelPageParser()
    parser.feed(body)

    progress(f"Found {len(parser.headers)} table headers, {len(parser.rows)} data rows")
    if parser.headers:
        progress(f"Headers: {parser.headers}")
    for row in parser.rows[:5]:
        progress(f"  Row: {row}")

    # Also try to find select elements and branding position data
    # Search for branding-related patterns in the HTML
    branding_patterns = [
        r'<select[^>]*name="([^"]*branding[^"]*)"[^>]*>(.*?)</select>',
        r'<select[^>]*name="([^"]*position[^"]*)"[^>]*>(.*?)</select>',
        r'<select[^>]*name="([^"]*label[^"]*)"[^>]*>(.*?)</select>',
    ]

    select_data = {}
    for pattern in branding_patterns:
        matches = re.findall(pattern, body, re.IGNORECASE | re.DOTALL)
        for name, html_content in matches:
            options = re.findall(r'<option\s+value="([^"]*)"[^>]*>([^<]*)</option>', html_content)
            if options:
                select_data[name] = [{"value": v, "text": t} for v, t in options]
                progress(f"Found select '{name}': {len(options)} options")

    # Save raw HTML for analysis
    raw_path = os.path.join(DATA_OUT, "label_page_raw.html")
    with open(raw_path, "w") as f:
        f.write(body)
    progress(f"Raw HTML saved to {raw_path}")

    out_path = os.path.join(DATA_OUT, "branding_labels_from_settings.json")
    result = {
        "headers": parser.headers,
        "rows": parser.rows,
        "select_data": select_data,
    }
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)

    progress(f"Label data saved to {out_path}")
    return result


def main():
    print("=" * 60)
    print("GoCreate FitTool Metadata & Branding Extraction")
    print("=" * 60)

    fittool_data = extract_fittool_metadata()
    branding_data = extract_branding_labels()

    print("\n" + "=" * 60)
    print("EXTRACTION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
