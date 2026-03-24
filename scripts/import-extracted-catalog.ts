import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceKey, {
  db: { schema: "catalog_extracted" },
});

const DATA_DIR = path.join(__dirname, "..", "data", "gocreate-web");

function readJSON(filename: string) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  WARN: ${filename} not found`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#189;/g, "½")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

async function batchInsert(
  table: string,
  rows: Record<string, unknown>[],
  batchSize = 500
) {
  if (rows.length === 0) return console.log(`  ${table}: 0 rows (skip)`);
  await sb.from(table).delete().gte("id", 0);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await sb.from(table).insert(batch);
    if (error) {
      console.error(`  ERROR ${table} batch ${i}:`, error.message);
      throw error;
    }
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

async function upsert(table: string, rows: Record<string, unknown>[], onConflict?: string) {
  if (rows.length === 0) return console.log(`  ${table}: 0 rows (skip)`);
  const { error } = await sb.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  if (error) {
    console.error(`  ERROR ${table}:`, error.message);
    throw error;
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

interface PLMEntry {
  partId: number;
  partName: string;
  productLines?: { atelierId: number; name: string }[];
  productMakes?: { id: number; name: string }[];
  productFits?: { id: number; name: string }[];
}

interface DesignEntry {
  productPartId: number;
  empty?: boolean;
  makeId?: number;
  fitId?: number;
  atelierId?: number;
  designOptions: Record<
    string,
    { selectId: string; options: { value: string; text: string }[] }
  >;
}

interface FitToolEntry {
  productPartId: number;
  productPart: string;
  fitId: number;
  fitTools: string[];
}

async function importAll() {
  console.log("=".repeat(60));
  console.log("  Import — EXTRACTION DATA ONLY (no manual catalog)");
  console.log("=".repeat(60));

  const plmData = readJSON("product_lines_makes_fits.json") as Record<string, PLMEntry>;
  const combosData = readJSON("design_options_all_combos.json") as Record<string, DesignEntry>;
  const baseData = readJSON("design_options_all_parts.json") as Record<string, DesignEntry>;
  const ftData = readJSON("fit_tools_all_parts.json") as Record<string, FitToolEntry>;
  if (!plmData || !combosData) {
    console.error("Required JSON files missing");
    process.exit(1);
  }

  // ── 1. Product Parts ───────────────────────────────────────────────
  console.log("\n[1/11] Product Parts...");
  const partMap = new Map<number, string>();
  for (const cfg of Object.values(plmData)) {
    partMap.set(cfg.partId, cfg.partName);
  }
  await upsert(
    "gc_product_parts",
    Array.from(partMap.entries()).map(([id, name]) => ({
      id,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    })),
    "id"
  );

  // ── 2. Product Lines (ateliers) ────────────────────────────────────
  console.log("\n[2/11] Product Lines...");
  const seenAteliers = new Set<number>();
  const lineRows: { atelier_id: number; name: string }[] = [];
  const linePartRows: { atelier_id: number; part_id: number }[] = [];
  for (const cfg of Object.values(plmData)) {
    for (const pl of cfg.productLines ?? []) {
      if (!seenAteliers.has(pl.atelierId)) {
        lineRows.push({ atelier_id: pl.atelierId, name: pl.name });
        seenAteliers.add(pl.atelierId);
      }
      linePartRows.push({ atelier_id: pl.atelierId, part_id: cfg.partId });
    }
  }
  await upsert("gc_product_lines", lineRows, "atelier_id");
  await upsert("gc_product_line_parts", linePartRows, "atelier_id,part_id");

  // ── 3. Item Type Categories (from category_part_mapping.json) ──────
  console.log("\n[3/11] Item Type Categories...");
  const categoryPartMap: Record<string, number[]> = readJSON("category_part_mapping.json") ?? {};
  const categoryNames = Object.keys(categoryPartMap);
  await sb.from("gc_item_type_category_parts").delete().gte("category_id", 0);
  await sb.from("gc_item_type_categories").delete().gte("id", 0);
  for (let i = 0; i < categoryNames.length; i++) {
    const catName = categoryNames[i];
    const parts = categoryPartMap[catName];
    const { data: ins, error: e } = await sb
      .from("gc_item_type_categories")
      .insert({ name: catName, description: "", sort_order: i })
      .select("id")
      .single();
    if (e) { console.error(`  ERR: ${e.message}`); continue; }
    if (parts.length > 0) {
      await sb.from("gc_item_type_category_parts").insert(
        parts.map((pid) => ({ category_id: ins.id, part_id: pid }))
      );
    }
  }
  console.log(`  gc_item_type_categories: ${categoryNames.length}`);

  // ── 4. Makes ───────────────────────────────────────────────────────
  console.log("\n[4/11] Makes...");
  const makeRows: { id: number; part_id: number; name: string }[] = [];
  for (const cfg of Object.values(plmData)) {
    for (const mk of cfg.productMakes ?? []) {
      if (!makeRows.find((r) => r.id === mk.id && r.part_id === cfg.partId))
        makeRows.push({ id: mk.id, part_id: cfg.partId, name: mk.name });
    }
  }
  await upsert("gc_makes", makeRows, "id,part_id");

  // ── 5. Fits ────────────────────────────────────────────────────────
  console.log("\n[5/11] Fits...");
  const fitRows: { id: number; part_id: number; name: string }[] = [];
  for (const cfg of Object.values(plmData)) {
    for (const ft of cfg.productFits ?? []) {
      if (!fitRows.find((r) => r.id === ft.id && r.part_id === cfg.partId))
        fitRows.push({ id: ft.id, part_id: cfg.partId, name: ft.name.trim() });
    }
  }
  await upsert("gc_fits", fitRows, "id,part_id");

  // ── 6+7. Design Options + Values (UNION of ALL 149 combos) ────────
  console.log("\n[6/11] Design Options (union of all combos)...");
  const merged = new Map<
    number,
    Map<string, { selectId: string; values: Map<string, string> }>
  >();

  const allEntries: DesignEntry[] = [
    ...Object.values(baseData ?? {}),
    ...Object.values(combosData),
  ];

  for (const entry of allEntries) {
    if (entry.empty || !entry.designOptions) continue;
    const pid = entry.productPartId;
    if (!merged.has(pid)) merged.set(pid, new Map());
    const partOpts = merged.get(pid)!;
    for (const [optName, optData] of Object.entries(entry.designOptions)) {
      const decoded = decodeHtml(optName);
      if (!partOpts.has(decoded))
        partOpts.set(decoded, { selectId: optData.selectId, values: new Map() });
      const optEntry = partOpts.get(decoded)!;
      for (const v of optData.options) {
        if (v.value && v.value !== "-1" && !optEntry.values.has(v.value))
          optEntry.values.set(v.value, decodeHtml(v.text));
      }
    }
  }

  const doRows: { part_id: number; gc_select_id: string; name: string; sort_order: number }[] = [];
  for (const [pid, partOpts] of merged) {
    let idx = 0;
    for (const [optName, optData] of partOpts) {
      doRows.push({ part_id: pid, gc_select_id: optData.selectId, name: optName, sort_order: idx++ });
    }
  }
  await batchInsert("gc_design_options", doRows);

  const { data: dbOpts } = await sb.from("gc_design_options").select("id, part_id, name");
  const optPkMap = new Map<string, number>();
  for (const row of dbOpts ?? []) optPkMap.set(`${row.part_id}_${row.name}`, row.id);

  console.log("\n[7/11] Option Values...");
  const ovRows: { design_option_id: number; value_id: string; label: string; sort_order: number }[] = [];
  for (const [pid, partOpts] of merged) {
    for (const [optName, optData] of partOpts) {
      const pk = optPkMap.get(`${pid}_${optName}`);
      if (!pk) continue;
      let vi = 0;
      for (const [valId, label] of optData.values)
        ovRows.push({ design_option_id: pk, value_id: valId, label, sort_order: vi++ });
    }
  }
  await batchInsert("gc_option_values", ovRows, 1000);

  // ── 8. Combo Option Availability ───────────────────────────────────
  console.log("\n[8/11] Combo Option Availability...");
  const availRows: {
    part_id: number; make_id: number; fit_id: number; atelier_id: number;
    design_option_id: number; available_value_ids: string[];
  }[] = [];

  for (const entry of Object.values(combosData)) {
    if (entry.empty || !entry.designOptions) continue;
    for (const [optName, optData] of Object.entries(entry.designOptions)) {
      const decoded = decodeHtml(optName);
      const doId = optPkMap.get(`${entry.productPartId}_${decoded}`);
      if (!doId) continue;
      availRows.push({
        part_id: entry.productPartId,
        make_id: entry.makeId!,
        fit_id: entry.fitId!,
        atelier_id: entry.atelierId ?? 1,
        design_option_id: doId,
        available_value_ids: optData.options.filter((v) => v.value && v.value !== "-1").map((v) => v.value),
      });
    }
  }

  await sb.from("gc_combo_option_availability").delete().gte("id", 0);
  for (let i = 0; i < availRows.length; i += 500) {
    const batch = availRows.slice(i, i + 500);
    const { error } = await sb.from("gc_combo_option_availability").insert(batch);
    if (error) { console.error(`  ERR batch ${i}: ${error.message}`); throw error; }
  }
  console.log(`  gc_combo_option_availability: ${availRows.length} rows`);

  // ── 9. Fit Tools (per part × fit) ──────────────────────────────────
  console.log("\n[9/11] Fit Tools...");
  if (ftData) {
    const ftRows: {
      part_id: number; fit_id: number; name: string; input_type: string;
      min_val: number; max_val: number; step_val: number;
      default_val: string; sort_order: number;
    }[] = [];
    const seen = new Set<string>();
    for (const entry of Object.values(ftData)) {
      const fid = entry.fitId || 0;
      for (let i = 0; i < entry.fitTools.length; i++) {
        const toolName = decodeHtml(entry.fitTools[i]);
        const key = `${entry.productPartId}_${fid}_${toolName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        ftRows.push({
          part_id: entry.productPartId, fit_id: fid, name: toolName,
          input_type: "numeric", min_val: 0, max_val: 2, step_val: 0.5,
          default_val: "0", sort_order: i,
        });
      }
    }
    await batchInsert("gc_fit_tools", ftRows);
  }

  // ── 10. Customer Fields, Dropdowns ─────────────────────────────────
  console.log("\n[10/11] Customer Fields & Dropdowns...");
  const customerRaw = readJSON("customer_create_fields.json");
  if (customerRaw) {
    await sb.from("gc_customer_dropdown_options").delete().gte("id", 0);
    await sb.from("gc_customer_dropdowns").delete().gte("id", 0);
    await sb.from("gc_customer_fields").delete().gte("id", 0);

    const fieldRows = Object.entries(customerRaw.formFields ?? {}).map(([name, type]) => ({
      field_name: name,
      field_type: type as string,
      section: name.startsWith("txtBMVal") ? "body_measurements"
        : name.startsWith("CustomerData") ? "customer_data" : "general",
    }));
    if (fieldRows.length) {
      await sb.from("gc_customer_fields").insert(fieldRows);
      console.log(`  gc_customer_fields: ${fieldRows.length} rows`);
    }

    const ddEntries = Object.entries(customerRaw.dropdowns ?? {});
    for (const [ddName] of ddEntries)
      await sb.from("gc_customer_dropdowns").insert({ dropdown_name: ddName, label: ddName });
    console.log(`  gc_customer_dropdowns: ${ddEntries.length} rows`);

    const { data: dbDDs } = await sb.from("gc_customer_dropdowns").select("id, dropdown_name");
    const ddPkMap = new Map<string, number>();
    for (const row of dbDDs ?? []) ddPkMap.set(row.dropdown_name, row.id);

    const ddOptRows: { dropdown_id: number; value: string; label: string; sort_order: number }[] = [];
    for (const [ddName, ddInfo] of ddEntries) {
      const pk = ddPkMap.get(ddName);
      if (!pk) continue;
      const opts = Array.isArray(ddInfo)
        ? (ddInfo as { value: string; text: string }[])
        : ((ddInfo as { options?: { value: string; text: string }[] }).options ?? []);
      opts.forEach((opt, i) =>
        ddOptRows.push({ dropdown_id: pk, value: opt.value, label: decodeHtml(opt.text), sort_order: i })
      );
    }
    if (ddOptRows.length) {
      for (let i = 0; i < ddOptRows.length; i += 500) {
        await sb.from("gc_customer_dropdown_options").insert(ddOptRows.slice(i, i + 500));
      }
      console.log(`  gc_customer_dropdown_options: ${ddOptRows.length} rows`);
    }
  }

  // ── 11. Localized Messages ─────────────────────────────────────────
  console.log("\n[11/11] Localized Messages...");
  const msgsRaw = readJSON("localized_messages.json");
  if (msgsRaw) {
    const msgRows = Object.entries(msgsRaw).map(([key, value]) => ({ key, value: value as string }));
    await upsert("gc_localized_messages", msgRows, "key");
  }

  // ── Summary ────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("  IMPORT COMPLETE — extraction data only");
  console.log("=".repeat(60));

  const allTables = [
    "gc_product_parts", "gc_product_lines", "gc_product_line_parts",
    "gc_item_type_categories", "gc_item_type_category_parts",
    "gc_makes", "gc_fits",
    "gc_design_options", "gc_option_values", "gc_combo_option_availability",
    "gc_fit_tools",
    "gc_customer_fields", "gc_customer_dropdowns", "gc_customer_dropdown_options",
    "gc_localized_messages",
  ];

  console.log("\n  Row counts:");
  for (const t of allTables) {
    const { count } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(`    ${t.padEnd(38)} ${(count ?? 0).toString().padStart(6)}`);
  }
}

importAll().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
