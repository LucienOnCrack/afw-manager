import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

type CatalogSource = "catalog" | "catalog_extracted";

function resolveSchema(request: NextRequest): CatalogSource {
  const source = request.nextUrl.searchParams.get("source");
  if (source === "legacy") return "catalog";
  return "catalog_extracted";
}

function groupBy<T>(rows: T[], keyFn: (r: T) => number): Record<number, T[]> {
  const result: Record<number, T[]> = {};
  for (const row of rows) {
    const key = keyFn(row);
    if (!result[key]) result[key] = [];
    result[key].push(row);
  }
  return result;
}

interface DbDesignOption {
  id: number;
  category_id: number;
  part_id: number;
  gc_select_id: string;
  name: string;
  sort_order: number;
}

interface DbOptionValue {
  design_option_id: number;
  value_id: string;
  label: string;
  sort_order: number;
}

interface DbBrandingPosition {
  id: number;
  part_id: number;
  position_id: number;
  position_name: string;
  gc_branding_labels: { label_id: number; label_name: string }[];
}

export async function GET(request: NextRequest) {
  const schemaName = resolveSchema(request);
  const sb = getServiceClient();
  const catalog = sb.schema(schemaName);

  // Supabase PostgREST caps at 1000 rows per request; paginate large tables
  const PAGE = 1000;
  async function fetchAll<T>(
    table: string,
    columns: string,
    orderCol?: string
  ): Promise<T[]> {
    const all: T[] = [];
    let offset = 0;
    while (true) {
      let q = catalog.from(table).select(columns, { count: "exact" as const }).range(offset, offset + PAGE - 1);
      if (orderCol) q = q.order(orderCol);
      const { data, count } = await q;
      if (data) all.push(...(data as T[]));
      const total = count ?? data?.length ?? 0;
      offset += PAGE;
      if (offset >= total || !data || data.length < PAGE) break;
    }
    return all;
  }

  const [
    { data: itemCombinations },
    { data: itemParts },
    { data: models },
    { data: makes },
    { data: canvasOptions },
    { data: liningModes },
    { data: buttons },
    { data: salesAssociates },
    { data: fitAdvise },
    { data: fits },
    tryonSizes,
    { data: optionCategories },
    { data: designOptions },
    optionValues,
    { data: fitTools },
    { data: brandingPositions },
    { data: designConflicts },
    { data: liningColorMap },
    { data: combinationVisibility },
    { data: itemTypeCategories },
    { data: itemTypeCategoryParts },
  ] = await Promise.all([
    catalog.from("gc_item_combinations").select("id, name").order("id"),
    catalog.from("gc_item_parts").select("item_id, part_id, part_name, sort_order").order("sort_order"),
    catalog.from("gc_models").select("id, part_id, name"),
    catalog.from("gc_makes").select("id, part_id, name, make_price_categories"),
    catalog.from("gc_canvas_options").select("value_id, label"),
    catalog.from("gc_lining_modes").select("id, name").order("id"),
    catalog.from("gc_buttons").select("trim_id, label, sort_order").order("sort_order"),
    catalog.from("gc_sales_associates").select("id, name"),
    catalog.from("gc_fit_advise").select("id, part_id, name"),
    catalog.from("gc_fits").select("id, part_id, name"),
    fetchAll<{ id: number; part_id: number; fit_id: number; label: string; value: string; sort_order: number; tryon_type: string | null }>("gc_tryon_sizes", "id, part_id, fit_id, label, value, sort_order, tryon_type", "sort_order"),
    catalog.from("gc_option_categories").select("id, part_id, category_name, is_monogram"),
    catalog.from("gc_design_options").select("id, category_id, part_id, gc_select_id, name, sort_order").order("sort_order"),
    fetchAll<DbOptionValue>("gc_option_values", "design_option_id, value_id, label, sort_order", "sort_order"),
    catalog.from("gc_fit_tools").select("*").order("sort_order"),
    catalog.from("gc_branding_positions").select("id, part_id, position_id, position_name, gc_branding_labels(label_id, label_name)"),
    catalog.from("gc_design_conflicts").select("*"),
    catalog.from("gc_lining_color_map").select("color_keyword, lining_group, lining_id, lining_code, lining_name"),
    catalog.from("gc_combination_visibility").select("item_id, part_ids, show_extra_lining"),
    catalog.from("gc_item_type_categories").select("id, name, description, sort_order, field_config").order("sort_order"),
    catalog.from("gc_item_type_category_parts").select("category_id, part_id"),
  ]);

  // Shape item parts by item_id
  const productPartsByItem: Record<number, { id: number; name: string }[]> = {};
  for (const p of itemParts ?? []) {
    if (!productPartsByItem[p.item_id]) productPartsByItem[p.item_id] = [];
    productPartsByItem[p.item_id].push({ id: p.part_id, name: p.part_name });
  }

  // Group simple lookups by part_id
  const modelsByPart = groupBy(
    (models ?? []).map((m) => ({ id: m.id, name: m.name, part_id: m.part_id })),
    (r) => r.part_id
  );
  const makesByPart = groupBy(
    (makes ?? []).map((m) => ({ id: m.id, name: m.name, part_id: m.part_id, makePriceCategories: m.make_price_categories ?? null })),
    (r) => r.part_id
  );
  const fitAdviseByPart = groupBy(
    (fitAdvise ?? []).map((f) => ({ id: f.id, name: f.name, part_id: f.part_id })),
    (r) => r.part_id
  );
  const fitsByPart = groupBy(
    (fits ?? []).map((f) => ({ id: f.id, name: f.name, part_id: f.part_id })),
    (r) => r.part_id
  );
  const tryonSizesByPart = groupBy(
    (tryonSizes ?? []).map((s) => ({ id: parseInt(s.value, 10) || s.id, label: s.label, part_id: s.part_id, fitId: s.fit_id, tryonType: s.tryon_type })),
    (r) => r.part_id
  );

  // Group option values by design_option_id (fetched separately to avoid 1000-row nested limit)
  const valsByOptionId = new Map<number, DbOptionValue[]>();
  for (const v of (optionValues ?? []) as DbOptionValue[]) {
    if (!valsByOptionId.has(v.design_option_id)) valsByOptionId.set(v.design_option_id, []);
    valsByOptionId.get(v.design_option_id)!.push(v);
  }

  // Shape design options into the nested category structure the wizard expects
  const designOptionsByPart: Record<number, { categoryId: number; categoryName: string; isMonogram: boolean; options: { optionId: number; name: string; values: { valueId: number | string; label: string }[] }[] }[]> = {};
  const catMap = new Map((optionCategories ?? []).map((c) => [`${c.part_id}_${c.id}`, { name: c.category_name, isMonogram: c.is_monogram ?? false }]));

  for (const opt of (designOptions ?? []) as DbDesignOption[]) {
    if (!designOptionsByPart[opt.part_id]) designOptionsByPart[opt.part_id] = [];
    let cat = designOptionsByPart[opt.part_id].find((c) => c.categoryId === opt.category_id);
    if (!cat) {
      const catInfo = catMap.get(`${opt.part_id}_${opt.category_id}`);
      cat = {
        categoryId: opt.category_id,
        categoryName: catInfo?.name ?? "",
        isMonogram: catInfo?.isMonogram ?? false,
        options: [],
      };
      designOptionsByPart[opt.part_id].push(cat);
    }
    const rawVals = valsByOptionId.get(opt.id) ?? [];
    rawVals.sort((a, b) => a.sort_order - b.sort_order);
    const vals = rawVals.map((v) => {
      const numId = Number(v.value_id);
      return { valueId: isNaN(numId) ? v.value_id : numId, label: v.label };
    });
    const gcOptionId = parseInt(opt.gc_select_id?.replace(/\D/g, "") ?? "", 10) || opt.id;
    cat.options.push({ optionId: gcOptionId, name: opt.name, values: vals });
  }

  // Classify fit tool into section based on name patterns (matches GoCreate's server-rendered groupings)
  const PART_NAMES: Record<number, string> = {};
  for (const p of itemParts ?? []) PART_NAMES[p.part_id] = p.part_name;

  function classifyFitToolSection(name: string, partId: number): string {
    const n = name.toLowerCase();
    if (n.includes("posture") || n.includes("collar") || n.includes("shoulder")) return "Posture";
    if (/\brise\b/.test(n)) return "Posture";
    if (/½.*(waist|hip|chest|back|seat|thigh|knee|hem|skirt|centre|cuff|arm)|upper arm/.test(n)) return "Circumference";
    if (/\b(lengthen|shorten)\b.*(front|length|sleeve|leg|morning)/i.test(n)) return "Length";
    return `Others ${PART_NAMES[partId]?.toLowerCase() ?? ""}`.trim();
  }

  // Shape fit tools
  const fitToolsByPart: Record<number, { name: string; inputType: string; defaultValue: string; fitId: number; step: number; min: number; max: number; dropdownValues?: string[]; section: string }[]> = {};
  for (const t of fitTools ?? []) {
    if (!fitToolsByPart[t.part_id]) fitToolsByPart[t.part_id] = [];
    fitToolsByPart[t.part_id].push({
      name: t.name,
      inputType: t.input_type,
      defaultValue: t.default_val ?? "0",
      fitId: t.fit_id ?? 0,
      step: Number(t.step_val ?? 0),
      min: Number(t.min_val ?? 0),
      max: Number(t.max_val ?? 0),
      dropdownValues: t.options ?? undefined,
      section: classifyFitToolSection(t.name, t.part_id),
    });
  }

  // Shape branding positions
  const brandingPositionsByPart: Record<number, { positionId: number; positionName: string; labels: { labelId: number; labelName: string }[] }[]> = {};
  for (const pos of (brandingPositions ?? []) as DbBrandingPosition[]) {
    if (!brandingPositionsByPart[pos.part_id]) brandingPositionsByPart[pos.part_id] = [];
    brandingPositionsByPart[pos.part_id].push({
      positionId: pos.position_id,
      positionName: pos.position_name,
      labels: (pos.gc_branding_labels ?? []).map((l) => ({ labelId: l.label_id, labelName: l.label_name })),
    });
  }

  // Shape conflicts
  const conflicts = (designConflicts ?? []).map((c) => ({
    partId: c.part_id,
    optionA: { optionId: c.option_a_id, name: c.option_a_name, valueIds: c.option_a_value_ids, valueLabel: c.option_a_label },
    optionB: { optionId: c.option_b_id, name: c.option_b_name, valueIds: c.option_b_value_ids, valueLabel: c.option_b_label },
    message: c.message,
  }));

  // Shape lining color map
  const liningColorMapShaped: { solid: Record<string, { id: number; code: string; name: string }>; bemberg: Record<string, { id: number; code: string; name: string }> } = { solid: {}, bemberg: {} };
  for (const row of liningColorMap ?? []) {
    const entry = { id: row.lining_id, code: row.lining_code, name: row.lining_name };
    if (row.lining_group === 2) liningColorMapShaped.solid[row.color_keyword] = entry;
    else liningColorMapShaped.bemberg[row.color_keyword] = entry;
  }

  // Shape combination visibility
  const combinationVisibilityShaped: Record<number, { parts: number[]; showExtraLining: boolean }> = {};
  for (const row of combinationVisibility ?? []) {
    combinationVisibilityShaped[row.item_id] = { parts: row.part_ids, showExtraLining: row.show_extra_lining };
  }

  // Build category → part set
  const catPartSets = new Map<number, Set<number>>();
  for (const cp of itemTypeCategoryParts ?? []) {
    if (!catPartSets.has(cp.category_id)) catPartSets.set(cp.category_id, new Set());
    catPartSets.get(cp.category_id)!.add(cp.part_id);
  }

  // Match items to categories: an item belongs to a category if ALL its parts are in the category's part set
  const itemPartSets = new Map<number, Set<number>>();
  for (const p of itemParts ?? []) {
    if (!itemPartSets.has(p.item_id)) itemPartSets.set(p.item_id, new Set());
    itemPartSets.get(p.item_id)!.add(p.part_id);
  }

  const itemTypeCategoriesShaped = (itemTypeCategories ?? []).map((cat) => {
    const catParts = catPartSets.get(cat.id) ?? new Set<number>();
    const items: { id: number; name: string }[] = [];
    for (const combo of itemCombinations ?? []) {
      const comboParts = itemPartSets.get(combo.id);
      if (!comboParts || comboParts.size === 0) continue;
      const allInCategory = [...comboParts].every((pid) => catParts.has(pid));
      if (allInCategory) items.push({ id: combo.id, name: combo.name });
    }
    const raw = (cat as Record<string, unknown>).field_config;
    const fc = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown> | null;
    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      sortOrder: cat.sort_order,
      partIds: [...catParts],
      items,
      fieldConfig: {
        showCanvas: (fc?.showCanvas as boolean) ?? false,
        showLiningMode: (fc?.showLiningMode as boolean) ?? false,
        showLining: (fc?.showLining as boolean) ?? false,
        showButtons: (fc?.showButtons as boolean) ?? false,
        showFabricSearch: (fc?.showFabricSearch as boolean) ?? true,
        materialDesignOptionNames: (fc?.materialDesignOptionNames as string[]) ?? [],
        isShoeOrder: (fc?.isShoeOrder as boolean) ?? false,
      },
    };
  });

  const data = {
    _source: schemaName,
    itemCombinations: itemCombinations ?? [],
    productPartsByItem,
    modelsByPart,
    makesByPart,
    canvasOptions: (canvasOptions ?? []).map((c) => ({ valueId: c.value_id, label: c.label })),
    liningModes: liningModes ?? [],
    buttonOptions: (buttons ?? []).map((b) => ({ trimId: b.trim_id, label: b.label })),
    salesAssociates: salesAssociates ?? [],
    fitAdviseByPart,
    fitsByPart,
    tryonSizesByPart,
    designOptionsByPart,
    fitToolsByPart,
    brandingPositionsByPart,
    designOptionConflicts: conflicts,
    liningColorMap: liningColorMapShaped,
    combinationVisibility: combinationVisibilityShaped,
    itemTypeCategories: itemTypeCategoriesShaped,
  };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}
