// GoCreate product catalog – types, pure functions, and CatalogData interface.
// All hardcoded data has been moved to the `catalog` schema in Supabase.
// Use the /api/catalog endpoint (or useCatalog hook) to fetch at runtime.

// ── Types ────────────────────────────────────────────────────────────────────

export interface ItemCombination {
  id: number;
  name: string;
}

export interface ProductPart {
  id: number;
  name: string;
}

export interface MakeOption {
  id: number;
  name: string;
  makePriceCategories?: string | null;
}

export interface ModelOption {
  id: number;
  name: string;
}

export interface ButtonOption {
  trimId: number;
  label: string;
}

export interface FitAdviseOption {
  id: number;
  name: string;
}

export interface FitOption {
  id: number;
  name: string;
}

export interface TryOnSize {
  id: number;
  label: string;
  fitId: number;
  tryonType: string | null;
}

export interface OptionValue {
  valueId: number | string;
  label: string;
}

export interface DesignOption {
  optionId: number;
  name: string;
  values: OptionValue[];
}

export interface OptionCategory {
  categoryId: number;
  categoryName: string;
  isMonogram: boolean;
  options: DesignOption[];
}

export type FitToolInputType = "numeric" | "dropdown" | "checkbox";

export interface FitToolDef {
  name: string;
  inputType: FitToolInputType;
  defaultValue: string;
  fitId: number;
  step: number;
  min: number;
  max: number;
  dropdownValues?: string[];
  section: string;
}

export interface BrandingLabel {
  labelId: number;
  labelName: string;
}

export interface BrandingPosition {
  positionId: number;
  positionName: string;
  labels: BrandingLabel[];
}

export interface ResolvedLining {
  id: number;
  code: string;
  name: string;
}

export interface DesignOptionConflict {
  partId: number;
  optionA: { optionId: number; name: string; valueIds: (string | number)[]; valueLabel: string };
  optionB: { optionId: number; name: string; valueIds: (string | number)[]; valueLabel: string };
  message: string;
}

// ── CatalogData – the shape returned by /api/catalog ─────────────────────────

export interface CategoryFieldConfig {
  showCanvas: boolean;
  showLiningMode: boolean;
  showLining: boolean;
  showButtons: boolean;
  showFabricSearch: boolean;
  materialDesignOptionNames: string[];
  isShoeOrder: boolean;
}

export interface ItemTypeCategory {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  partIds: number[];
  items: ItemCombination[];
  fieldConfig: CategoryFieldConfig;
}

export interface CatalogData {
  itemCombinations: ItemCombination[];
  productPartsByItem: Record<number, ProductPart[]>;
  modelsByPart: Record<number, (ModelOption & { part_id: number })[]>;
  makesByPart: Record<number, (MakeOption & { part_id: number })[]>;
  canvasOptions: { valueId: number; label: string }[];
  liningModes: { id: number; name: string }[];
  buttonOptions: ButtonOption[];
  salesAssociates: { id: number; name: string }[];
  fitAdviseByPart: Record<number, (FitAdviseOption & { part_id: number })[]>;
  fitsByPart: Record<number, (FitOption & { part_id: number })[]>;
  tryonSizesByPart: Record<number, (TryOnSize & { part_id: number })[]>;
  designOptionsByPart: Record<number, OptionCategory[]>;
  fitToolsByPart: Record<number, FitToolDef[]>;
  brandingPositionsByPart: Record<number, BrandingPosition[]>;
  designOptionConflicts: DesignOptionConflict[];
  liningColorMap: {
    solid: Record<string, ResolvedLining>;
    bemberg: Record<string, ResolvedLining>;
  };
  combinationVisibility: Record<number, { parts: number[]; showExtraLining: boolean }>;
  itemTypeCategories: ItemTypeCategory[];
}

// ── Pure utility functions (accept catalog data as parameter) ────────────────

const SOLID_DEFAULT: ResolvedLining = { id: 687, code: "2050", name: "2050 mid grey" };
const BEMBERG_DEFAULT: ResolvedLining = { id: 566, code: "100 Bemberg", name: "100 Bemberg dark grey" };

/**
 * Resolve the best-match lining for a fabric name + lining group.
 * Accepts the lining color map from catalog data. Falls back to defaults.
 */
export function resolveBestMatchLining(
  fabricName: string,
  liningGroupId: 2 | 3,
  liningColorMap?: CatalogData["liningColorMap"]
): ResolvedLining {
  const map = liningGroupId === 2
    ? (liningColorMap?.solid ?? {})
    : (liningColorMap?.bemberg ?? {});
  const fallback = liningGroupId === 2 ? SOLID_DEFAULT : BEMBERG_DEFAULT;
  const lower = fabricName.toLowerCase();
  const keywords = Object.keys(map).sort((a, b) => b.length - a.length);

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      return map[keyword] ?? fallback;
    }
  }
  return fallback;
}

/**
 * Check selected design options for a given part against known conflict rules.
 * Returns an array of human-readable conflict messages.
 */
export function checkDesignOptionConflicts(
  partId: number,
  selectedOptions: Record<number, { valueId: string | number; label: string }>,
  conflicts?: DesignOptionConflict[]
): string[] {
  if (!conflicts) return [];
  const messages: string[] = [];
  for (const rule of conflicts) {
    if (rule.partId !== partId) continue;
    const selA = selectedOptions[rule.optionA.optionId];
    const selB = selectedOptions[rule.optionB.optionId];
    if (!selA || !selB) continue;
    const aMatch = rule.optionA.valueIds.some((v) => String(v) === String(selA.valueId));
    const bMatch = rule.optionB.valueIds.some((v) => String(v) === String(selB.valueId));
    if (aMatch && bMatch) {
      messages.push(
        `DesignOption '${selA.label}' from '${rule.optionA.name}' can not be combined with DesignOption '${selB.label}' from '${rule.optionB.name}'`
      );
    }
  }
  return messages;
}

/**
 * Get unique fit tool sections for a given part's tools.
 */
export function getFitToolSections(tools: FitToolDef[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of tools) {
    if (!seen.has(t.section)) {
      seen.add(t.section);
      result.push(t.section);
    }
  }
  return result;
}
