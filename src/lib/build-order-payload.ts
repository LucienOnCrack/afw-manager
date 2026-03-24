import type {
  DesignOptionValue,
  FitToolEntry,
  ProductDataEntry,
  OrderCreateData,
  BrandingOptionData,
  MonogramData,
  IdAndName,
  CustomerInfo,
} from "@/lib/types";
import type { CatalogData, ProductPart } from "@/lib/gocreate-catalog";
import { resolveBestMatchLining } from "@/lib/gocreate-catalog";

export interface WizardStateForPayload {
  customer: CustomerInfo | null;
  itemType: IdAndName | null;
  quantity: number;
  salesPersonId: number | null;
  modelByPart: Record<number, number>;
  makeByPart: Record<number, number>;
  canvasByPart: Record<number, number>;
  liningMode: number;
  buttonTrimId: number | null;
  fabric: { Id: number; Name: string; label: string; imageUrl?: string; priceCategories?: string; cutLength?: boolean } | null;
  lining: { Id: number; Name: string; label: string; imageUrl?: string } | null;
  extraLining: { Id: number; Name: string; label: string } | null;
  shopOrderNumber: string;
  occasion: string;
  extraTrouserAddOn: boolean;
  partFit: Record<number, {
    fitProfileId: number;
    fitProfileName: string;
    fitId: number;
    tryOnId: number;
    leftTryOnId?: number;
    rightTryOnId?: number;
    fitToolValues: Record<string, string>;
  }>;
  partDesign: Record<number, {
    selectedOptions: Record<number, { valueId: number | string; label: string }>;
  }>;
  monogramEnabled: boolean;
  monogram: MonogramData;
  brandingEntries: BrandingOptionData[];
  showSize: boolean;
  skipWarnings: boolean;
}

function formatDate(d: Date): string {
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

export function buildGoCreatePayload(
  state: WizardStateForPayload,
  parts: ProductPart[],
  catalog: CatalogData
): OrderCreateData {
  const productData: ProductDataEntry[] = parts.map((p) => {
    const pf = state.partFit[p.id];
    const pd = state.partDesign[p.id];
    const fitToolData: FitToolEntry[] = [];

    // Resolve fit: use user selection, fall back to first (or only) fit from catalog
    const catalogFits = catalog.fitsByPart[p.id] ?? [];
    const fitId = pf?.fitId || catalogFits[0]?.id || 0;

    // Resolve tryon: use user selection, fall back to first tryon matching this fit
    const catalogTryons = catalog.tryonSizesByPart[p.id] ?? [];
    const fitTryons = fitId > 0 ? catalogTryons.filter((t) => t.fitId === fitId) : catalogTryons;
    const tryonId = pf?.tryOnId || fitTryons[0]?.id || 0;

    // Resolve fit profile name: use user selection, generate default "[PartName] DD-MMM-YYYY"
    const fitProfileName = pf?.fitProfileName || `[${p.name}] ${formatDate(new Date())}`;

    const fitValues = pf?.fitToolValues ?? {};
    const allPartTools = catalog.fitToolsByPart[p.id] ?? [];
    const partTools = fitId > 0 ? allPartTools.filter((t) => t.fitId === fitId || t.fitId === 0) : allPartTools;

    for (const tool of partTools) {
      const val = fitValues[tool.name] ?? tool.defaultValue;
      if (val !== "0" && val !== "standard" && val !== "no" && val !== "without") {
        fitToolData.push({ Id: 0, Name: tool.name, Value: parseFloat(val) || 0 });
      }
    }

    const designOptions: DesignOptionValue[] = [];
    const categories = catalog.designOptionsByPart[p.id] ?? [];
    for (const cat of categories) {
      for (const opt of cat.options) {
        const sel = pd?.selectedOptions[opt.optionId];
        if (sel) {
          designOptions.push({
            Name: opt.name,
            Value: sel.label,
            OptionId: opt.optionId,
            OptionValueId: sel.valueId,
            TrimMasterId: 0,
            LiningId: 0,
            IsForTrim: false,
          });
        }
      }
    }

    const brandingForPart = state.brandingEntries.length > 0 && catalog.brandingPositionsByPart[p.id]
      ? state.brandingEntries.filter((b: BrandingOptionData) => b.LabelId > 0 && b.PositionId > 0)
      : [];

    const canvasVal = state.canvasByPart[p.id];
    const hasMonogram = state.monogramEnabled && (catalog.designOptionsByPart[p.id] ?? []).some(
      (c) => c.categoryName.toLowerCase().includes("monogram") && !c.categoryName.toLowerCase().includes("position")
    );

    const entry: ProductDataEntry = {
      ProductPartId: p.id,
      StyleOrderNumber: "",
      ModelId: state.modelByPart[p.id] ?? catalog.modelsByPart[p.id]?.[0]?.id,
      MakeId: state.makeByPart[p.id] ?? catalog.makesByPart[p.id]?.[0]?.id ?? 0,
      CanvasId: canvasVal != null ? canvasVal : undefined,
      FitAndTryOnData: {
        FitProfileId: pf?.fitProfileId || 0,
        FitId: fitId,
        TryonId: tryonId,
        FitProfileName: fitProfileName,
        FitToolData: fitToolData,
      },
      DesignOptions: designOptions.length > 0 ? designOptions : undefined,
      MonogramData: hasMonogram ? [state.monogram] : undefined,
      BrandingOptionData: brandingForPart,
    };
    return entry;
  });

  const fabricPayload = state.fabric
    ? { Id: state.fabric.Id, Name: state.fabric.Name }
    : undefined;

  let liningPayload: { Id: number; Name: string } | undefined;
  if (state.liningMode === 1 && state.lining) {
    liningPayload = { Id: state.lining.Id, Name: state.lining.Name };
  } else if (state.liningMode !== 1 && state.fabric) {
    const rl = resolveBestMatchLining(state.fabric.Name, state.liningMode as 2 | 3, catalog.liningColorMap);
    liningPayload = { Id: rl.id, Name: rl.name };
  }

  return {
    CustomerId: state.customer?.Id ?? 0,
    Status: "On hold",
    Item: state.itemType ?? { Id: 0, Name: "" },
    Quantity: state.quantity,
    SalesPersonId: state.salesPersonId ?? undefined,
    TrimId: state.buttonTrimId ?? undefined,
    Fabric: fabricPayload,
    Lining: liningPayload,
    LiningGroupId: state.liningMode !== 1 ? state.liningMode : undefined,
    ExtraLining: state.extraLining ? { Id: state.extraLining.Id, Name: state.extraLining.Name } : undefined,
    ExtraTrouserAddOn: state.extraTrouserAddOn,
    ShowSize: state.showSize,
    Occasion: state.occasion || "",
    ShopOrderNumber: state.shopOrderNumber || "",
    SkipWarnings: state.skipWarnings,
    ProductData: productData.length > 0 ? productData : undefined,
  };
}
