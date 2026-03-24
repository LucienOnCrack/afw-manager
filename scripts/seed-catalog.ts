import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import {
  ITEM_COMBINATIONS,
  PRODUCT_PARTS_BY_ITEM,
  MAKES_BY_PART,
  MODELS_BY_PART,
  CANVAS_OPTIONS,
  LINING_MODES,
  BUTTON_OPTIONS,
  SALES_ASSOCIATES,
  FIT_ADVISE_BY_PART,
  FITS_BY_PART,
  TRYON_SIZES_BY_PART,
  DESIGN_OPTIONS_BY_PART,
  FIT_TOOLS_BY_PART,
  BRANDING_POSITIONS_BY_PART,
  DESIGN_OPTION_CONFLICTS,
  COMBINATION_STEP_VISIBILITY,
} from "../src/lib/gocreate-catalog";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceKey, {
  db: { schema: "catalog" },
});

async function upsert(table: string, rows: Record<string, unknown>[], onConflict?: string) {
  if (rows.length === 0) { console.log(`  ${table}: 0 rows (skip)`); return; }
  const { error } = await sb.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  if (error) { console.error(`  ERROR ${table}:`, error.message); throw error; }
  console.log(`  ${table}: ${rows.length} rows`);
}

async function seed() {
  console.log("Seeding catalog schema...\n");

  // 1. Item combinations
  await upsert(
    "gc_item_combinations",
    ITEM_COMBINATIONS.map((i) => ({ id: i.id, name: i.name })),
    "id"
  );

  // 2. Item parts
  const itemPartRows: { item_id: number; part_id: number; part_name: string; sort_order: number }[] = [];
  for (const [itemId, parts] of Object.entries(PRODUCT_PARTS_BY_ITEM)) {
    parts.forEach((p, idx) => {
      itemPartRows.push({ item_id: Number(itemId), part_id: p.id, part_name: p.name, sort_order: idx });
    });
  }
  await upsert("gc_item_parts", itemPartRows, "item_id,part_id,sort_order");

  // 3. Makes
  const makeRows: { id: number; part_id: number; name: string }[] = [];
  for (const [partId, makes] of Object.entries(MAKES_BY_PART)) {
    for (const m of makes) {
      makeRows.push({ id: m.id, part_id: Number(partId), name: m.name });
    }
  }
  await upsert("gc_makes", makeRows, "id,part_id");

  // 4. Models
  const modelRows: { id: number; part_id: number; name: string }[] = [];
  for (const [partId, models] of Object.entries(MODELS_BY_PART)) {
    for (const m of models) {
      modelRows.push({ id: m.id, part_id: Number(partId), name: m.name });
    }
  }
  await upsert("gc_models", modelRows, "id,part_id");

  // 5. Canvas options
  await upsert(
    "gc_canvas_options",
    CANVAS_OPTIONS.map((c) => ({ value_id: c.valueId, label: c.label })),
    "value_id"
  );

  // 6. Lining modes
  await upsert(
    "gc_lining_modes",
    LINING_MODES.map((m) => ({ id: m.id, name: m.name })),
    "id"
  );

  // 7. Buttons
  await upsert(
    "gc_buttons",
    BUTTON_OPTIONS.map((b, i) => ({ trim_id: b.trimId, label: b.label, sort_order: i })),
    "trim_id"
  );

  // 8. Sales associates
  await upsert(
    "gc_sales_associates",
    SALES_ASSOCIATES.map((s) => ({ id: s.id, name: s.name })),
    "id"
  );

  // 9. Fit advise
  const fitAdviseRows: { id: number; part_id: number; name: string }[] = [];
  for (const [partId, options] of Object.entries(FIT_ADVISE_BY_PART)) {
    for (const o of options) {
      fitAdviseRows.push({ id: o.id, part_id: Number(partId), name: o.name });
    }
  }
  await upsert("gc_fit_advise", fitAdviseRows, "id,part_id");

  // 10. Fits
  const fitRows: { id: number; part_id: number; name: string }[] = [];
  for (const [partId, fits] of Object.entries(FITS_BY_PART)) {
    for (const f of fits) {
      fitRows.push({ id: f.id, part_id: Number(partId), name: f.name });
    }
  }
  await upsert("gc_fits", fitRows, "id,part_id");

  // 11. Tryon sizes
  const tryonRows: { id: number; part_id: number; label: string; sort_order: number }[] = [];
  for (const [partId, sizes] of Object.entries(TRYON_SIZES_BY_PART)) {
    sizes.forEach((s, idx) => {
      tryonRows.push({ id: s.id, part_id: Number(partId), label: s.label, sort_order: idx });
    });
  }
  await upsert("gc_tryon_sizes", tryonRows, "id,part_id");

  // 12. Option categories + design options + option values
  // First collect option categories, design options, and values
  const categoryRows: { id: number; part_id: number; category_name: string }[] = [];
  const designOptionRows: { category_id: number; part_id: number; option_id: number; name: string; sort_order: number }[] = [];
  const optionValueRows: { design_option_id: number; value_id: string; label: string; sort_order: number }[] = [];

  // We need the auto-generated PK from gc_design_options for linking values.
  // Insert categories first, then options, then values.

  for (const [partId, categories] of Object.entries(DESIGN_OPTIONS_BY_PART)) {
    for (const cat of categories) {
      const exists = categoryRows.find((r) => r.id === cat.categoryId && r.part_id === Number(partId));
      if (!exists) {
        categoryRows.push({ id: cat.categoryId, part_id: Number(partId), category_name: cat.categoryName });
      }
      cat.options.forEach((opt, optIdx) => {
        designOptionRows.push({
          category_id: cat.categoryId,
          part_id: Number(partId),
          option_id: opt.optionId,
          name: opt.name,
          sort_order: optIdx,
        });
      });
    }
  }

  await upsert("gc_option_categories", categoryRows, "id,part_id");
  await upsert("gc_design_options", designOptionRows, "category_id,part_id,option_id");

  // Now fetch back the design option PKs to link values
  const { data: dbOptions, error: optErr } = await sb
    .from("gc_design_options")
    .select("id, category_id, part_id, option_id");
  if (optErr) throw optErr;

  const optionPkMap = new Map<string, number>();
  for (const row of dbOptions ?? []) {
    optionPkMap.set(`${row.part_id}_${row.category_id}_${row.option_id}`, row.id);
  }

  for (const [partId, categories] of Object.entries(DESIGN_OPTIONS_BY_PART)) {
    for (const cat of categories) {
      for (const opt of cat.options) {
        const designOptionPk = optionPkMap.get(`${partId}_${cat.categoryId}_${opt.optionId}`);
        if (!designOptionPk) {
          console.warn(`  WARN: no PK for part=${partId} cat=${cat.categoryId} opt=${opt.optionId}`);
          continue;
        }
        opt.values.forEach((v, vi) => {
          optionValueRows.push({
            design_option_id: designOptionPk,
            value_id: String(v.valueId),
            label: v.label,
            sort_order: vi,
          });
        });
      }
    }
  }

  // Truncate and re-insert option values (some options have duplicate value_id=0)
  await sb.from("gc_option_values").delete().gte("id", 0);
  const BATCH = 500;
  for (let i = 0; i < optionValueRows.length; i += BATCH) {
    const batch = optionValueRows.slice(i, i + BATCH);
    const { error: valErr } = await sb.from("gc_option_values").insert(batch);
    if (valErr) { console.error(`  ERROR gc_option_values batch ${i}:`, valErr.message); throw valErr; }
  }
  console.log(`  gc_option_values: ${optionValueRows.length} rows`);

  // 13. Fit tools
  const fitToolRows: {
    part_id: number; name: string; section: string; input_type: string;
    min_val: number | null; max_val: number | null; step_val: number | null;
    default_val: string | null; options: string[] | null; sort_order: number;
  }[] = [];
  for (const [partId, tools] of Object.entries(FIT_TOOLS_BY_PART)) {
    tools.forEach((t, idx) => {
      fitToolRows.push({
        part_id: Number(partId),
        name: t.name,
        section: t.section,
        input_type: t.inputType,
        min_val: t.inputType === "numeric" ? t.min : null,
        max_val: t.inputType === "numeric" ? t.max : null,
        step_val: t.inputType === "numeric" ? t.step : null,
        default_val: t.defaultValue,
        options: t.dropdownValues ?? null,
        sort_order: idx,
      });
    });
  }
  // Truncate and re-insert (some tools have duplicate names across sections)
  await sb.from("gc_fit_tools").delete().gte("id", 0);
  for (let i = 0; i < fitToolRows.length; i += BATCH) {
    const batch = fitToolRows.slice(i, i + BATCH);
    const { error: ftErr } = await sb.from("gc_fit_tools").insert(batch);
    if (ftErr) { console.error(`  ERROR gc_fit_tools batch ${i}:`, ftErr.message); throw ftErr; }
  }
  console.log(`  gc_fit_tools: ${fitToolRows.length} rows`);

  // 14. Branding positions + labels
  const brandingPosRows: { part_id: number; position_id: number; position_name: string }[] = [];
  for (const [partId, positions] of Object.entries(BRANDING_POSITIONS_BY_PART)) {
    for (const pos of positions) {
      brandingPosRows.push({ part_id: Number(partId), position_id: pos.positionId, position_name: pos.positionName });
    }
  }
  await upsert("gc_branding_positions", brandingPosRows, "part_id,position_id");

  // Fetch back branding position PKs for linking labels
  const { data: dbPositions, error: posErr } = await sb
    .from("gc_branding_positions")
    .select("id, part_id, position_id");
  if (posErr) throw posErr;

  const posPkMap = new Map<string, number>();
  for (const row of dbPositions ?? []) {
    posPkMap.set(`${row.part_id}_${row.position_id}`, row.id);
  }

  const labelRows: { position_pk: number; label_id: number; label_name: string }[] = [];
  for (const [partId, positions] of Object.entries(BRANDING_POSITIONS_BY_PART)) {
    for (const pos of positions) {
      const pk = posPkMap.get(`${partId}_${pos.positionId}`);
      if (!pk) continue;
      for (const lbl of pos.labels) {
        labelRows.push({ position_pk: pk, label_id: lbl.labelId, label_name: lbl.labelName });
      }
    }
  }
  await upsert("gc_branding_labels", labelRows, "position_pk,label_id");

  // 15. Design option conflicts
  const conflictRows = DESIGN_OPTION_CONFLICTS.map((c) => ({
    part_id: c.partId,
    option_a_id: c.optionA.optionId,
    option_a_name: c.optionA.name,
    option_a_value_ids: c.optionA.valueIds,
    option_a_label: c.optionA.valueLabel,
    option_b_id: c.optionB.optionId,
    option_b_name: c.optionB.name,
    option_b_value_ids: c.optionB.valueIds,
    option_b_label: c.optionB.valueLabel,
    message: c.message,
  }));
  // Truncate and re-insert conflicts (auto-increment PK, no natural upsert key)
  await sb.from("gc_design_conflicts").delete().gte("id", 0);
  const { error: conflictErr } = await sb.from("gc_design_conflicts").insert(conflictRows);
  if (conflictErr) { console.error("  ERROR gc_design_conflicts:", conflictErr.message); throw conflictErr; }
  console.log(`  gc_design_conflicts: ${conflictRows.length} rows`);

  // 16. Lining color map (solid + bemberg)
  // Import the lining maps from the catalog file - they're not exported so we inline them
  const SOLID_LINING_MAP: Record<string, { id: number; code: string; name: string }> = {
    "black": { id: 687, code: "2050", name: "2050 mid grey" },
    "charcoal": { id: 685, code: "2871", name: "2871 dark grey" },
    "dark grey": { id: 685, code: "2871", name: "2871 dark grey" },
    "mid grey": { id: 687, code: "2050", name: "2050 mid grey" },
    "grey": { id: 687, code: "2050", name: "2050 mid grey" },
    "light grey": { id: 689, code: "2723", name: "2723 light grey" },
    "silver": { id: 691, code: "2521", name: "2521 silver grey" },
    "navy": { id: 722, code: "7494", name: "7494 midnight blue" },
    "midnight blue": { id: 722, code: "7494", name: "7494 midnight blue" },
    "dark blue": { id: 721, code: "7549", name: "7549 dark blue" },
    "blue": { id: 720, code: "7878", name: "7878 mid blue" },
    "mid blue": { id: 720, code: "7878", name: "7878 mid blue" },
    "light blue": { id: 714, code: "7533", name: "7533 light blue" },
    "sky blue": { id: 713, code: "7420", name: "7420 sky blue" },
    "cobalt": { id: 719, code: "7581", name: "7581 cobalt blue" },
    "petrol": { id: 717, code: "7022", name: "7022 petrol" },
    "brown": { id: 698, code: "8952", name: "8952 mid brown" },
    "dark brown": { id: 700, code: "8876", name: "8876 dark brown" },
    "mid brown": { id: 698, code: "8952", name: "8952 mid brown" },
    "light brown": { id: 697, code: "8742", name: "8742 taupe" },
    "tan": { id: 696, code: "8134", name: "8134 camel" },
    "camel": { id: 696, code: "8134", name: "8134 camel" },
    "beige": { id: 694, code: "8202", name: "8202 light beige" },
    "sand": { id: 694, code: "8202", name: "8202 light beige" },
    "cream": { id: 693, code: "1561", name: "1561 off-white" },
    "off-white": { id: 693, code: "1561", name: "1561 off-white" },
    "ivory": { id: 693, code: "1561", name: "1561 off-white" },
    "white": { id: 692, code: "1400", name: "1400 white" },
    "bone": { id: 693, code: "1561", name: "1561 off-white" },
    "burgundy": { id: 702, code: "3532", name: "3532 wine red" },
    "wine": { id: 702, code: "3532", name: "3532 wine red" },
    "red": { id: 705, code: "3812", name: "3812 red" },
    "dark red": { id: 706, code: "3526", name: "3526 dark red" },
    "green": { id: 726, code: "6956", name: "6956 mid green" },
    "dark green": { id: 3563, code: "163", name: "163 dark green" },
    "forest green": { id: 724, code: "6383", name: "6383 forest green" },
    "bottle green": { id: 723, code: "6933", name: "6933 bottle green" },
    "olive": { id: 725, code: "6953", name: "6953 olive green" },
    "taupe": { id: 697, code: "8742", name: "8742 taupe" },
    "aubergine": { id: 701, code: "3847", name: "3847 aubergine" },
    "purple": { id: 708, code: "7974", name: "7974 purple" },
    "violet": { id: 709, code: "7738", name: "7738 violet" },
    "pink": { id: 730, code: "3008", name: "3008 pale pink" },
    "orange": { id: 704, code: "4170", name: "4170 orange" },
    "yellow": { id: 728, code: "5316", name: "5316 yellow" },
    "khaki": { id: 725, code: "6953", name: "6953 olive green" },
    "slate": { id: 716, code: "7593", name: "7593 dark slate blue" },
  };

  const BEMBERG_LINING_MAP: Record<string, { id: number; code: string; name: string }> = {
    "black": { id: 566, code: "100 Bemberg", name: "100 Bemberg dark grey" },
    "charcoal": { id: 566, code: "100 Bemberg", name: "100 Bemberg dark grey" },
    "dark grey": { id: 566, code: "100 Bemberg", name: "100 Bemberg dark grey" },
    "mid grey": { id: 858, code: "3224 Bemberg", name: "3224 Bemberg mid grey" },
    "grey": { id: 858, code: "3224 Bemberg", name: "3224 Bemberg mid grey" },
    "light grey": { id: 859, code: "109 Bemberg", name: "109 Bemberg silver" },
    "silver": { id: 859, code: "109 Bemberg", name: "109 Bemberg silver" },
    "navy": { id: 574, code: "9688 Bemberg", name: "9688 Bemberg midnight blue" },
    "midnight blue": { id: 574, code: "9688 Bemberg", name: "9688 Bemberg midnight blue" },
    "dark blue": { id: 520, code: "9680 Bemberg", name: "9680 Bemberg dark blue" },
    "blue": { id: 569, code: "858 Bemberg", name: "858 Bemberg middle blue" },
    "mid blue": { id: 569, code: "858 Bemberg", name: "858 Bemberg middle blue" },
    "light blue": { id: 876, code: "110 Bemberg", name: "110 Bemberg sky blue" },
    "sky blue": { id: 876, code: "110 Bemberg", name: "110 Bemberg sky blue" },
    "brown": { id: 571, code: "3282 Bemberg", name: "3282 Bemberg brown" },
    "dark brown": { id: 862, code: "1047 Bemberg", name: "1047 Bemberg dark brown" },
    "mid brown": { id: 571, code: "3282 Bemberg", name: "3282 Bemberg brown" },
    "tan": { id: 861, code: "25 Bemberg", name: "25 Bemberg camel" },
    "camel": { id: 861, code: "25 Bemberg", name: "25 Bemberg camel" },
    "beige": { id: 860, code: "107 Bemberg", name: "107 Bemberg beige" },
    "sand": { id: 860, code: "107 Bemberg", name: "107 Bemberg beige" },
    "cream": { id: 568, code: "1098 Bemberg", name: "1098 Bemberg white" },
    "off-white": { id: 568, code: "1098 Bemberg", name: "1098 Bemberg white" },
    "ivory": { id: 568, code: "1098 Bemberg", name: "1098 Bemberg white" },
    "white": { id: 568, code: "1098 Bemberg", name: "1098 Bemberg white" },
    "bone": { id: 568, code: "1098 Bemberg", name: "1098 Bemberg white" },
    "burgundy": { id: 563, code: "230 Bemberg", name: "230 Bemberg red" },
    "wine": { id: 563, code: "230 Bemberg", name: "230 Bemberg red" },
    "red": { id: 563, code: "230 Bemberg", name: "230 Bemberg red" },
    "dark red": { id: 563, code: "230 Bemberg", name: "230 Bemberg red" },
    "green": { id: 572, code: "3277 Bemberg", name: "3277 Bemberg green" },
    "dark green": { id: 3564, code: "268 Bemberg", name: "268 Bemberg dark green" },
    "forest green": { id: 864, code: "188 Bemberg", name: "188 Bemberg forest green" },
    "olive": { id: 572, code: "3277 Bemberg", name: "3277 Bemberg green" },
    "taupe": { id: 3565, code: "119 Bemberg", name: "119 Bemberg taupe" },
    "aubergine": { id: 565, code: "3276 Bemberg", name: "3276 Bemberg aubergine" },
    "purple": { id: 567, code: "3622 Bemberg", name: "3622 Bemberg purple" },
    "pink": { id: 570, code: "846 Bemberg", name: "846 Bemberg pink" },
    "orange": { id: 563, code: "230 Bemberg", name: "230 Bemberg red" },
    "khaki": { id: 572, code: "3277 Bemberg", name: "3277 Bemberg green" },
  };

  const liningColorRows: { color_keyword: string; lining_group: number; lining_id: number; lining_code: string; lining_name: string }[] = [];
  for (const [keyword, lining] of Object.entries(SOLID_LINING_MAP)) {
    liningColorRows.push({ color_keyword: keyword, lining_group: 2, lining_id: lining.id, lining_code: lining.code, lining_name: lining.name });
  }
  for (const [keyword, lining] of Object.entries(BEMBERG_LINING_MAP)) {
    liningColorRows.push({ color_keyword: keyword, lining_group: 3, lining_id: lining.id, lining_code: lining.code, lining_name: lining.name });
  }
  await upsert("gc_lining_color_map", liningColorRows, "color_keyword,lining_group");

  // 17. Combination visibility
  const visRows = Object.entries(COMBINATION_STEP_VISIBILITY).map(([itemId, vis]) => ({
    item_id: Number(itemId),
    part_ids: vis.parts,
    show_extra_lining: vis.showExtraLining,
  }));
  await upsert("gc_combination_visibility", visRows, "item_id");

  console.log("\nDone! All catalog data seeded.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
