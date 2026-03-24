#!/bin/bash
COOKIE="ASP.NET_SessionId=kef4nm3qyjz2oif030vvvoek; MunroShopSitesFormAuthentication=734894C36A165619745FBA8249BEC8F8601C989B8BFE514FAFBAFAF914474D043DE79F959E40978978B9610DDEEAA5A4ADFB4E1667CDD4FAA6A7256C1865AECAC6AC667877E9B026A476F39F3998FBFE690EDADF7F918211A5AEBFCC565E1FAAF4EFC7F9862F96F539A2867DE423BF950C39EBA2"
BASE="https://gocreate.nu"
DIR="/Users/lucien/poopy doopy fabric dookie/data/gocreate-web"

probe_get() {
  local path="$1"
  local label="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE" "${BASE}${path}" 2>/dev/null)
  echo "  ${code} GET ${path} [${label}]"
  if [ "$code" = "200" ]; then
    local fname
    fname=$(echo "$path" | tr '/' '_' | sed 's/^_//')
    curl -s -b "$COOKIE" "${BASE}${path}" > "${DIR}/${fname}.html" 2>/dev/null
    local size
    size=$(wc -c < "${DIR}/${fname}.html" | tr -d ' ')
    echo "    → saved ${size} bytes"
  fi
}

probe_post() {
  local path="$1"
  local label="$2"
  local postdata="${3:-}"
  local resp code body blen
  resp=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "$postdata" \
    "${BASE}${path}" 2>/dev/null)
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')
  blen=${#body}
  echo "  ${code} [${blen}b] POST ${path} [${label}]"
  if [ "$code" = "200" ] && [ "$blen" -gt 20 ]; then
    local fname
    fname=$(echo "${path}_POST" | tr '/' '_' | sed 's/^_//')
    echo "$body" > "${DIR}/${fname}.txt"
    echo "    → saved ${blen} bytes"
    echo "    → preview: $(echo "$body" | head -c 200)"
  fi
}

echo "============================================"
echo "PART 1: GET routes for order creation pages"
echo "============================================"

probe_get "/CustomOrder/Create" "order creation page"
probe_get "/CustomOrder/New" "new order"
probe_get "/CustomOrder/Index" "custom order index"
probe_get "/DyoOrder/EditDyoOrder" "DYO order edit"
probe_get "/ShoeOrder/EditShoeOrder" "shoe order edit"
probe_get "/TieOrder/EditTieOrder" "tie order edit"
probe_get "/VestOrder/EditVestOrder" "vest order edit"
probe_get "/KnitOrder/CopyCustomMadeOrder" "knit order"
probe_get "/DenimOrder/CopyCustomMadeOrder" "denim order"
probe_get "/ReadymadeOrderOverview/Index" "readymade overview"
probe_get "/CustomOrderOverview/Index" "custom order overview"

echo ""
echo "============================================"
echo "PART 2: POST AJAX routes for data"
echo "============================================"

probe_post "/CustomOrder/GetNewGuid" "get new GUID"
probe_post "/CustomOrderOverview/GetOrderBodyMeasurement" "body measurements"
probe_post "/OrderDetail/GetOrderDetail" "order detail"
probe_post "/Customer/GetCustomerDetail" "customer detail"
probe_post "/CustomOrderOverview/GetCargoBoxList" "cargo boxes"
probe_post "/Login/CheckIfSessionIsExpired" "session check"

echo ""
echo "============================================"
echo "PART 3: Try order creation with known order number"
echo "============================================"

probe_post "/OrderDetail/GetOrderDetail" "order detail with number" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/OrderDetail/GetDuplicateOrder" "duplicate order" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/OrderDetail/GetRemarkForOrder" "order remarks" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/OrderDetail/GetOrderPriceDetail" "price detail" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/CustomOrder/CopyOrder" "copy order" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/CustomOrder/CreateOrderForSameCustomer" "create for same customer" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/CustomOrderOverview/GetOrderBodyMeasurement" "body measurement for order" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/OrderDetail/GetEditOrderWarning2" "edit warning" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/CustomOrderOverview/ValidateOrderFitProfile" "validate fit" "orderNumber=ANTHO.BIL.GB.2371641"
probe_post "/CustomOrder/GetEditOrderDialog" "edit dialog" "orderNumber=ANTHO.BIL.GB.2371641"

echo ""
echo "DONE"
