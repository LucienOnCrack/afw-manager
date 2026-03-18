import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(__dirname, "../.env.local") });

const SEASON = "SS26";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key);
}

function parseEuro(s: string): number | null {
  s = s.trim();
  if (s === "n/a" || s === "-" || s === "­" || s === "") return null;
  s = s.replace(/^€\s*/, "").trim();
  if (!s) return null;
  // European format: "1.026" = 1026, "2,50" = 2.50, "45,10" = 45.10
  if (s.includes(",")) {
    // Has comma = decimal separator
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // "1.026" with dot = thousands separator (no decimal part)
    s = s.replace(/\./g, "");
  }
  // Handle negative (surcharges like "­2" or "- 2")
  s = s.replace(/­/g, "-");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

interface PriceRow {
  season: string;
  price_category: string;
  section: string;
  construction: string | null;
  make_type: string | null;
  garment_type: string;
  price_eur: number;
}

function extractPricesFromLine(line: string): number[] {
  const matches = [...line.matchAll(/€\s*[\d.,­-]+/g)];
  return matches
    .map((m) => parseEuro(m[0]))
    .filter((v): v is number => v !== null);
}

function extractCategoryAndPrices(
  line: string
): { category: string; prices: (number | null)[] } | null {
  // Match price category at start of line
  const catMatch = line.match(
    /^\s*((?:RM\s+)?PL\s+(?:PC|SALE\s+)\d+|CM\s+CL\d+|CML\s+CL\d+|Shoes\s*[-­]\s*PL\s+CM\s+PC\d+)/
  );
  if (!catMatch) return null;

  const category = catMatch[1].replace(/\s+/g, " ").trim();
  const rest = line.slice(catMatch.index! + catMatch[0].length);

  // Extract all euro values and n/a markers in order
  const tokens: (number | null)[] = [];
  const tokenPattern = /€\s*[\d.,­-]+|n\/a/g;
  let match;
  while ((match = tokenPattern.exec(rest)) !== null) {
    if (match[0] === "n/a") {
      tokens.push(null);
    } else {
      tokens.push(parseEuro(match[0]));
    }
  }

  return { category, prices: tokens };
}

function parseSuitTable(
  lines: string[],
  startLine: number,
  endLine: number,
  section: string,
  construction: string | null,
  makeType: string | null,
  garmentTypes: string[]
): PriceRow[] {
  const rows: PriceRow[] = [];
  for (let i = startLine; i <= endLine && i < lines.length; i++) {
    const parsed = extractCategoryAndPrices(lines[i]);
    if (!parsed) continue;
    for (let j = 0; j < parsed.prices.length && j < garmentTypes.length; j++) {
      if (parsed.prices[j] !== null) {
        rows.push({
          season: SEASON,
          price_category: parsed.category,
          section,
          construction,
          make_type: makeType,
          garment_type: garmentTypes[j],
          price_eur: parsed.prices[j]!,
        });
      }
    }
  }
  return rows;
}

function main() {
  const text = readFileSync(
    resolve(__dirname, "../SS26_UK_layout.txt"),
    "utf-8"
  );
  const lines = text.split("\n");
  const allRows: PriceRow[] = [];

  const SUIT_11_COLS = [
    "3-piece suit",
    "3-piece suit + extra trousers",
    "2-piece suit",
    "2-piece suit + extra trousers",
    "Jacket",
    "Trousers",
    "Waistcoat",
    "Quilted vest",
    "Vest",
    "Jacket + Bermudas",
    "Bermudas",
  ];

  const SUIT_7_COLS = [
    "3-piece suit",
    "3-piece suit + extra trousers",
    "2-piece suit",
    "2-piece suit + extra trousers",
    "Jacket",
    "Trousers",
    "Waistcoat",
  ];

  const CL_OTHER_8_COLS = [
    "Jacket + Bermudas",
    "Bermudas",
    "Vest",
    "Overcoat",
    "Pea coat",
    "Coat",
    "Coat + Detachable liner",
    "Shirt",
  ];

  const COAT_5_COLS = [
    "Overcoat",
    "Pea coat",
    "Coat",
    "Detachable liner",
    "Coat + Detachable liner",
  ];

  // 1. Suits / CustomMade - Half Canvas (lines ~67-96)
  allRows.push(
    ...parseSuitTable(lines, 60, 100, "Suits", "Half Canvas", "CustomMade", SUIT_11_COLS)
  );

  // 2. Suits / CustomMade - Full Canvas (lines ~112-141)
  allRows.push(
    ...parseSuitTable(lines, 105, 145, "Suits", "Full Canvas", "CustomMade", SUIT_11_COLS)
  );

  // 3. Suits / CustomMade - Handmade (lines ~157-186)
  allRows.push(
    ...parseSuitTable(lines, 150, 190, "Suits", "Handmade", "CustomMade", SUIT_11_COLS)
  );

  // 4. Suits / ReadyMade - Half Canvas (lines ~202-231)
  allRows.push(
    ...parseSuitTable(lines, 195, 235, "Suits", "Half Canvas", "ReadyMade", SUIT_11_COLS)
  );

  // 5. Suits / ReadyMade - Full Canvas (lines ~246-275)
  allRows.push(
    ...parseSuitTable(lines, 239, 280, "Suits", "Full Canvas", "ReadyMade", SUIT_11_COLS)
  );

  // 6. Suits / ReadyMade - Handmade (lines ~290-319)
  allRows.push(
    ...parseSuitTable(lines, 283, 325, "Suits", "Handmade", "ReadyMade", SUIT_11_COLS)
  );

  // 7. Suits / Made in Italy - Full Canvas (lines ~332-361)
  allRows.push(
    ...parseSuitTable(lines, 325, 365, "Suits", "Full Canvas", "Made in Italy", SUIT_7_COLS)
  );

  // 8. Suits / Made in Italy - CutLength (lines ~374-399)
  allRows.push(
    ...parseSuitTable(lines, 370, 405, "Suits", null, "Made in Italy", SUIT_7_COLS)
  );

  // 9. Shirts (lines ~470-516)
  for (let i = 462; i <= 520; i++) {
    const parsed = extractCategoryAndPrices(lines[i]);
    if (!parsed || parsed.prices.length === 0) continue;
    if (parsed.prices[0] !== null) {
      allRows.push({
        season: SEASON,
        price_category: parsed.category,
        section: "Shirts",
        construction: null,
        make_type: null,
        garment_type: "Shirt",
        price_eur: parsed.prices[0]!,
      });
    }
  }

  // 10. Coats (lines ~525-558)
  allRows.push(
    ...parseSuitTable(lines, 520, 560, "Coats", null, null, COAT_5_COLS)
  );

  // 11. Shoes - Italy Blake Light (lines ~598-601)
  const ITALY_BL_COLS = ["Formal round", "Formal point", "Informal"];
  allRows.push(
    ...parseSuitTable(lines, 596, 605, "Shoes", "Blake Light", "Italy", ITALY_BL_COLS)
  );

  // 12. Shoes - Italy Blake/Rapid/Ago (lines ~607-610)
  const ITALY_BR_COLS = ["Formal round", "Informal", "Flex", "City loafer", "Sneaker"];
  allRows.push(
    ...parseSuitTable(lines, 605, 615, "Shoes", "Blake/Rapid/Ago", "Italy", ITALY_BR_COLS)
  );

  // 13. Shoes - Italy Goodyear (lines ~616-620)
  allRows.push(
    ...parseSuitTable(lines, 614, 625, "Shoes", "Goodyear", "Italy", ITALY_BR_COLS)
  );

  // 14. Shoes - Portugal Blake (lines ~642-645)
  const PORT_COLS = ["Formal round", "City loafer", "Runner", "Sneaker"];
  for (let i = 640; i <= 650; i++) {
    const line = lines[i];
    if (!line) continue;
    const catMatch = line.match(/Shoes\s*[-­]\s*PL\s+CM\s+PC(\d+)/);
    if (!catMatch) continue;
    const prices = extractPricesFromLine(line);
    const cat = `PL PC${catMatch[1]}`;
    for (let j = 0; j < prices.length && j < PORT_COLS.length; j++) {
      allRows.push({
        season: SEASON,
        price_category: cat,
        section: "Shoes",
        construction: "Blake/Light/Ago",
        make_type: "Portugal",
        garment_type: PORT_COLS[j],
        price_eur: prices[j],
      });
    }
  }

  // 15. Shoes - Portugal Goodyear (lines ~651-654)
  for (let i = 649; i <= 658; i++) {
    const line = lines[i];
    if (!line) continue;
    const catMatch = line.match(/Shoes\s*[-­]\s*PL\s+CM\s+PC(\d+)/);
    if (!catMatch) continue;
    const prices = extractPricesFromLine(line);
    const cat = `PL PC${catMatch[1]}`;
    for (let j = 0; j < prices.length && j < PORT_COLS.length; j++) {
      allRows.push({
        season: SEASON,
        price_category: cat,
        section: "Shoes",
        construction: "Goodyear",
        make_type: "Portugal",
        garment_type: PORT_COLS[j],
        price_eur: prices[j],
      });
    }
  }

  // 16. Ties (lines ~678-679)
  const TIE_COLS = ["Tie tipped", "Tie 7-fold tipped", "Tie bobtail", "Tie untipped", "Tie 7-fold untipped"];
  allRows.push(
    ...parseSuitTable(lines, 675, 685, "Accessories", null, null, TIE_COLS)
  );

  // 17. Pocket squares (lines ~690-691)
  const PS_COLS = ["Pocket square hand stitched", "Pocket square hand rolled"];
  allRows.push(
    ...parseSuitTable(lines, 688, 695, "Accessories", null, null, PS_COLS)
  );

  // 18. Bow ties (lines ~699-700)
  const BT_COLS = ["Bow tie folded", "Bow tie unfolded", "Bow tie pre-folded"];
  allRows.push(
    ...parseSuitTable(lines, 697, 705, "Accessories", null, null, BT_COLS)
  );

  // 19. Cummerbund (line ~708)
  allRows.push(
    ...parseSuitTable(lines, 706, 712, "Accessories", null, null, ["Cummerbund pleated"])
  );

  // 20. Pants (lines ~718-740)
  const PANT_COLS = ["Jeans / 5 Pockets", "Chinos"];
  allRows.push(
    ...parseSuitTable(lines, 715, 745, "Pants", null, null, PANT_COLS)
  );

  // 21. Knitwear (lines ~771-810)
  const KNIT_MATERIALS = [
    "Merino Wool",
    "Cotton",
    "CottonCashmere / Extra-fine merino",
    "Wool-Cashmere / Cotton-silk",
    "Cotton-silk (70CO30SE)",
    "S160 Ultra-Fine Merino Wool",
    "Cashmere",
    "Cashmere-Silk",
  ];
  const knitModels: { pattern: RegExp; name: string }[] = [
    { pattern: /^Crew neck\s+€/i, name: "Crew neck" },
    { pattern: /^Crew neck t/i, name: "Crew neck t-shirt" },
    { pattern: /^V[-­]neck/i, name: "V-neck" },
    { pattern: /^Turtle neck/i, name: "Turtle neck" },
    { pattern: /^Mock neck/i, name: "Mock neck" },
    { pattern: /^Hoodie\s*$/i, name: "Hoodie drawstring" },
    { pattern: /^Polo without/i, name: "Polo without buttons" },
    { pattern: /^Polo with\s*$/i, name: "Polo with buttons" },
    { pattern: /^Polo with zip/i, name: "Polo with zip" },
    { pattern: /^Half zip/i, name: "Half zip" },
    { pattern: /^Half button/i, name: "Half button" },
    { pattern: /^Full zip\s+€/i, name: "Full zip" },
    { pattern: /^Full zip with/i, name: "Full zip with baseball collar" },
    { pattern: /^Full button\s+€/i, name: "Full button" },
    { pattern: /^Cardigan\s+€/i, name: "Cardigan" },
    { pattern: /^Cardigan with/i, name: "Cardigan with polo collar" },
    { pattern: /^Hoodie with full/i, name: "Hoodie with full zip" },
    { pattern: /^Full button\s*$/i, name: "Full button bomber" },
    { pattern: /^Full button with/i, name: "Full button with shawl collar" },
    { pattern: /^Leisure pants/i, name: "Leisure pants" },
  ];

  for (let i = 768; i <= 812; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    for (const km of knitModels) {
      if (km.pattern.test(line)) {
        const prices = extractPricesFromLine(line);
        // If line is a continuation (like "shirt" or "buttons"), grab prices from next line too
        let allPrices = prices;
        if (prices.length < 3 && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine && !nextLine.trim().match(/^[A-Z]/)) {
            allPrices = [...prices, ...extractPricesFromLine(nextLine)];
          }
        }
        for (let j = 0; j < allPrices.length && j < KNIT_MATERIALS.length; j++) {
          allRows.push({
            season: SEASON,
            price_category: `Knitwear`,
            section: "Knitwear",
            construction: KNIT_MATERIALS[j],
            make_type: null,
            garment_type: km.name,
            price_eur: allPrices[j],
          });
        }
        break;
      }
    }
  }

  // 22. CutLength - Half Canvas suits (lines ~854-879)
  allRows.push(
    ...parseSuitTable(lines, 848, 882, "CutLength", "Half Canvas", "CustomMade", SUIT_7_COLS)
  );

  // 23. CutLength - Half Canvas other garments (lines ~892-917)
  allRows.push(
    ...parseSuitTable(lines, 888, 920, "CutLength", "Half Canvas", "CustomMade", CL_OTHER_8_COLS)
  );

  // 24. CutLength - Full Canvas suits (lines ~930-955)
  allRows.push(
    ...parseSuitTable(lines, 925, 958, "CutLength", "Full Canvas", "CustomMade", SUIT_7_COLS)
  );

  // 25. CutLength - Full Canvas other garments (lines ~968-993)
  allRows.push(
    ...parseSuitTable(lines, 963, 996, "CutLength", "Full Canvas", "CustomMade", CL_OTHER_8_COLS)
  );

  // 26. CutLength - Handmade suits (lines ~1006-1031)
  allRows.push(
    ...parseSuitTable(lines, 1000, 1035, "CutLength", "Handmade", "CustomMade", SUIT_7_COLS)
  );

  // 27. CutLength - Handmade other garments (lines ~1044-1069)
  allRows.push(
    ...parseSuitTable(lines, 1039, 1072, "CutLength", "Handmade", "CustomMade", CL_OTHER_8_COLS)
  );

  // 28. CutLength lining surcharges (lines ~1084-1103)
  const LINING_COLS = [
    "3-piece suit",
    "3-piece suit + extra trousers",
    "2-piece suit",
    "2-piece suit + extra trousers",
    "Jacket",
    "Waistcoat",
    "Vest",
    "Jacket + Bermudas",
    "Overcoat",
    "Pea coat",
  ];
  allRows.push(
    ...parseSuitTable(lines, 1080, 1106, "CutLength Lining Surcharges", null, null, LINING_COLS)
  );

  return allRows;
}

async function importToSupabase(rows: PriceRow[]) {
  const supabase = getSupabase();

  console.log(`Clearing existing ${SEASON} data...`);
  await supabase.from("price_list").delete().eq("season", SEASON);

  console.log(`Inserting ${rows.length} price rows...`);
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("price_list").insert(batch);
    if (error) {
      console.error(`Batch insert error at ${i}:`, error.message);
      continue;
    }
    inserted += batch.length;
  }
  console.log(`Inserted ${inserted} rows`);
}

async function run() {
  console.log(`=== SS26 Price List Import ===\n`);

  const rows = main();

  // Summary by section
  const sectionCounts = new Map<string, number>();
  for (const r of rows) {
    sectionCounts.set(r.section, (sectionCounts.get(r.section) ?? 0) + 1);
  }
  console.log("Parsed prices by section:");
  for (const [s, c] of [...sectionCounts.entries()].sort()) {
    console.log(`  ${s}: ${c}`);
  }
  console.log(`  TOTAL: ${rows.length}\n`);

  // Sample rows
  console.log("Sample rows:");
  for (const r of rows.slice(0, 5)) {
    console.log(`  ${r.price_category} | ${r.section} | ${r.construction ?? "-"} | ${r.make_type ?? "-"} | ${r.garment_type} | €${r.price_eur}`);
  }
  console.log("");

  await importToSupabase(rows);

  console.log("\n=== Import complete ===");
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
