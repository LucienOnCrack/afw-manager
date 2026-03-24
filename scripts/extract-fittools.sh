#!/bin/bash
# Extract FitTools for all 29 product parts from GoCreate
# Uses curl with hard 5s timeout per request

COOKIE="ASP.NET_SessionId=kef4nm3qyjz2oif030vvvoek; MunroShopSitesFormAuthentication=734894C36A165619745FBA8249BEC8F8601C989B8BFE514FAFBAFAF914474D043DE79F959E40978978B9610DDEEAA5A4ADFB4E1667CDD4FAA6A7256C1865AECAC6AC667877E9B026A476F39F3998FBFE690EDADF7F918211A5AEBFCC565E1FAAF4EFC7F9862F96F539A2867DE423BF950C39EBA2"
BASE="https://gocreate.nu"
OUTDIR="/Users/lucien/poopy doopy fabric dookie/data/gocreate-web/fittools"
mkdir -p "$OUTDIR"

PARTS=(1 2 3 4 5 12 13 14 15 16 18 20 21 22 23 24 25 26 27 31 32 33 34 35 36 37 38 40 41)
NAMES=("Jacket" "Trousers" "Waistcoat" "Shirt" "Overcoat" "Bermuda" "Pea_coat" "5_Pocket" "Chino" "Formal_round" "Informal" "Flex" "Sneaker" "Tie" "Bow_tie" "Pocket_square" "Belt" "Coat" "Detachable_liner" "Informal_jacket" "Knitwear" "City_loafer" "Beanie" "Scarf" "Quilted_vest" "Cummerbund" "Vest" "Pants" "Runner")
FITS=(38 41 39 1 40 42)

TOTAL=${#PARTS[@]}
COUNT=0

echo ""
echo "============================================"
echo "  FIT TOOLS EXTRACTION - $TOTAL parts"
echo "============================================"
echo ""

for i in "${!PARTS[@]}"; do
    pid="${PARTS[$i]}"
    pname="${NAMES[$i]}"
    COUNT=$((COUNT + 1))
    
    FOUND=0
    for fid in "${FITS[@]}"; do
        RESP=$(curl -s --max-time 5 --connect-timeout 3 \
            -w "\n%{http_code}" \
            -X POST \
            -b "$COOKIE" \
            -H "X-Requested-With: XMLHttpRequest" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "SelectedProductPartID=${pid}&SelectedProductFitID=${fid}" \
            "${BASE}/ShopSettings/GetFitTools" 2>/dev/null)
        
        CODE=$(echo "$RESP" | tail -1)
        BODY=$(echo "$RESP" | sed '$d')
        BLEN=${#BODY}
        
        if [ "$CODE" = "200" ] && [ "$BLEN" -gt 300 ]; then
            echo "$BODY" > "$OUTDIR/part${pid}_${pname}_fit${fid}.html"
            LABELS=$(echo "$BODY" | grep -oP '(?<=<label[^>]*>)[^<]+(?=</label>)' | grep -v -E '^(FitTools|Is visible|Do not show|#)$' | wc -l | tr -d ' ')
            echo "  [$COUNT/$TOTAL] $pname (fit=$fid): ${LABELS} fit tools -> saved"
            FOUND=1
            break
        fi
    done
    
    if [ "$FOUND" = "0" ]; then
        echo "  [$COUNT/$TOTAL] $pname: (no fit tools found)"
    fi
done

echo ""
echo "============================================"
echo "  DONE! Files saved to: $OUTDIR"
echo "  Total files: $(ls "$OUTDIR"/*.html 2>/dev/null | wc -l | tr -d ' ')"
echo "============================================"
