#!/usr/bin/env python3
"""Deep-parse GoCreate wizard HTML files to extract all form elements, inline JS, and data attributes."""

import json
import re
import os
from html.parser import HTMLParser
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FILES = {
    "Formal_Suit": os.path.join(BASE, "data/gocreate-web/wizard_formal_suit.html"),
    "Formal_Suits_and_Jacket": os.path.join(BASE, "data/gocreate-web/wizard_Formal_suits_and_Jacket.html"),
    "Informal_Suits_and_Jacket": os.path.join(BASE, "data/gocreate-web/wizard_Informal_suits_and_Jacket.html"),
    "Shirts": os.path.join(BASE, "data/gocreate-web/wizard_Shirts.html"),
    "Trousers": os.path.join(BASE, "data/gocreate-web/wizard_Trousers.html"),
    "Vests": os.path.join(BASE, "data/gocreate-web/wizard_Vests.html"),
}

OUTPUT = os.path.join(BASE, "data/gocreate-deep/wizard_html_deep_parse.json")


class WizardHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.selects = []
        self.hiddens = []
        self.radios = []
        self.checkboxes = []
        self.text_inputs = []
        self.textareas = []
        self.forms = []
        self.data_attrs = []
        self.inline_scripts = []

        self._in_select = False
        self._current_select = None
        self._in_option = False
        self._current_option = None
        self._option_text = ""

        self._in_script = False
        self._script_content = ""
        self._script_attrs = {}

        self._in_textarea = False
        self._textarea_content = ""
        self._textarea_attrs = {}

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        tag_lower = tag.lower()

        # Collect data-* attributes from ANY element
        data_items = {k: v for k, v in attrs if k.startswith("data-")}
        if data_items:
            self.data_attrs.append({
                "tag": tag_lower,
                "id": attr_dict.get("id", ""),
                "name": attr_dict.get("name", ""),
                "class": attr_dict.get("class", ""),
                "data_attributes": data_items,
            })

        if tag_lower == "form":
            self.forms.append({
                "action": attr_dict.get("action", ""),
                "method": attr_dict.get("method", ""),
                "id": attr_dict.get("id", ""),
                "data_ajax": attr_dict.get("data-ajax", ""),
                "data_ajax_success": attr_dict.get("data-ajax-success", ""),
                "data_ajax_complete": attr_dict.get("data-ajax-complete", ""),
                "all_attrs": attr_dict,
            })

        elif tag_lower == "select":
            self._in_select = True
            self._current_select = {
                "id": attr_dict.get("id", ""),
                "name": attr_dict.get("name", ""),
                "class": attr_dict.get("class", ""),
                "multiple": "multiple" in attr_dict,
                "tabindex": attr_dict.get("tabindex", ""),
                "data_attrs": {k: v for k, v in attrs if k.startswith("data-")},
                "options": [],
            }

        elif tag_lower == "option" and self._in_select:
            self._in_option = True
            self._current_option = {
                "value": attr_dict.get("value", ""),
                "selected": "selected" in attr_dict,
            }
            self._option_text = ""

        elif tag_lower == "input":
            input_type = attr_dict.get("type", "text").lower()
            common = {
                "id": attr_dict.get("id", ""),
                "name": attr_dict.get("name", ""),
                "value": attr_dict.get("value", ""),
                "class": attr_dict.get("class", ""),
                "tabindex": attr_dict.get("tabindex", ""),
                "data_attrs": {k: v for k, v in attrs if k.startswith("data-")},
            }

            if input_type == "hidden":
                self.hiddens.append(common)
            elif input_type == "radio":
                common["checked"] = "checked" in attr_dict
                common["onclick"] = attr_dict.get("onclick", "")
                self.radios.append(common)
            elif input_type == "checkbox":
                common["checked"] = "checked" in attr_dict
                common["onclick"] = attr_dict.get("onclick", "")
                self.checkboxes.append(common)
            elif input_type in ("text", "email", "tel", "number", "date", "search", "url", "password"):
                common["type"] = input_type
                common["placeholder"] = attr_dict.get("placeholder", "")
                self.text_inputs.append(common)

        elif tag_lower == "textarea":
            self._in_textarea = True
            self._textarea_attrs = attr_dict
            self._textarea_content = ""

        elif tag_lower == "script":
            src = attr_dict.get("src", "")
            if not src:
                self._in_script = True
                self._script_content = ""
                self._script_attrs = attr_dict
            # else external script, skip

    def handle_endtag(self, tag):
        tag_lower = tag.lower()

        if tag_lower == "select" and self._in_select:
            self._in_select = False
            if self._current_select:
                self.selects.append(self._current_select)
                self._current_select = None

        elif tag_lower == "option" and self._in_option:
            self._in_option = False
            if self._current_option is not None:
                self._current_option["text"] = self._option_text.strip()
                if self._current_select:
                    self._current_select["options"].append(self._current_option)
                self._current_option = None

        elif tag_lower == "script" and self._in_script:
            self._in_script = False
            content = self._script_content.strip()
            if content:
                self.inline_scripts.append(content)
            self._script_content = ""

        elif tag_lower == "textarea" and self._in_textarea:
            self._in_textarea = False
            self.textareas.append({
                "id": self._textarea_attrs.get("id", ""),
                "name": self._textarea_attrs.get("name", ""),
                "content": self._textarea_content.strip(),
            })

    def handle_data(self, data):
        if self._in_option:
            self._option_text += data
        if self._in_script:
            self._script_content += data
        if self._in_textarea:
            self._textarea_content += data


def extract_js_vars(scripts):
    """Extract variable assignments from inline scripts."""
    var_pattern = re.compile(
        r"""(?:var|let|const)\s+(\w+)\s*=\s*(['"].*?['"]|true|false|null|\d+[\d.]*|'[^']*'|"[^"]*"|\{[^}]*\}|\[[^\]]*\])""",
        re.DOTALL
    )
    results = []
    for script in scripts:
        for match in var_pattern.finditer(script):
            name = match.group(1)
            raw_value = match.group(2).strip()
            try:
                value = json.loads(raw_value)
            except (json.JSONDecodeError, ValueError):
                value = raw_value.strip("'\"")
            results.append({"name": name, "value": value, "raw": raw_value})
    return results


def extract_js_urls(scripts):
    """Extract URL strings from inline scripts (AJAX calls, redirects, etc.)."""
    url_pattern = re.compile(r"""['"](/[A-Za-z][A-Za-z0-9_/?.=&]+)['"]""")
    urls = set()
    for script in scripts:
        for match in url_pattern.finditer(script):
            urls.add(match.group(1))
    return sorted(urls)


def extract_js_ajax_calls(scripts):
    """Extract $.ajax call patterns."""
    ajax_pattern = re.compile(r"""\$\.ajax\s*\(\s*\{(.*?)\}\s*\)""", re.DOTALL)
    url_in_ajax = re.compile(r"""url\s*:\s*['"]([^'"]+)['"]""")
    type_in_ajax = re.compile(r"""type\s*:\s*['"]([^'"]+)['"]""")
    results = []
    for script in scripts:
        for match in ajax_pattern.finditer(script):
            block = match.group(1)
            url_match = url_in_ajax.search(block)
            type_match = type_in_ajax.search(block)
            if url_match:
                results.append({
                    "url": url_match.group(1),
                    "method": type_match.group(1) if type_match else "GET",
                })
    return results


def extract_js_json_objects(scripts):
    """Extract inline JSON-like object/array literals assigned to variables."""
    pattern = re.compile(
        r"""(?:var|let|const)\s+(\w+)\s*=\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*;""",
        re.MULTILINE
    )
    results = []
    for script in scripts:
        for m in pattern.finditer(script):
            name = m.group(1)
            raw = m.group(2)
            try:
                parsed = json.loads(raw)
                results.append({"name": name, "value": parsed})
            except (json.JSONDecodeError, ValueError):
                results.append({"name": name, "raw": raw[:500]})
    return results


def extract_function_names(scripts):
    """Extract function definitions from scripts."""
    pattern = re.compile(r"""function\s+(\w+)\s*\(""")
    funcs = set()
    for script in scripts:
        for m in pattern.finditer(script):
            funcs.add(m.group(1))
    return sorted(funcs)


def parse_file(filepath):
    """Parse a single HTML file and return all extracted data."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        html = f.read()

    parser = WizardHTMLParser()
    parser.feed(html)

    js_vars = extract_js_vars(parser.inline_scripts)
    js_urls = extract_js_urls(parser.inline_scripts)
    js_ajax = extract_js_ajax_calls(parser.inline_scripts)
    js_json = extract_js_json_objects(parser.inline_scripts)
    js_funcs = extract_function_names(parser.inline_scripts)

    return {
        "file_size_bytes": os.path.getsize(filepath),
        "selects": parser.selects,
        "hidden_inputs": parser.hiddens,
        "radio_buttons": parser.radios,
        "checkboxes": parser.checkboxes,
        "text_inputs": parser.text_inputs,
        "textareas": parser.textareas,
        "forms": parser.forms,
        "data_attributes": parser.data_attrs,
        "inline_js": {
            "variable_assignments": js_vars,
            "urls_referenced": js_urls,
            "ajax_calls": js_ajax,
            "json_objects": js_json,
            "function_definitions": js_funcs,
            "raw_script_count": len(parser.inline_scripts),
        },
        "counts": {
            "selects": len(parser.selects),
            "hidden_inputs": len(parser.hiddens),
            "radio_buttons": len(parser.radios),
            "checkboxes": len(parser.checkboxes),
            "text_inputs": len(parser.text_inputs),
            "textareas": len(parser.textareas),
            "forms": len(parser.forms),
            "elements_with_data_attrs": len(parser.data_attrs),
            "inline_scripts": len(parser.inline_scripts),
            "js_variables": len(js_vars),
            "js_functions": len(js_funcs),
        },
    }


def compute_differences(all_data):
    """Compare across all files to find differences."""
    diffs = {
        "select_ids": {},
        "select_option_counts": {},
        "hidden_input_names": {},
        "text_input_names": {},
        "form_actions": {},
        "js_variable_names": {},
        "unique_per_file": {},
    }

    # Gather per-file sets
    file_select_ids = {}
    file_select_options = {}
    file_hidden_names = {}
    file_text_names = {}
    file_form_actions = {}
    file_js_vars = {}

    for name, data in all_data.items():
        file_select_ids[name] = set()
        file_select_options[name] = {}
        for s in data["selects"]:
            sid = s["id"] or s["name"]
            file_select_ids[name].add(sid)
            file_select_options[name][sid] = len(s["options"])

        file_hidden_names[name] = {h["name"] or h["id"] for h in data["hidden_inputs"]}
        file_text_names[name] = {t["name"] or t["id"] for t in data["text_inputs"]}
        file_form_actions[name] = {f["action"] for f in data["forms"]}
        file_js_vars[name] = {v["name"] for v in data["inline_js"]["variable_assignments"]}

    # All selects across all files
    all_select_ids = set()
    for s in file_select_ids.values():
        all_select_ids.update(s)

    # Per-select: which files have it, and option counts
    for sid in sorted(all_select_ids):
        present_in = {name for name, ids in file_select_ids.items() if sid in ids}
        diffs["select_ids"][sid] = {
            "present_in": sorted(present_in),
            "missing_from": sorted(set(all_data.keys()) - present_in),
        }
        opts = {}
        for name in present_in:
            opts[name] = file_select_options[name].get(sid, 0)
        diffs["select_option_counts"][sid] = opts

    # Hidden inputs comparison
    all_hidden = set()
    for h in file_hidden_names.values():
        all_hidden.update(h)
    for hname in sorted(all_hidden):
        present_in = {name for name, hids in file_hidden_names.items() if hname in hids}
        if len(present_in) < len(all_data):
            diffs["hidden_input_names"][hname] = {
                "present_in": sorted(present_in),
                "missing_from": sorted(set(all_data.keys()) - present_in),
            }

    # Text inputs comparison
    all_text = set()
    for t in file_text_names.values():
        all_text.update(t)
    for tname in sorted(all_text):
        present_in = {name for name, tids in file_text_names.items() if tname in tids}
        if len(present_in) < len(all_data):
            diffs["text_input_names"][tname] = {
                "present_in": sorted(present_in),
                "missing_from": sorted(set(all_data.keys()) - present_in),
            }

    # JS vars comparison
    all_vars = set()
    for v in file_js_vars.values():
        all_vars.update(v)
    for vname in sorted(all_vars):
        present_in = {name for name, vids in file_js_vars.items() if vname in vids}
        if len(present_in) < len(all_data):
            diffs["js_variable_names"][vname] = {
                "present_in": sorted(present_in),
                "missing_from": sorted(set(all_data.keys()) - present_in),
            }

    # Unique elements per file
    for name in all_data:
        unique_selects = file_select_ids[name] - set().union(*(
            file_select_ids[n] for n in file_select_ids if n != name
        ))
        unique_hiddens = file_hidden_names[name] - set().union(*(
            file_hidden_names[n] for n in file_hidden_names if n != name
        ))
        unique_text = file_text_names[name] - set().union(*(
            file_text_names[n] for n in file_text_names if n != name
        ))
        if unique_selects or unique_hiddens or unique_text:
            diffs["unique_per_file"][name] = {
                "unique_selects": sorted(unique_selects),
                "unique_hidden_inputs": sorted(unique_hiddens),
                "unique_text_inputs": sorted(unique_text),
            }

    # Product combination options comparison
    pc_options = {}
    for name, data in all_data.items():
        for s in data["selects"]:
            if s["id"] == "ddProductCombination" or s["name"] == "SelectedProductCombinationID":
                pc_options[name] = {opt["value"]: opt["text"] for opt in s["options"]}
                break

    if len(pc_options) > 1:
        all_pc_values = set()
        for opts in pc_options.values():
            all_pc_values.update(opts.keys())

        pc_diff = {}
        for val in sorted(all_pc_values, key=lambda x: int(x) if x.isdigit() else 0):
            present_in = {name for name, opts in pc_options.items() if val in opts}
            text = next((opts[val] for opts in pc_options.values() if val in opts), "")
            if len(present_in) < len(pc_options):
                pc_diff[val] = {
                    "text": text,
                    "present_in": sorted(present_in),
                    "missing_from": sorted(set(pc_options.keys()) - present_in),
                }
        diffs["product_combination_differences"] = pc_diff

    # Order status options comparison
    status_options = {}
    for name, data in all_data.items():
        for s in data["selects"]:
            if s["id"] == "orderstatuses":
                status_options[name] = {opt["value"]: opt["text"] for opt in s["options"]}
                break

    if len(status_options) > 1:
        all_status_values = set()
        for opts in status_options.values():
            all_status_values.update(opts.keys())

        status_diff = {}
        for val in sorted(all_status_values):
            present_in = {name for name, opts in status_options.items() if val in opts}
            text = next((opts[val] for opts in status_options.values() if val in opts), "")
            if len(present_in) < len(status_options):
                status_diff[val] = {
                    "text": text,
                    "present_in": sorted(present_in),
                    "missing_from": sorted(set(status_options.keys()) - present_in),
                }
        diffs["order_status_differences"] = status_diff

    return diffs


def main():
    all_data = {}
    summary = {}

    for name, filepath in FILES.items():
        if not os.path.exists(filepath):
            print(f"SKIP (not found): {filepath}")
            continue

        print(f"Parsing: {name} ({filepath})")
        data = parse_file(filepath)
        all_data[name] = data

        # Build summary
        s = {
            "file_size_bytes": data["file_size_bytes"],
            "counts": data["counts"],
            "select_summary": [],
            "hidden_inputs_summary": [],
            "form_actions": [f["action"] for f in data["forms"]],
            "js_variable_summary": [],
        }

        for sel in data["selects"]:
            s["select_summary"].append({
                "id": sel["id"],
                "name": sel["name"],
                "option_count": len(sel["options"]),
                "multiple": sel["multiple"],
                "sample_options": [{"value": o["value"], "text": o["text"]} for o in sel["options"][:5]],
            })

        for h in data["hidden_inputs"]:
            if h["value"]:
                s["hidden_inputs_summary"].append({
                    "id": h["id"],
                    "name": h["name"],
                    "value": h["value"],
                })

        for v in data["inline_js"]["variable_assignments"]:
            s["js_variable_summary"].append({
                "name": v["name"],
                "value": v["value"] if len(str(v["value"])) < 200 else str(v["value"])[:200] + "...",
            })

        summary[name] = s

    # Compute differences
    differences = compute_differences(all_data)

    output = {
        "metadata": {
            "description": "Deep parse of GoCreate wizard HTML files",
            "files_parsed": len(all_data),
            "file_names": list(all_data.keys()),
        },
        "summary": summary,
        "differences": differences,
        "full_extraction": all_data,
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"\nOutput saved to: {OUTPUT}")
    print(f"Output size: {os.path.getsize(OUTPUT):,} bytes")

    # Print summary
    print("\n" + "=" * 80)
    print("EXTRACTION SUMMARY")
    print("=" * 80)

    for name, s in summary.items():
        print(f"\n--- {name} ---")
        print(f"  File size: {s['file_size_bytes']:,} bytes")
        c = s["counts"]
        print(f"  Selects: {c['selects']}, Hidden inputs: {c['hidden_inputs']}, "
              f"Radios: {c['radio_buttons']}, Checkboxes: {c['checkboxes']}, "
              f"Text inputs: {c['text_inputs']}")
        print(f"  Forms: {c['forms']}, Data-attr elements: {c['elements_with_data_attrs']}, "
              f"Inline scripts: {c['inline_scripts']}")
        print(f"  JS variables: {c['js_variables']}, JS functions: {c['js_functions']}")

        if s["select_summary"]:
            print(f"  Key selects:")
            for sel in s["select_summary"]:
                print(f"    #{sel['id']} (name={sel['name']}): {sel['option_count']} options"
                      + (" [multiple]" if sel['multiple'] else ""))

        if s["hidden_inputs_summary"]:
            print(f"  Hidden inputs with values:")
            for h in s["hidden_inputs_summary"][:10]:
                print(f"    {h['name'] or h['id']}: {h['value']}")

        if s["js_variable_summary"]:
            print(f"  JS variables:")
            for v in s["js_variable_summary"]:
                print(f"    {v['name']} = {v['value']}")

        if s["form_actions"]:
            print(f"  Form actions: {s['form_actions']}")

    print("\n" + "=" * 80)
    print("DIFFERENCES BETWEEN FILES")
    print("=" * 80)

    if differences.get("product_combination_differences"):
        print("\nProduct Combination option differences:")
        for val, info in differences["product_combination_differences"].items():
            print(f"  value={val} ({info['text']}): "
                  f"present in {info['present_in']}, missing from {info['missing_from']}")

    if differences.get("order_status_differences"):
        print("\nOrder Status option differences:")
        for val, info in differences["order_status_differences"].items():
            print(f"  value={val} ({info['text']}): "
                  f"present in {info['present_in']}, missing from {info['missing_from']}")

    if differences.get("unique_per_file"):
        print("\nUnique elements per file:")
        for name, info in differences["unique_per_file"].items():
            print(f"  {name}:")
            if info["unique_selects"]:
                print(f"    Unique selects: {info['unique_selects']}")
            if info["unique_hidden_inputs"]:
                print(f"    Unique hiddens: {info['unique_hidden_inputs']}")
            if info["unique_text_inputs"]:
                print(f"    Unique text inputs: {info['unique_text_inputs']}")

    # Show select IDs present in some but not all
    partially_present = {
        sid: info for sid, info in differences["select_ids"].items()
        if info["missing_from"]
    }
    if partially_present:
        print("\nSelect IDs not in all files:")
        for sid, info in partially_present.items():
            print(f"  #{sid}: missing from {info['missing_from']}")


if __name__ == "__main__":
    main()
