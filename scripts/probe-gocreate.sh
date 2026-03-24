#!/bin/bash
CREDS='{"UserName":"ANTHO_API","Password":"3364f04c99e7abc03bd04eb521f4f6da","AuthenticationToken":"EAAAAHo4+kCbKYt1wfaLa/hqobii9OGMfboFIRcTcwFWy7zk"}'

echo "============================================"
echo "PART 1: API endpoint enumeration (api.gocreate.nu)"
echo "============================================"

api_probe() {
  local path="$1"
  local body="${2:-$CREDS}"
  local resp
  resp=$(curl -s -w "\n%{http_code}" -X POST "https://api.gocreate.nu${path}" \
    -H "Content-Type: application/json" \
    -d "$body" 2>/dev/null)
  local code
  code=$(echo "$resp" | tail -1)
  local rbody
  rbody=$(echo "$resp" | sed '$d')
  local blen=${#rbody}
  if [ "$code" != "404" ]; then
    echo "  ${code} [${blen}b] POST ${path}"
    if [ "$blen" -gt 10 ]; then
      echo "    $(echo "$rbody" | head -c 300)"
      echo ""
    fi
  fi
}

api_probe "/Order/GetDesignOptions"
api_probe "/Order/DesignOptions"
api_probe "/Order/GetOptions"
api_probe "/Order/GetItemTypes"
api_probe "/Order/ItemTypes"
api_probe "/Order/GetMakes"
api_probe "/Order/GetModels"
api_probe "/Order/GetFitProfiles"
api_probe "/Order/FitProfiles"
api_probe "/Order/Configuration"
api_probe "/Order/GetConfiguration"
api_probe "/Order/Catalog"
api_probe "/Product/GetAll"
api_probe "/Product/List"
api_probe "/DesignOption/GetAll"
api_probe "/DesignOption/GetByProductPart"
api_probe "/FitProfile/GetAll"
api_probe "/FitTool/GetAll"
api_probe "/Make/GetAll"
api_probe "/Model/GetAll"
api_probe "/Button/GetAll"
api_probe "/Button/List"
api_probe "/Button/Post"
api_probe "/Trim/GetAll"
api_probe "/Trim/Post"
api_probe "/Lining/GetAll"
api_probe "/Monogram/GetAll"
api_probe "/Branding/GetAll"
api_probe "/Configuration/GetAll"

echo ""
echo "============================================"
echo "PART 2: GoCreate web MVC routes (gocreate.nu)"
echo "============================================"

web_probe() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://gocreate.nu${path}" 2>/dev/null)
  if [ "$code" != "404" ] && [ "$code" != "000" ]; then
    echo "  ${code} GET ${path}"
  fi
}

web_probe "/Order/Create"
web_probe "/Order/New"
web_probe "/Order/Index"
web_probe "/Order/Overview"
web_probe "/Order/GetDesignOptions"
web_probe "/Order/GetProductParts"
web_probe "/Order/GetMakes"
web_probe "/Order/GetModels"
web_probe "/Order/GetFitProfiles"
web_probe "/Order/GetFitTools"
web_probe "/Order/GetButtons"
web_probe "/Order/GetLinings"
web_probe "/Order/GetTrims"
web_probe "/Order/GetItemCombinations"
web_probe "/Order/GetBrandingOptions"
web_probe "/Order/GetMonogramOptions"
web_probe "/ReadymadeOrderOverview/Index"
web_probe "/ReadymadeOrderOverview/HasShopMultipleProductLine"
web_probe "/ReadymadeOrderOverview/LoadReadyMadeOrderCreationPerShop"
web_probe "/DesignOption/GetAll"
web_probe "/DesignOption/GetByProductPart"
web_probe "/Product/GetParts"
web_probe "/Fabric/Search"
web_probe "/Fabric/Index"
web_probe "/Lining/Search"
web_probe "/Lining/Index"
web_probe "/Customer/Index"
web_probe "/Customer/Overview"
web_probe "/Analytics/Index"
web_probe "/Dashboard/Index"
web_probe "/Home/Index"
web_probe "/Settings/Index"

echo ""
echo "============================================"
echo "PART 3: Fetching ALL JS files from web app"
echo "============================================"

echo "--- Searching all CSS/JS references from login page ---"
curl -s "https://gocreate.nu/Login/Login" 2>/dev/null | grep -oiE 'src="[^"]*\.js[^"]*"' | sed 's/src="//;s/"//' | while read -r jsurl; do
  if [[ "$jsurl" == /* ]]; then
    fullurl="https://gocreate.nu${jsurl}"
  else
    fullurl="https://gocreate.nu/${jsurl}"
  fi
  size=$(curl -s "$fullurl" 2>/dev/null | wc -c | tr -d ' ')
  echo "  ${size}b ${jsurl}"
done

echo ""
echo "--- Searching cross_browsers.js for routes ---"
curl -s "https://gocreate.nu/Scripts/cross_browsers.js?version=20260311" 2>/dev/null | grep -oiE '/[A-Z][a-zA-Z]+/[A-Z][a-zA-Z]+' | sort -u

echo ""
echo "--- Searching CookiesDetectionScripts.js for routes ---"
curl -s "https://gocreate.nu/Scripts/CustomScripts/CookiesDetectionScripts.js?version=20260311" 2>/dev/null | grep -oiE '/[A-Z][a-zA-Z]+/[A-Z][a-zA-Z]+' | sort -u

echo ""
echo "--- Searching CustomMessageboxes.js for routes ---"
curl -s "https://gocreate.nu/Scripts/CustomScripts/CustomMessageboxes.js?version=20260311" 2>/dev/null | grep -oiE '/[A-Z][a-zA-Z]+/[A-Z][a-zA-Z]+' | sort -u

echo ""
echo "DONE"
