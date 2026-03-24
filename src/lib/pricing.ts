import type { GarmentPrice, Surcharge } from "@/lib/types";

export interface PricingData {
  priceMap: Record<string, GarmentPrice[]>;
  surcharges: Record<string, Surcharge[]>;
  eurToGbp: number;
}

export interface SurchargeLineItem {
  label: string;
  costEur: number;
  costGbp: number;
  saleGbp: number;
}

export interface PriceBreakdown {
  baseCostEur: number | null;
  costEur: number | null;
  costGbp: number | null;
  salePrice: number;
  construction: string;
  priceCategory: string;
  garmentType: string;
  liningUpchargeEur: number;
  liningUpchargeGbp: number;
  buttonUpchargeEur: number;
  buttonUpchargeGbp: number;
  surchargeItems: SurchargeLineItem[];
  totalSurchargesEur: number;
  totalSurchargesGbp: number;
  totalSurchargesSaleGbp: number;
  quantity: number;
  subtotalSale: number;
  vat: number;
  total: number;
  eurToGbp: number;
  missingPricing: boolean;
}

const VAT_RATE = 0.20;
const SALE_MARKUP = 3.35;
const ROUND_TO = 5;

export function eurToRrp(eur: number, rate: number): number {
  return Math.ceil((eur * rate * SALE_MARKUP) / ROUND_TO) * ROUND_TO;
}

export function makeToConstruction(makeName: string): string {
  const lower = makeName.toLowerCase();
  if (lower.includes("handmade")) return "Handmade";
  if (lower.includes("full canvas")) return "Full Canvas";
  return "Half Canvas";
}

const LINING_SURCHARGE_NAMES: Record<string, string> = {
  "bemberg": "Lining - Bemberg",
  "fancy": "Lining - Fancy, pin-up and wedding",
};

const BUTTON_SURCHARGE_KEYWORDS = [
  "buttons - horn", "buttons - mother of pearl", "buttons - corozo",
  "buttons - galalith", "buttons - bengala", "buttons - blazer", "buttons - fabric",
];

// ── Design Option → Surcharge Mapping ────────────────────────────────────────
// Maps every design option name (lowercased) that can trigger a surcharge.
// Resolver receives value label + part name, returns the exact surcharge name from the DB.

type SurchargeResolver = (valueLabel: string, partName: string) => string | null;

const COAT_PARTS = new Set(["Overcoat", "Pea coat", "Coat"]);

function isNonDefault(label: string): boolean {
  const l = label.toLowerCase();
  return l !== "none" && l !== "no" && l !== "standard" && l !== "best match" &&
    l !== "no contrast" && l !== "no buttonhole" && l !== "n/a" &&
    !l.startsWith("n/a") && l !== "same as fabric" && l !== "same as body lining" &&
    l !== "same as body" && l !== "stripe lining" && l !== "without" &&
    l !== "7mm top stitching" && l !== "2mm top stitching" && l !== "1mm refined top stitching";
}

const DESIGN_OPTION_SURCHARGE_MAP: Record<string, SurchargeResolver> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // JACKET / INFORMAL JACKET / OVERCOAT / PEACOAT SURCHARGES
  // ═══════════════════════════════════════════════════════════════════════════

  "pick stitching (amf)": (val, part) => {
    const v = val.toLowerCase();
    if (v.includes("doppio impuntura") || v.includes("double pick stitch")) {
      if (part === "Trousers" || part === "Bermuda") return "Trousers - doppio impuntura (double pick stitch)";
      if (part === "Waistcoat") return "Waistcoat - doppio impuntura (double pick stitch)";
      return "Jacket - doppio impuntura (double pick stitch)";
    }
    if (v.includes("extensive")) {
      if (part === "Trousers" || part === "Bermuda") return "Trousers - pick stitching (AMF)";
      if (COAT_PARTS.has(part)) return "Overcoat, Peacoat & Carcoat - extensive pick stitching";
      return "Jacket - extensive pick stitching (full AMF)";
    }
    if (v.includes("2 mm") || v.includes("6 mm") || v.includes("2mm") || v.includes("6mm")) {
      if (part === "Trousers" || part === "Bermuda") return "Trousers - pick stitching (AMF)";
    }
    return null;
  },

  "edge stitching": (val, part) => {
    const v = val.toLowerCase();
    if (!COAT_PARTS.has(part)) return null;
    if (v.includes("pick stitching") || v.includes("amf")) {
      return "Overcoat, Peacoat & Carcoat - extensive pick stitching";
    }
    return null;
  },

  "contrast edge stitching": (val) => {
    if (!isNonDefault(val)) return null;
    return "Jacket - contrast pick stitching (AMF)";
  },

  "contrast pick stitching (amf)": (val) => {
    if (!isNonDefault(val)) return null;
    return "Jacket - contrast pick stitching (AMF)";
  },

  "contrast 1st buttonhole sleeve": (val, part) => {
    if (!isNonDefault(val)) return null;
    if (COAT_PARTS.has(part)) return "Overcoat & Peacoat - contrast (first) sleeve buttonhole";
    return "Jacket - contrast (first) sleeve buttonhole";
  },

  "contrast lapel buttonhole": (val) => {
    if (!isNonDefault(val)) return null;
    return "Jacket - contrast lapel buttonhole";
  },

  "contrast front buttonholes": (val) => {
    if (!isNonDefault(val)) return null;
    return "Jacket - contrast front buttonholes";
  },

  "contrast sleeve buttonholes": (val) => {
    if (!isNonDefault(val)) return null;
    return "Jacket - contrast (first) sleeve buttonhole";
  },

  "contrast buttonholes": (val, part) => {
    if (!isNonDefault(val)) return null;
    if (part === "Shirt") return "Contrast buttonholes list";
    if (part === "Waistcoat") return null;
    if (part === "Trousers" || part === "Bermuda") return null;
    return "Jacket - contrast front buttonholes";
  },

  "contrast top collar": (val, part) => {
    if (!isNonDefault(val)) return null;
    if (COAT_PARTS.has(part)) return "Overcoat & Peacoat - contrast top collar";
    return null;
  },

  "hidden lining pocket": (val, part) => {
    const v = val.toLowerCase();
    if (v !== "yes") return null;
    if (COAT_PARTS.has(part)) return "Overcoat & Peacoat - hidden lining pocket";
    return "Jacket - hidden lining pocket (mobile phone)";
  },

  "lapel buttonhole type": (val, part) => {
    const v = val.toLowerCase();
    if (v === "handmade") return "Jacket - lapel buttonhole by hand";
    if (v === "milanese" || v === "long milanese") {
      if (COAT_PARTS.has(part)) return "Overcoat & Peacoat - lapel buttonhole milanese";
      return "Jacket - lapel buttonhole milanese (long)";
    }
    if (v === "neapolitan") return "Jacket - lapel buttonhole neapolitan";
    return null;
  },

  "elbow patches": (val, part) => {
    if (!isNonDefault(val)) return null;
    if (part === "Shirt") return "Elbow patches";
    return "Elbow patches - alcantara, fabric";
  },

  "lining style": (val, part) => {
    const v = val.toLowerCase();
    if (v === "unlined" || v === "without lining" || v === "no lining") {
      if (COAT_PARTS.has(part)) return "Overcoat, Peacoat & Carcoat - unlined";
      return "Jacket - unlined (Made in Italy)";
    }
    return null;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TUXEDO SURCHARGES
  // ═══════════════════════════════════════════════════════════════════════════

  "tuxedo (lapel & jets)": (val) => {
    if (!isNonDefault(val)) return null;
    return "Tuxedo - Satin/ottoman (Made in Italy)";
  },

  "tuxedo (jets)": (val) => {
    if (!isNonDefault(val)) return null;
    return "Tuxedo - Satin/ottoman (Made in Italy)";
  },

  "tuxedo (side stripe)": (val) => {
    if (!isNonDefault(val)) return null;
    return "Tuxedo - Satin/ottoman (Made in Italy)";
  },

  "tuxedo waistband": (val) => {
    if (!isNonDefault(val)) return null;
    return "Tuxedo - Satin/ottoman (Made in Italy)";
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TROUSER / BERMUDA SURCHARGES
  // ═══════════════════════════════════════════════════════════════════════════

  "waistband detailing": (val) => {
    if (val.toLowerCase().includes("high waistband")) return "Trousers - High waistband";
    return null;
  },

  "buckle loop": (val) => {
    if (val.toLowerCase() === "yes") return "Trousers - buckle & strap";
    return null;
  },

  "closure": (val, part) => {
    const v = val.toLowerCase();
    if (v.includes("button & tab")) return "Trousers - button & tab";
    if (part === "Trousers" || part === "Bermuda") {
      if (v.includes("button fly")) return "Trousers - button fly (Made in Italy)";
    }
    return null;
  },

  "others trouser": (val) => {
    if (val.toLowerCase() === "with") return "Trousers - Sartorial waistband (P.Price)";
    return null;
  },

  "cargo pockets": (val) => {
    if (!isNonDefault(val)) return null;
    return "Chino - Cargo pocket";
  },

  "pocket lining": (val) => {
    const v = val.toLowerCase();
    if (v.includes("tpc004") || v.includes("tpc005") || v.includes("tpc006") ||
        v.includes("tpc007") || v.includes("tpc008") || v.includes("tpc009") ||
        v.includes("dark blue") || v.includes("l.blue") || v.includes("grey m") ||
        v.includes("dark green") || v.includes("brown") || v.includes("sand m")) {
      return "Fancy pocketing";
    }
    return null;
  },

  "pintuck": (val) => {
    if (val.toLowerCase() === "yes") return "Trousers - Sartorial waistband (P.Price)";
    return null;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIRT SURCHARGES
  // ═══════════════════════════════════════════════════════════════════════════

  "contrast button placket": (val) => {
    if (!isNonDefault(val)) return null;
    return "Contrast button placket";
  },

  "contrast collar & collar stand": (val) => {
    if (!isNonDefault(val)) return null;
    return "Contrast collar & collar stand";
  },

  "contrast cuff": (val) => {
    if (!isNonDefault(val)) return null;
    return "Contrast cuff";
  },

  "contrast inside collar stand": (val) => {
    if (!isNonDefault(val)) return null;
    return "Contrast inside collar stand";
  },

  "contrast inside cuff": (val) => {
    if (!isNonDefault(val)) return null;
    return "Contrast inside cuff";
  },

  "contrast inside collar & inside cuff": (val) => {
    if (!isNonDefault(val)) return null;
    return "Contrast inside collar stand";
  },

  "contrast sleeve vent": (val) => {
    if (!isNonDefault(val)) return null;
    return "Contrast sleeve vent";
  },

  "contrast button attachment": (val) => {
    if (!isNonDefault(val)) return null;
    return null; // no direct surcharge for thread colour
  },

  "contrast topstitching collar & cuff": () => {
    return null; // no direct surcharge, included in shirt price
  },

  "pocket square": (val, part) => {
    if (part !== "Shirt") return null;
    if (!isNonDefault(val)) return null;
    return "Pocket square";
  },

  "pre-washed": (val) => {
    if (val.toLowerCase() === "yes") return "Pre-washed";
    return null;
  },

  "back style": (val, part) => {
    if (part !== "Shirt") return null;
    const v = val.toLowerCase();
    if (v.includes("small pleats")) return "Small pleats";
    return null;
  },

  "sleeve style": (val, part) => {
    if (part !== "Shirt") return null;
    const v = val.toLowerCase();
    if (v.includes("pleated shoulder") || v.includes("pleated shoulder & cuff")) {
      return "Long sleeves with pleated shoulder & cuff";
    }
    return null;
  },

  "button attachment": (val, part) => {
    if (part !== "Shirt") return null;
    const v = val.toLowerCase();
    if (v.includes("by hand") || v.includes("handmade")) return "Handmade";
    return null;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COAT / OVERCOAT SURCHARGES
  // ═══════════════════════════════════════════════════════════════════════════

  "hood": (val) => {
    if (val.toLowerCase() === "yes") return "Carcoat - hood";
    return null;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOE SURCHARGES
  // ═══════════════════════════════════════════════════════════════════════════

  "shoe trees": (val) => {
    if (val.toLowerCase() === "yes") return "Shoe tree";
    return null;
  },
};

// ── Section Resolver ─────────────────────────────────────────────────────────
// Given a part name and surcharge name, returns the DB section to look up the surcharge in.

function getSurchargeSection(partName: string, surchargeName: string): string {
  const sn = surchargeName.toLowerCase();

  const SHIRT_SURCHARGES = new Set([
    "contrast button placket", "contrast collar & collar stand",
    "contrast cuff", "contrast inside collar stand", "contrast inside cuff",
    "contrast sleeve vent", "pocket square", "pre-washed", "elbow patches",
    "contrast buttonholes list", "small pleats",
    "long sleeves with pleated shoulder & cuff", "handmade",
  ]);
  if (SHIRT_SURCHARGES.has(sn)) return "Shirts";
  if (sn === "chino - cargo pocket" || sn === "fancy pocketing" || sn === "comfort waistband") {
    return "Pants";
  }
  if (sn.startsWith("carcoat") || sn.startsWith("overcoat") || sn === "lining - quilted") {
    return "Coats";
  }
  if (COAT_PARTS.has(partName)) return "Coats";
  if (sn.startsWith("shoe tree")) {
    if (partName === "City loafer") return "Shoes (Portugal)";
    return "Shoes (Italy)";
  }
  return "Suits";
}

export interface DesignOptionForPricing {
  optionName: string;
  valueLabel: string;
  partName: string;
}

export function computePricing({
  priceCategory,
  garmentTypeName,
  makeName,
  liningType,
  buttonLabel,
  quantity,
  pricing,
  designOptions,
  monogramEnabled,
  monogramLineCount,
}: {
  priceCategory: string | null;
  garmentTypeName: string | null;
  makeName: string | null;
  liningType: "solid" | "bemberg" | "manual" | "fancy" | null;
  buttonLabel: string | null;
  quantity: number;
  pricing: PricingData | null;
  designOptions?: DesignOptionForPricing[];
  monogramEnabled?: boolean;
  monogramLineCount?: number;
}): PriceBreakdown {
  const empty: PriceBreakdown = {
    baseCostEur: null,
    costEur: null,
    costGbp: null,
    salePrice: 0,
    construction: "",
    priceCategory: priceCategory ?? "",
    garmentType: garmentTypeName ?? "",
    liningUpchargeEur: 0,
    liningUpchargeGbp: 0,
    buttonUpchargeEur: 0,
    buttonUpchargeGbp: 0,
    surchargeItems: [],
    totalSurchargesEur: 0,
    totalSurchargesGbp: 0,
    totalSurchargesSaleGbp: 0,
    quantity,
    subtotalSale: 0,
    vat: 0,
    total: 0,
    eurToGbp: pricing?.eurToGbp ?? 0,
    missingPricing: true,
  };

  if (!pricing || !priceCategory || !garmentTypeName) return empty;

  const rate = pricing.eurToGbp;
  const cats = priceCategory.split(",").map((c) => c.trim()).filter(Boolean);
  const construction = makeName ? makeToConstruction(makeName) : "Half Canvas";

  let basePriceEur: number | null = null;

  for (const cat of cats) {
    const entries = pricing.priceMap[cat];
    if (!entries) continue;

    const byGarment = entries.filter((e) => e.garment_type === garmentTypeName);
    if (byGarment.length === 0) continue;

    const exactMatch = byGarment.find(
      (e) => e.construction === construction && e.make_type === "CustomMade"
    );
    if (exactMatch) { basePriceEur = exactMatch.price_eur; break; }

    const constructionMatch = byGarment.find((e) => e.construction === construction);
    if (constructionMatch) { basePriceEur = constructionMatch.price_eur; break; }

    const customMade = byGarment.find((e) => e.make_type === "CustomMade");
    if (customMade) { basePriceEur = customMade.price_eur; break; }

    basePriceEur = byGarment[0].price_eur;
    break;
  }

  if (basePriceEur === null) return { ...empty, construction };

  // ── Lining surcharge ──
  const isCoatOrder = garmentTypeName.toLowerCase().includes("overcoat") ||
    garmentTypeName.toLowerCase().includes("coat");
  const mainSection = isCoatOrder ? "Coats" : "Suits";

  let liningUpchargeEur = 0;
  if (liningType === "bemberg") {
    const s = pricing.surcharges[mainSection] ?? [];
    const match = s.find((r) => r.name === LINING_SURCHARGE_NAMES["bemberg"]);
    if (match) liningUpchargeEur = match.price_eur;
  } else if (liningType === "fancy") {
    const s = pricing.surcharges[mainSection] ?? [];
    const match = s.find((r) => r.name === LINING_SURCHARGE_NAMES["fancy"]);
    if (match) liningUpchargeEur = match.price_eur;
  }

  // ── Button surcharge ──
  let buttonUpchargeEur = 0;
  if (buttonLabel) {
    const lower = buttonLabel.toLowerCase();
    const buttonSec = isCoatOrder ? "Coats" : "Suits";
    const secSurcharges = pricing.surcharges[buttonSec] ?? [];
    const match = secSurcharges.find((s) =>
      BUTTON_SURCHARGE_KEYWORDS.some((kw) =>
        s.name.toLowerCase().includes(kw) && lower.includes(kw.split(" - ")[1] ?? "")
      )
    );
    if (match) buttonUpchargeEur = match.price_eur;
  }

  // ── Design option surcharges ──
  const surchargeItems: SurchargeLineItem[] = [];
  const alreadyApplied = new Set<string>();

  if (designOptions && designOptions.length > 0) {
    for (const dOpt of designOptions) {
      const optKey = dOpt.optionName.toLowerCase();
      const resolver = DESIGN_OPTION_SURCHARGE_MAP[optKey];
      if (!resolver) continue;

      const surchargeName = resolver(dOpt.valueLabel, dOpt.partName);
      if (!surchargeName) continue;

      // Dedup: same surcharge should only be charged once per tuxedo ensemble, etc.
      // But some surcharges are per-part (e.g. pick stitching on jacket vs trousers)
      const dedupKey = `${surchargeName}::${dOpt.partName}`;
      if (alreadyApplied.has(dedupKey)) continue;

      // Special dedup: tuxedo surcharge only once across all parts
      if (surchargeName === "Tuxedo - Satin/ottoman (Made in Italy)") {
        if (alreadyApplied.has("tuxedo-global")) continue;
        alreadyApplied.add("tuxedo-global");
      }

      alreadyApplied.add(dedupKey);

      const section = getSurchargeSection(dOpt.partName, surchargeName);
      const sectionSurcharges = pricing.surcharges[section] ?? [];
      const surchargeRow = sectionSurcharges.find((s) => s.name === surchargeName);
      if (!surchargeRow || surchargeRow.price_eur === 0) continue;

      const costGbp = Math.round(surchargeRow.price_eur * rate * 100) / 100;
      const saleGbp = eurToRrp(surchargeRow.price_eur, rate);

      surchargeItems.push({
        label: surchargeName,
        costEur: surchargeRow.price_eur,
        costGbp,
        saleGbp,
      });
    }
  }

  // ── Monogram surcharge ──
  if (monogramEnabled && monogramLineCount && monogramLineCount > 1) {
    const monoSurcharges = pricing.surcharges[mainSection] ?? [];
    const monoRow = monoSurcharges.find((s) => s.name === "Additional monogram");
    if (monoRow) {
      const extra = monogramLineCount - 1;
      const totalEur = monoRow.price_eur * extra;
      surchargeItems.push({
        label: `Additional monogram ×${extra}`,
        costEur: totalEur,
        costGbp: Math.round(totalEur * rate * 100) / 100,
        saleGbp: eurToRrp(monoRow.price_eur, rate) * extra,
      });
    }
  }

  const totalSurchargesEur = surchargeItems.reduce((s, i) => s + i.costEur, 0);
  const totalSurchargesGbp = surchargeItems.reduce((s, i) => s + i.costGbp, 0);
  const totalSurchargesSaleGbp = surchargeItems.reduce((s, i) => s + i.saleGbp, 0);

  const totalCostEur = basePriceEur + liningUpchargeEur + buttonUpchargeEur + totalSurchargesEur;
  const costGbp = Math.round(totalCostEur * rate * 100) / 100;

  const baseSaleGbp = eurToRrp(basePriceEur, rate);
  const liningSaleGbp = liningUpchargeEur > 0 ? eurToRrp(liningUpchargeEur, rate) : 0;
  const buttonSaleGbp = buttonUpchargeEur > 0 ? eurToRrp(buttonUpchargeEur, rate) : 0;
  const unitSale = baseSaleGbp + liningSaleGbp + buttonSaleGbp + totalSurchargesSaleGbp;
  const subtotalSale = unitSale * quantity;
  const vat = Math.round(subtotalSale * VAT_RATE * 100) / 100;
  const total = Math.round((subtotalSale + vat) * 100) / 100;

  return {
    baseCostEur: basePriceEur,
    costEur: totalCostEur,
    costGbp,
    salePrice: baseSaleGbp,
    construction,
    priceCategory: cats[0] ?? "",
    garmentType: garmentTypeName,
    liningUpchargeEur,
    liningUpchargeGbp: liningSaleGbp,
    buttonUpchargeEur,
    buttonUpchargeGbp: buttonSaleGbp,
    surchargeItems,
    totalSurchargesEur,
    totalSurchargesGbp,
    totalSurchargesSaleGbp,
    quantity,
    subtotalSale,
    vat,
    total,
    eurToGbp: rate,
    missingPricing: false,
  };
}

export function formatGbp(value: number): string {
  return `£${value.toFixed(2)}`;
}

export function formatEur(value: number): string {
  return `€${value.toFixed(2)}`;
}
