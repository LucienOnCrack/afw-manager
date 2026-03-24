import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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
  VALIDATION_RULES,
  DESIGN_OPTION_CONFLICTS,
} from "../src/lib/gocreate-catalog";

import * as fs from "fs";

function esc(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

const lines: string[] = [];
function emit(sql: string) {
  lines.push(sql);
}

emit("-- Auto-generated seed data for catalog schema");
emit("-- Generated from src/lib/gocreate-catalog.ts");
emit("BEGIN;");
emit("");

// ── gc_item_combinations ───────────────────────────────────────────
emit("-- gc_item_combinations");
for (const ic of ITEM_COMBINATIONS) {
  emit(`INSERT INTO catalog.gc_item_combinations (id, name) VALUES (${ic.id}, ${esc(ic.name)}) ON CONFLICT (id) DO NOTHING;`);
}
emit("");

// ── gc_product_parts ───────────────────────────────────────────────
emit("-- gc_product_parts (deduplicated)");
const seenParts = new Set<number>();
for (const parts of Object.values(PRODUCT_PARTS_BY_ITEM)) {
  for (const p of parts) {
    if (!seenParts.has(p.id)) {
      seenParts.add(p.id);
      emit(`INSERT INTO catalog.gc_product_parts (id, name) VALUES (${p.id}, ${esc(p.name)}) ON CONFLICT (id) DO NOTHING;`);
    }
  }
}
emit("");

// ── gc_item_part_map ───────────────────────────────────────────────
emit("-- gc_item_part_map");
for (const [itemId, parts] of Object.entries(PRODUCT_PARTS_BY_ITEM)) {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    emit(`INSERT INTO catalog.gc_item_part_map (item_combination_id, product_part_id, sort_order, display_name) VALUES (${itemId}, ${p.id}, ${i}, ${esc(p.name)}) ON CONFLICT DO NOTHING;`);
  }
}
emit("");

// ── gc_makes ───────────────────────────────────────────────────────
emit("-- gc_makes");
const seenMakes = new Set<number>();
for (const [partId, makes] of Object.entries(MAKES_BY_PART)) {
  for (let i = 0; i < makes.length; i++) {
    const m = makes[i];
    if (!seenMakes.has(m.id)) {
      seenMakes.add(m.id);
      emit(`INSERT INTO catalog.gc_makes (id, name) VALUES (${m.id}, ${esc(m.name)}) ON CONFLICT (id) DO NOTHING;`);
    }
  }
}
emit("");

// ── gc_part_makes ──────────────────────────────────────────────────
emit("-- gc_part_makes");
for (const [partId, makes] of Object.entries(MAKES_BY_PART)) {
  for (let i = 0; i < makes.length; i++) {
    emit(`INSERT INTO catalog.gc_part_makes (product_part_id, make_id, sort_order) VALUES (${partId}, ${makes[i].id}, ${i}) ON CONFLICT DO NOTHING;`);
  }
}
emit("");

// ── gc_models ──────────────────────────────────────────────────────
emit("-- gc_models");
const seenModels = new Set<number>();
for (const [partId, models] of Object.entries(MODELS_BY_PART)) {
  for (const m of models) {
    if (!seenModels.has(m.id)) {
      seenModels.add(m.id);
      emit(`INSERT INTO catalog.gc_models (id, name) VALUES (${m.id}, ${esc(m.name)}) ON CONFLICT (id) DO NOTHING;`);
    }
  }
}
emit("");

// ── gc_part_models ─────────────────────────────────────────────────
emit("-- gc_part_models");
for (const [partId, models] of Object.entries(MODELS_BY_PART)) {
  for (let i = 0; i < models.length; i++) {
    emit(`INSERT INTO catalog.gc_part_models (product_part_id, model_id, sort_order) VALUES (${partId}, ${models[i].id}, ${i}) ON CONFLICT DO NOTHING;`);
  }
}
emit("");

// ── gc_canvas_options ──────────────────────────────────────────────
emit("-- gc_canvas_options");
for (const c of CANVAS_OPTIONS) {
  emit(`INSERT INTO catalog.gc_canvas_options (value_id, label) VALUES (${c.valueId}, ${esc(c.label)}) ON CONFLICT DO NOTHING;`);
}
emit("");

// ── gc_lining_modes ────────────────────────────────────────────────
emit("-- gc_lining_modes");
for (const lm of LINING_MODES) {
  emit(`INSERT INTO catalog.gc_lining_modes (id, name) VALUES (${lm.id}, ${esc(lm.name)}) ON CONFLICT (id) DO NOTHING;`);
}
emit("");

// ── gc_buttons ─────────────────────────────────────────────────────
emit("-- gc_buttons");
for (const b of BUTTON_OPTIONS) {
  emit(`INSERT INTO catalog.gc_buttons (trim_id, label) VALUES (${b.trimId}, ${esc(b.label)}) ON CONFLICT DO NOTHING;`);
}
emit("");

// ── gc_sales_associates ────────────────────────────────────────────
emit("-- gc_sales_associates");
for (const sa of SALES_ASSOCIATES) {
  emit(`INSERT INTO catalog.gc_sales_associates (id, name) VALUES (${sa.id}, ${esc(sa.name)}) ON CONFLICT (id) DO NOTHING;`);
}
emit("");

// ── gc_fit_advise ──────────────────────────────────────────────────
emit("-- gc_fit_advise");
const seenFitAdvise = new Set<number>();
for (const [partId, opts] of Object.entries(FIT_ADVISE_BY_PART)) {
  for (let i = 0; i < opts.length; i++) {
    const fa = opts[i];
    if (!seenFitAdvise.has(fa.id)) {
      seenFitAdvise.add(fa.id);
      emit(`INSERT INTO catalog.gc_fit_advise (id, name) VALUES (${fa.id}, ${esc(fa.name)}) ON CONFLICT (id) DO NOTHING;`);
    }
  }
}
emit("");

// ── gc_part_fit_advise ─────────────────────────────────────────────
emit("-- gc_part_fit_advise");
for (const [partId, opts] of Object.entries(FIT_ADVISE_BY_PART)) {
  for (let i = 0; i < opts.length; i++) {
    emit(`INSERT INTO catalog.gc_part_fit_advise (product_part_id, fit_advise_id, sort_order) VALUES (${partId}, ${opts[i].id}, ${i}) ON CONFLICT DO NOTHING;`);
  }
}
emit("");

// ── gc_fits ────────────────────────────────────────────────────────
emit("-- gc_fits");
const seenFits = new Set<string>();
for (const [partId, fits] of Object.entries(FITS_BY_PART)) {
  for (const f of fits) {
    const key = `${partId}_${f.id}`;
    if (!seenFits.has(key)) {
      seenFits.add(key);
    }
  }
}
const globalFits = new Set<number>();
for (const [partId, fits] of Object.entries(FITS_BY_PART)) {
  for (const f of fits) {
    if (!globalFits.has(f.id)) {
      globalFits.add(f.id);
      emit(`INSERT INTO catalog.gc_fits (id, name) VALUES (${f.id}, ${esc(f.name)}) ON CONFLICT (id) DO NOTHING;`);
    }
  }
}
emit("");

// ── gc_part_fits ───────────────────────────────────────────────────
emit("-- gc_part_fits");
for (const [partId, fits] of Object.entries(FITS_BY_PART)) {
  for (let i = 0; i < fits.length; i++) {
    emit(`INSERT INTO catalog.gc_part_fits (product_part_id, fit_id, sort_order) VALUES (${partId}, ${fits[i].id}, ${i}) ON CONFLICT DO NOTHING;`);
  }
}
emit("");

// ── gc_tryon_sizes ─────────────────────────────────────────────────
emit("-- gc_tryon_sizes");
for (const [partId, sizes] of Object.entries(TRYON_SIZES_BY_PART)) {
  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    if (s.id === 0) continue;
    emit(`INSERT INTO catalog.gc_tryon_sizes (id, product_part_id, label, sort_order) VALUES (${s.id}, ${partId}, ${esc(s.label)}, ${i}) ON CONFLICT DO NOTHING;`);
  }
}
emit("");

// ── gc_design_option_categories, gc_design_options, gc_option_values ─
emit("-- Design options hierarchy");
const seenCategories = new Set<string>();
const seenOptions = new Set<string>();

for (const [partId, categories] of Object.entries(DESIGN_OPTIONS_BY_PART)) {
  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    const catKey = `${partId}_${cat.categoryId}_${ci}`;
    if (!seenCategories.has(catKey)) {
      seenCategories.add(catKey);
      emit(`INSERT INTO catalog.gc_design_option_categories (category_id, product_part_id, category_name, sort_order) VALUES (${cat.categoryId}, ${partId}, ${esc(cat.categoryName)}, ${ci}) ON CONFLICT DO NOTHING;`);
    }

    for (let oi = 0; oi < cat.options.length; oi++) {
      const opt = cat.options[oi];
      const optKey = `${partId}_${cat.categoryId}_${opt.optionId}`;
      if (!seenOptions.has(optKey)) {
        seenOptions.add(optKey);
        emit(`INSERT INTO catalog.gc_design_options (option_id, category_id, product_part_id, name, sort_order) VALUES (${opt.optionId}, ${cat.categoryId}, ${partId}, ${esc(opt.name)}, ${oi}) ON CONFLICT DO NOTHING;`);
      }

      for (let vi = 0; vi < opt.values.length; vi++) {
        const val = opt.values[vi];
        emit(`INSERT INTO catalog.gc_option_values (option_id, product_part_id, value_id, label, sort_order) VALUES (${opt.optionId}, ${partId}, ${esc(String(val.valueId))}, ${esc(val.label)}, ${vi}) ON CONFLICT DO NOTHING;`);
      }
    }
  }
}
emit("");

// ── gc_fit_tools ───────────────────────────────────────────────────
emit("-- gc_fit_tools");
for (const [partId, tools] of Object.entries(FIT_TOOLS_BY_PART)) {
  for (let i = 0; i < tools.length; i++) {
    const t = tools[i];
    const ddv = t.dropdownValues ? `ARRAY[${t.dropdownValues.map(v => esc(v)).join(",")}]` : "NULL";
    const ddids = t.dropdownValueIds ? `ARRAY[${t.dropdownValueIds.join(",")}]` : "NULL";
    emit(`INSERT INTO catalog.gc_fit_tools (product_part_id, name, input_type, default_value, step, min_val, max_val, dropdown_values, dropdown_value_ids, section, sort_order) VALUES (${partId}, ${esc(t.name)}, ${esc(t.inputType)}, ${esc(t.defaultValue)}, ${t.step}, ${t.min}, ${t.max}, ${ddv}, ${ddids}, ${esc(t.section)}, ${i}) ON CONFLICT DO NOTHING;`);
  }
}
emit("");

// ── gc_branding_positions ──────────────────────────────────────────
emit("-- gc_branding_positions and labels");
for (const [partId, positions] of Object.entries(BRANDING_POSITIONS_BY_PART)) {
  for (let pi = 0; pi < positions.length; pi++) {
    const pos = positions[pi];
    emit(`INSERT INTO catalog.gc_branding_positions (position_id, product_part_id, position_name, sort_order) VALUES (${pos.positionId}, ${partId}, ${esc(pos.positionName)}, ${pi}) ON CONFLICT DO NOTHING;`);
    for (let li = 0; li < pos.labels.length; li++) {
      const lbl = pos.labels[li];
      emit(`INSERT INTO catalog.gc_branding_labels (label_id, position_id, product_part_id, label_name, sort_order) VALUES (${lbl.labelId}, ${pos.positionId}, ${partId}, ${esc(lbl.labelName)}, ${li}) ON CONFLICT DO NOTHING;`);
    }
  }
}
emit("");

// ── gc_lining_color_map ────────────────────────────────────────────
emit("-- gc_lining_color_map (solid linings, group_id=2)");
const solidMap: Record<string, { id: number; code: string; name: string }> = {
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
for (const [keyword, lining] of Object.entries(solidMap)) {
  emit(`INSERT INTO catalog.gc_lining_color_map (color_keyword, lining_group_id, lining_id, lining_code, lining_name) VALUES (${esc(keyword)}, 2, ${lining.id}, ${esc(lining.code)}, ${esc(lining.name)}) ON CONFLICT DO NOTHING;`);
}
emit("");

emit("-- gc_lining_color_map (bemberg linings, group_id=3)");
const bembergMap: Record<string, { id: number; code: string; name: string }> = {
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
for (const [keyword, lining] of Object.entries(bembergMap)) {
  emit(`INSERT INTO catalog.gc_lining_color_map (color_keyword, lining_group_id, lining_id, lining_code, lining_name) VALUES (${esc(keyword)}, 3, ${lining.id}, ${esc(lining.code)}, ${esc(lining.name)}) ON CONFLICT DO NOTHING;`);
}
emit("");

// ── gc_validation_rules ────────────────────────────────────────────
emit("-- gc_validation_rules");
for (const vr of VALIDATION_RULES) {
  emit(`INSERT INTO catalog.gc_validation_rules (field, rule, message, condition) VALUES (${esc(vr.field)}, ${esc(vr.rule)}, ${esc(vr.message ?? null)}, ${esc(vr.condition ?? null)}) ON CONFLICT DO NOTHING;`);
}
emit("");

// ── gc_design_option_conflicts ─────────────────────────────────────
emit("-- gc_design_option_conflicts");
for (const c of DESIGN_OPTION_CONFLICTS) {
  const optA = JSON.stringify(c.optionA);
  const optB = JSON.stringify(c.optionB);
  emit(`INSERT INTO catalog.gc_design_option_conflicts (part_id, option_a, option_b, message) VALUES (${c.partId}, ${esc(optA)}, ${esc(optB)}, ${esc(c.message)}) ON CONFLICT DO NOTHING;`);
}
emit("");

emit("COMMIT;");
emit(`-- Total statements: ${lines.length}`);

const output = lines.join("\n");
const outPath = "supabase/seed-catalog.sql";
fs.writeFileSync(outPath, output, "utf-8");
console.log(`Wrote ${lines.length} lines to ${outPath}`);
