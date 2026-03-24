#!/usr/bin/env python3
import urllib.request
import os
import json

COOKIE = "ASP.NET_SessionId=kef4nm3qyjz2oif030vvvoek; MunroShopSitesFormAuthentication=734894C36A165619745FBA8249BEC8F8601C989B8BFE514FAFBAFAF914474D043DE79F959E40978978B9610DDEEAA5A4ADFB4E1667CDD4FAA6A7256C1865AECAC6AC667877E9B026A476F39F3998FBFE690EDADF7F918211A5AEBFCC565E1FAAF4EFC7F9862F96F539A2867DE423BF950C39EBA2"
BASE = "https://gocreate.nu"
DIR = "/Users/lucien/poopy doopy fabric dookie/data/gocreate-web"
os.makedirs(DIR, exist_ok=True)

results = {}

def do_request(method, path, label, data=None):
    url = BASE + path
    headers = {"Cookie": COOKIE}
    body = None
    if method == "POST":
        headers["X-Requested-With"] = "XMLHttpRequest"
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        body = (data or "").encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            code = resp.status
            content = resp.read()
            ct = resp.headers.get("Content-Type", "")
            text = content.decode("utf-8", errors="replace")
            blen = len(text)
            print(f"  {code} [{blen:>7}b] {method} {path} [{label}]")

            fname = path.replace("/", "_").lstrip("_")
            if method == "POST":
                fname += "_POST"

            is_json = False
            parsed = None
            try:
                parsed = json.loads(text)
                is_json = True
            except:
                pass

            if is_json:
                with open(os.path.join(DIR, fname + ".json"), "w") as f:
                    json.dump(parsed, f, indent=2)
                print(f"    -> JSON saved. ", end="")
                if isinstance(parsed, list):
                    print(f"{len(parsed)} items")
                    if parsed and isinstance(parsed[0], dict):
                        print(f"    -> First item keys: {list(parsed[0].keys())[:10]}")
                elif isinstance(parsed, dict):
                    print(f"Keys: {list(parsed.keys())[:10]}")
                else:
                    print(f"Type: {type(parsed).__name__}")
            elif blen > 100:
                with open(os.path.join(DIR, fname + ".html"), "w") as f:
                    f.write(text)
                if "<html" in text.lower()[:500]:
                    title = ""
                    import re
                    m = re.search(r"<title>(.*?)</title>", text, re.I)
                    if m:
                        title = m.group(1).strip()
                    print(f"    -> HTML saved. Title: {title}")
                else:
                    print(f"    -> Text saved. Preview: {text[:150].strip()}")

            results[f"{method}:{path}"] = {
                "status": code,
                "contentType": ct,
                "size": blen,
                "isJson": is_json,
                "label": label,
            }
            return text, code

    except urllib.error.HTTPError as e:
        print(f"  {e.code} [{0:>7}b] {method} {path} [{label}]")
        results[f"{method}:{path}"] = {"status": e.code, "label": label, "error": str(e)}
        return None, e.code
    except Exception as e:
        print(f"  ERR [{0:>7}b] {method} {path} [{label}] {e}")
        results[f"{method}:{path}"] = {"status": 0, "label": label, "error": str(e)}
        return None, 0


print("=" * 60)
print("PART 1: Order creation pages (GET)")
print("=" * 60)

for path, label in [
    ("/CustomOrder/Create", "order creation page"),
    ("/CustomOrder/New", "new order"),
    ("/CustomOrder/Index", "custom order index"),
    ("/DyoOrder/EditDyoOrder", "DYO order edit"),
    ("/ShoeOrder/EditShoeOrder", "shoe order edit"),
    ("/TieOrder/EditTieOrder", "tie order edit"),
    ("/VestOrder/EditVestOrder", "vest order edit"),
    ("/ReadymadeOrderOverview/Index", "readymade overview"),
    ("/CustomOrderOverview/Index", "custom order overview"),
]:
    do_request("GET", path, label)

print()
print("=" * 60)
print("PART 2: AJAX data endpoints (POST)")
print("=" * 60)

for path, label, data in [
    ("/CustomOrder/GetNewGuid", "get GUID", ""),
    ("/Login/CheckIfSessionIsExpired", "session check", ""),
    ("/CustomOrderOverview/GetCargoBoxList", "cargo boxes", ""),
    ("/ReadymadeOrderOverview/HasShopMultipleProductLine", "multi product line", ""),
    ("/ReadymadeOrderOverview/LoadReadyMadeOrderCreationPerShop", "readymade per shop", ""),
]:
    do_request("POST", path, label, data)

print()
print("=" * 60)
print("PART 3: Order detail endpoints with real order number")
print("=" * 60)

ORDER = "ANTHO.BIL.GB.2371641"
for path, label, data in [
    ("/OrderDetail/GetOrderDetail", "order detail", f"orderNumber={ORDER}"),
    ("/OrderDetail/GetDuplicateOrder", "duplicate check", f"orderNumber={ORDER}"),
    ("/OrderDetail/GetRemarkForOrder", "remarks", f"orderNumber={ORDER}"),
    ("/OrderDetail/GetOrderPriceDetail", "price detail", f"orderNumber={ORDER}"),
    ("/CustomOrder/CopyOrder", "copy order page", f"orderNumber={ORDER}"),
    ("/CustomOrder/CreateOrderForSameCustomer", "same customer page", f"orderNumber={ORDER}"),
    ("/CustomOrderOverview/GetOrderBodyMeasurement", "body measurements", f"orderNumber={ORDER}"),
    ("/OrderDetail/GetEditOrderWarning2", "edit warning", f"orderNumber={ORDER}"),
    ("/CustomOrder/GetEditOrderDialog", "edit dialog", f"orderNumber={ORDER}"),
]:
    do_request("POST", path, label, data)

print()
print("=" * 60)
print("PART 4: Try CopyOrder GET (loads full order creation form)")
print("=" * 60)

for path, label in [
    (f"/CustomOrder/CopyOrder?orderNumber={ORDER}", "copy order GET"),
    (f"/CustomOrder/CreateOrderForSameCustomer?orderNumber={ORDER}", "same customer GET"),
    (f"/CustomOrder/GetEditOrderDialog?orderNumber={ORDER}", "edit dialog GET"),
]:
    do_request("GET", path, label)

# Save summary
with open(os.path.join(DIR, "_probe_results.json"), "w") as f:
    json.dump(results, f, indent=2)

print()
print("=" * 60)
print(f"DONE. {len(results)} routes probed.")
success = [k for k, v in results.items() if v.get("status") == 200]
print(f"Successful (200): {len(success)}")
for s in success:
    print(f"  {s}")
print("=" * 60)
