"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type {
  CustomerInfo,
  CustomerAddParams,
  LiningStockInfo,
  IdAndName,
  MonogramData,
  BrandingOptionData,
} from "@/lib/types";
import type { FabricStockInfo } from "@/lib/gocreate";
import type { CatalogData, ProductPart, ItemTypeCategory } from "@/lib/gocreate-catalog";
import {
  getFitToolSections,
  checkDesignOptionConflicts,
  resolveBestMatchLining,
} from "@/lib/gocreate-catalog";
import { buildGoCreatePayload } from "@/lib/build-order-payload";
import { computePricing, formatGbp, type PricingData, type DesignOptionForPricing } from "@/lib/pricing";
import { useCatalog } from "@/hooks/useCatalog";

// ── Icons ────────────────────────────────────────────────────────────────────

function IconChevron({ open }: { open?: boolean }) {
  return (
    <svg className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconGarment() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconFabric() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function IconRuler() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.384a2.025 2.025 0 01-2.864-2.863l5.384-5.384m2.864 2.864L21.36 5.28a2.123 2.123 0 00-2.907-2.945L11.42 9.307m0 5.863l2.863-2.863" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
    </svg>
  );
}

function IconButton() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
    </svg>
  );
}

// ── Category Icons (Lucide) ──────────────────────────────────────────────────

import {
  GraduationCap,
  Sparkles,
  Shirt,
  Scissors,
  CloudSnow,
  RectangleVertical,
  Footprints,
  Ribbon,
  Layers,
  ShoppingBag,
  Link,
} from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  informal: Sparkles,
  formal: GraduationCap,
  trouser: Scissors,
  outerwear: CloudSnow,
  vest: RectangleVertical,
  shirt: Shirt,
  knit: Layers,
  pant: Scissors,
  shoe: Footprints,
  belt: Link,
  tie: Ribbon,
  pocket: Ribbon,
  cummerbund: Ribbon,
};

function getCategoryIcon(name: string, className = "h-6 w-6") {
  const n = name.toLowerCase();
  for (const [key, Icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (n.includes(key)) return <Icon className={className} />;
  }
  return <ShoppingBag className={className} />;
}

// ── Custom Select ────────────────────────────────────────────────────────────

interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

function TermSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = false,
  icon,
  compact = false,
}: {
  label?: string;
  options: SelectOption[];
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  searchable?: boolean;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      {label && <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>}
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className={`flex w-full items-center gap-2 border border-gray-200 bg-white text-left text-sm transition hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${compact ? "rounded px-2 py-1.5" : "rounded-md px-3 py-2"}`}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
        <span className={`flex-1 truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
          {selected?.label ?? placeholder}
        </span>
        <IconChevron open={open} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {searchable && (
            <div className="border-b border-gray-100 px-3 py-2">
              <div className="flex items-center gap-2">
                <IconSearch />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                />
              </div>
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${isSelected ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.sublabel && <span className="text-xs text-gray-400">{opt.sublabel}</span>}
                  {isSelected && <IconCheck />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-center text-xs text-gray-400">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_STEPS = [
  { key: "customer", label: "Customer", icon: <IconUser /> },
  { key: "primary", label: "Configuration", icon: <IconGarment /> },
  { key: "fitprofile", label: "Fit Profile", icon: <IconRuler /> },
  { key: "fittools", label: "Fit Tools", icon: <IconWrench /> },
  { key: "design", label: "Design", icon: <IconPalette /> },
  { key: "monogram", label: "Monogram", icon: <IconTag /> },
  { key: "review", label: "Review", icon: <IconClipboard /> },
];

function getVisibleSteps(state: WizardState, catalog: CatalogData | null) {
  const parts = catalog ? getActiveParts(state, catalog) : [];
  const hasFitData = parts.some((p) => {
    const fits = catalog?.fitsByPart[p.id] ?? [];
    const tryons = catalog?.tryonSizesByPart[p.id] ?? [];
    const hasMultipleFits = fits.length > 1;
    const hasRealTryons = tryons.some(
      (t) => t.label.toLowerCase() !== "dummy",
    );
    return hasMultipleFits || hasRealTryons;
  });
  const hasFitTools = parts.some((p) => (catalog?.fitToolsByPart[p.id] ?? []).length > 0);
  const hasDesignOptions = parts.some((p) =>
    (catalog?.designOptionsByPart[p.id] ?? []).some((c) => !c.isMonogram)
  );
  const hasMonogramOptions = parts.some((p) =>
    (catalog?.designOptionsByPart[p.id] ?? []).some((c) => c.isMonogram)
  );
  const hasBranding = parts.some((p) => (catalog?.brandingPositionsByPart[p.id] ?? []).length > 0);

  return ALL_STEPS.filter((s) => {
    if (s.key === "fitprofile") return hasFitData;
    if (s.key === "fittools") return hasFitTools;
    if (s.key === "design") return hasDesignOptions;
    if (s.key === "monogram") return hasMonogramOptions || hasBranding;
    return true;
  });
}

// ── Wizard state ─────────────────────────────────────────────────────────────

interface PartFitState {
  fitAdviseMode: number;
  fitProfileId: number;
  fitProfileName: string;
  fitId: number;
  fitName: string;
  tryOnType: string;
  tryOnId: number;
  tryOnSize: string;
  leftTryOnId: number;
  rightTryOnId: number;
  sourceOrderNumber: string;
  fitToolValues: Record<string, string>;
}

interface PartDesignState {
  selectedOptions: Record<number, { valueId: number | string; label: string }>;
}

interface WizardState {
  customer: CustomerInfo | null;
  selectedCategoryId: number | null;
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
  partFit: Record<number, PartFitState>;
  partDesign: Record<number, PartDesignState>;
  monogramEnabled: boolean;
  monogram: MonogramData;
  brandingEntries: BrandingOptionData[];
  showSize: boolean;
  skipWarnings: boolean;
  confirmed: boolean;
}

const EMPTY_MONOGRAM: MonogramData = {
  MonogramColourId: 0,
  MonogramFontId: 0,
  MonogramLengthId: 0,
  MonogramPositionId: 0,
  MonogramFirstLine: "",
  MonogramSecondLine: "",
};

const INITIAL_STATE: WizardState = {
  customer: null,
  selectedCategoryId: null,
  itemType: null,
  quantity: 1,
  salesPersonId: null,
  modelByPart: {},
  makeByPart: {},
  canvasByPart: {},
  liningMode: 1,
  buttonTrimId: null,
  fabric: null,
  lining: null,
  extraLining: null,
  shopOrderNumber: "",
  occasion: "",
  extraTrouserAddOn: false,
  partFit: {},
  partDesign: {},
  monogramEnabled: false,
  monogram: { ...EMPTY_MONOGRAM },
  brandingEntries: [],
  showSize: false,
  skipWarnings: false,
  confirmed: false,
};

function getActiveParts(state: WizardState, catalog: CatalogData | null): ProductPart[] {
  if (!state.itemType || !catalog) return [];
  return catalog.productPartsByItem[state.itemType.Id] ?? [];
}

function collectDesignOptionsForPricing(state: WizardState, catalog: CatalogData): DesignOptionForPricing[] {
  const parts = getActiveParts(state, catalog);
  const result: DesignOptionForPricing[] = [];
  for (const p of parts) {
    const pd = state.partDesign[p.id];
    if (!pd) continue;
    const categories = catalog.designOptionsByPart[p.id] ?? [];
    for (const cat of categories) {
      for (const opt of cat.options) {
        const sel = pd.selectedOptions[opt.optionId];
        if (sel) {
          result.push({
            optionName: opt.name,
            valueLabel: sel.label,
            partName: p.name,
          });
        }
      }
    }
  }
  return result;
}

// ── Shared UI ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</h3>;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3 py-2">
      <span className="pt-2 text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function PartTabs({ parts, active, onSelect }: { parts: ProductPart[]; active: number; onSelect: (i: number) => void }) {
  if (parts.length <= 1) return null;
  return (
    <div className="mb-4 flex gap-px rounded-md border border-gray-200 bg-gray-100 p-0.5">
      {parts.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(i)}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition ${i === active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

// ── Step 1: Customer ─────────────────────────────────────────────────────────

function StepCustomer({
  selected,
  onSelect,
}: {
  selected: CustomerInfo | null;
  onSelect: (c: CustomerInfo) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    setError(null);
    try {
      const res = await fetch("/api/customers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.customers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const form = e.target as HTMLFormElement;
      const fd = new FormData(form);
      const params: CustomerAddParams = {
        FirstName: fd.get("firstName") as string,
        LastName: fd.get("lastName") as string,
        Email: (fd.get("email") as string) || undefined,
        MobileNumber: (fd.get("mobile") as string) || undefined,
      };
      const res = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
      const data = await res.json();
      onSelect({
        Id: data.customerId,
        CustomerNumber: "",
        FirstName: params.FirstName,
        LastName: params.LastName,
        Email: params.Email ?? "",
        MobileNumber: params.MobileNumber ?? "",
      } as CustomerInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  if (selected) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <IconUser />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{selected.FirstName} {selected.LastName}</p>
            <p className="text-xs text-gray-500">{selected.Email}{selected.MobileNumber ? ` · ${selected.MobileNumber}` : ""}</p>
            <p className="font-mono text-[10px] text-gray-400">ID:{selected.Id} {selected.CustomerNumber && `/ ${selected.CustomerNumber}`}</p>
          </div>
          <button onClick={() => onSelect(null as unknown as CustomerInfo)} type="button" className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><IconSearch /></div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by name, email, or customer number..."
          className={inputCls + " pl-9"}
          autoFocus
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {results.length > 0 && (
        <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200">
          {results.map((c, i) => (
            <button
              key={c.Id}
              onClick={() => onSelect(c)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50 ${i > 0 ? "border-t border-gray-100" : ""}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                {c.FirstName?.[0]}{c.LastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{c.FirstName} {c.LastName}</p>
                <p className="text-xs text-gray-500 truncate">{c.Email} {c.City && `· ${c.City}`}</p>
              </div>
              <span className="font-mono text-[10px] text-gray-300">{c.CustomerNumber || `#${c.Id}`}</span>
            </button>
          ))}
        </div>
      )}

      <button onClick={() => setShowCreate(!showCreate)} type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
        {showCreate ? "Cancel" : "+ Create new customer"}
      </button>

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">First Name *</label><input name="firstName" required className={inputCls} /></div>
            <div><label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Last Name *</label><input name="lastName" required className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Email</label><input name="email" type="email" className={inputCls} /></div>
            <div><label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Mobile</label><input name="mobile" className={inputCls} /></div>
          </div>
          <button type="submit" disabled={creating} className="rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50">
            {creating ? "Creating..." : "Create Customer"}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Step 2: Primary Info ─────────────────────────────────────────────────────

function MaterialSearch({
  label,
  type,
  selected,
  onSelect,
}: {
  label: string;
  type: "fabric" | "lining";
  selected: { Id: number; Name: string; label: string; imageUrl?: string; priceCategories?: string; cutLength?: boolean } | null;
  onSelect: (v: { Id: number; Name: string; label: string; imageUrl?: string; priceCategories?: string; cutLength?: boolean } | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(FabricStockInfo | LiningStockInfo)[]>([]);
  const [searching, setSearching] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleChange(val: string) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const endpoint = type === "fabric" ? "/api/fabrics/search" : "/api/linings/search";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: val, pageSize: 50 }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setResults(type === "fabric" ? data.fabrics ?? [] : data.linings ?? []);
      } finally {
        setSearching(false);
      }
    }, 200);
  }

  const filtered = showOutOfStock ? results : results.filter((r) => r.Stock > 0);

  if (selected) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>
        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
          {selected.imageUrl ? (
            <Image src={selected.imageUrl} alt="" width={36} height={36} className="rounded border border-gray-200 object-cover" unoptimized />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-200 bg-white"><IconFabric /></div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{selected.label}</p>
            <p className="font-mono text-[10px] text-gray-400">ID:{selected.Id}</p>
          </div>
          <button onClick={() => onSelect(null)} type="button" className="rounded border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><IconSearch /></div>
        <input type="text" value={query} onChange={(e) => handleChange(e.target.value)} placeholder={`Search ${type} by code...`} className={inputCls + " pl-9"} />
        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" /></div>}
      </div>
      {results.length > 0 && (
        <div className="mt-2">
          <label className="mb-1.5 flex items-center gap-2 text-[11px] text-gray-400">
            <input type="checkbox" checked={showOutOfStock} onChange={(e) => setShowOutOfStock(e.target.checked)} className="rounded border-gray-300" />
            Include out of stock ({results.length - filtered.length} hidden)
          </label>
          <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
            {filtered.map((item, i) => {
              const imgUrl = (item as FabricStockInfo).ImageUrl ?? (item as LiningStockInfo).ImageUrl;
              const composition = (item as FabricStockInfo).Composition;
              return (
                <button
                  key={item.Id}
                  onClick={() => onSelect({
                    Id: item.Id,
                    Name: item.Code ?? "",
                    label: `${item.Code ?? ""} ${item.Name ?? ""}`.trim(),
                    imageUrl: imgUrl ?? undefined,
                    priceCategories: (item as FabricStockInfo).PPriceCategories ?? undefined,
                    cutLength: (item as FabricStockInfo).CutLengthFabric ?? undefined,
                  })}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-blue-50 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  {imgUrl ? (
                    <Image src={imgUrl} alt="" width={32} height={32} className="rounded border border-gray-200 object-cover" unoptimized />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-gray-50"><IconFabric /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.Code}</p>
                    <p className="text-xs text-gray-500 truncate">{item.Name}{composition ? ` · ${composition}` : ""}</p>
                  </div>
                  <span className={`font-mono text-xs ${item.Stock > 0 ? "text-gray-500" : "text-red-400"}`}>
                    {item.Stock > 0 ? item.Stock : "OOS"}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="px-3 py-3 text-center text-xs text-gray-400">No in-stock results</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function StepPrimaryInfo({
  state,
  onChange,
  catalog,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  catalog: CatalogData;
}) {
  const parts = getActiveParts(state, catalog);
  const [buttonSearch, setButtonSearch] = useState("");
  const filteredButtons = buttonSearch
    ? catalog.buttonOptions.filter((b) => b.label.toLowerCase().includes(buttonSearch.toLowerCase()))
    : catalog.buttonOptions;

  const categories = catalog.itemTypeCategories ?? [];
  const selectedCat = categories.find((c) => c.id === state.selectedCategoryId) ?? null;

  // Field visibility — driven by per-category field_config from the DB
  const fc = selectedCat?.fieldConfig;
  const showCanvas = fc?.showCanvas ?? false;
  const showLiningMode = fc?.showLiningMode ?? false;
  const showLining = fc?.showLining ?? false;
  const showButtons = fc?.showButtons ?? false;
  const showFabricSearch = fc?.showFabricSearch ?? true;
  const materialDesignOptionNames = fc?.materialDesignOptionNames ?? [];

  function handleSelectCategory(cat: ItemTypeCategory) {
    if (cat.items.length === 1) {
      const item = cat.items[0];
      onChange({
        selectedCategoryId: cat.id,
        itemType: { Id: item.id, Name: item.name },
        modelByPart: {}, makeByPart: {}, canvasByPart: {}, partFit: {}, partDesign: {},
      });
    } else {
      onChange({
        selectedCategoryId: cat.id,
        itemType: null,
        modelByPart: {}, makeByPart: {}, canvasByPart: {}, partFit: {}, partDesign: {},
      });
    }
  }

  function handleSelectItem(item: { id: number; name: string }) {
    onChange({
      itemType: { Id: item.id, Name: item.name },
      modelByPart: {}, makeByPart: {}, canvasByPart: {}, partFit: {}, partDesign: {},
    });
  }

  return (
    <div className="space-y-5">
      {/* Category card grid */}
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Select Product Type *</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((cat) => {
            const isActive = state.selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 text-center transition-all ${
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white shadow-md"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm"
                }`}
              >
                <span className={isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"}>
                  {getCategoryIcon(cat.name, isActive ? "h-7 w-7 text-white" : "h-7 w-7")}
                </span>
                <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                {cat.items.length > 1 && (
                  <span className={`text-[10px] ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                    {cat.items.length} options
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-items when category has multiple combinations */}
      {selectedCat && selectedCat.items.length > 1 && (
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Choose Combination *</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {selectedCat.items.map((item) => {
              const isActive = state.itemType?.Id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`flex items-center gap-2.5 rounded-md border-2 px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "border-gray-900 bg-gray-50 text-gray-900 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity + Sales Person row */}
      <div className="grid grid-cols-2 gap-4">
        <TermSelect
          label="Quantity"
          options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
          value={state.quantity}
          onChange={(v) => onChange({ quantity: Number(v) })}
        />
        <TermSelect
          label="Sales Person"
          icon={<IconUser />}
          options={catalog.salesAssociates.map((s) => ({ value: s.id, label: s.name }))}
          value={state.salesPersonId ?? ""}
          onChange={(v) => onChange({ salesPersonId: v ? Number(v) : null })}
          placeholder="Assign..."
          searchable
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Shop Order Number</label>
        <input value={state.shopOrderNumber} onChange={(e) => onChange({ shopOrderNumber: e.target.value })} className={inputCls} placeholder="Optional reference" />
      </div>

      {parts.length > 0 && (
        <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50/50 p-4">
          <SectionLabel>Part Configuration</SectionLabel>
          {/* Model */}
          {parts.map((p) => {
            const models = catalog.modelsByPart[p.id] ?? [];
            if (models.length <= 1) {
              return (
                <FieldRow key={`model-${p.id}`} label={`${p.name} Model`}>
                  <span className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700">
                    <IconGarment /> {models[0]?.name ?? "Design from Scratch"}
                  </span>
                </FieldRow>
              );
            }
            return (
              <FieldRow key={`model-${p.id}`} label={`${p.name} Model`}>
                <TermSelect
                  options={models.map((m) => ({ value: m.id, label: m.name }))}
                  value={state.modelByPart[p.id] ?? models[0]?.id ?? ""}
                  onChange={(v) => onChange({ modelByPart: { ...state.modelByPart, [p.id]: Number(v) } })}
                  compact
                />
              </FieldRow>
            );
          })}
          {/* Make — filtered by fabric price category when applicable */}
          {parts.map((p) => {
            const allMakes = catalog.makesByPart[p.id] ?? [];
            const fabricCats = new Set(
              (state.fabric?.priceCategories ?? "").split(",").map((s) => s.trim()).filter(Boolean)
            );
            const makes = allMakes.filter((m) => {
              if (!m.makePriceCategories) return true;
              if (fabricCats.size === 0) return true;
              return m.makePriceCategories.split(",").some((c) => fabricCats.has(c.trim()));
            });
            if (makes.length === 0) return null;
            return (
              <FieldRow key={`make-${p.id}`} label={`${p.name} Make`}>
                <TermSelect
                  options={makes.map((m) => ({ value: m.id, label: m.name }))}
                  value={state.makeByPart[p.id] ?? makes[0]?.id ?? ""}
                  onChange={(v) => onChange({ makeByPart: { ...state.makeByPart, [p.id]: Number(v) } })}
                  compact
                />
              </FieldRow>
            );
          })}
          {/* Canvas — per-part, driven by field_config */}
          {showCanvas && catalog.canvasOptions.length > 0 && parts.map((p) => (
            <FieldRow key={`canvas-${p.id}`} label={`${p.name} Canvas`}>
              <TermSelect
                options={catalog.canvasOptions.map((c) => ({ value: c.valueId, label: c.label }))}
                value={state.canvasByPart[p.id] ?? catalog.canvasOptions[0]?.valueId ?? ""}
                onChange={(v) => onChange({ canvasByPart: { ...state.canvasByPart, [p.id]: Number(v) } })}
                compact
              />
            </FieldRow>
          ))}
        </div>
      )}

      {/* Fabric search — only when field_config says to show it */}
      {showFabricSearch && (
        <MaterialSearch label="Fabric *" type="fabric" selected={state.fabric} onSelect={(f) => onChange({ fabric: f })} />
      )}

      {/* Material design-option dropdowns — driven by field_config.materialDesignOptionNames */}
      {materialDesignOptionNames.length > 0 && (() => {
        const matNameSet = new Set(materialDesignOptionNames.map((n) => n.toLowerCase()));
        const partMaterialOptions = parts.flatMap((p) => {
          const cats = catalog.designOptionsByPart[p.id] ?? [];
          return cats.flatMap((cat) =>
            cat.options
              .filter((opt) => matNameSet.has(opt.name.toLowerCase()))
              .map((opt) => ({ partId: p.id, opt }))
          );
        });
        if (partMaterialOptions.length === 0) return null;
        return (
          <div className="space-y-3">
            {partMaterialOptions.map(({ partId, opt }) => {
              const currentDesign = state.partDesign[partId] ?? { selectedOptions: {} };
              const sel = currentDesign.selectedOptions[opt.optionId];
              return (
                <TermSelect
                  key={`mat-${partId}-${opt.optionId}`}
                  label={`${opt.name} *`}
                  options={[
                    { value: "", label: "Select..." },
                    ...opt.values.map((v) => ({ value: `${v.valueId}::${v.label}`, label: v.label })),
                  ]}
                  value={sel ? `${sel.valueId}::${sel.label}` : ""}
                  onChange={(v) => {
                    if (!v) return;
                    const [vid, ...rest] = String(v).split("::");
                    const numVid = Number(vid);
                    const newDesign = {
                      ...currentDesign,
                      selectedOptions: {
                        ...currentDesign.selectedOptions,
                        [opt.optionId]: { valueId: isNaN(numVid) ? vid : numVid, label: rest.join("::") },
                      },
                    };
                    onChange({ partDesign: { ...state.partDesign, [partId]: newDesign } });
                  }}
                  searchable
                />
              );
            })}
          </div>
        );
      })()}

      {showLining && (
        <div className="space-y-3">
          {showLiningMode ? (
            <TermSelect
              label="Lining Mode"
              options={catalog.liningModes.map((m) => ({ value: m.id, label: m.name }))}
              value={state.liningMode}
              onChange={(v) => {
                const mode = Number(v);
                onChange({ liningMode: mode, lining: mode !== 1 ? null : state.lining });
              }}
            />
          ) : (
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Lining</label>
          )}
          {(showLiningMode ? state.liningMode === 1 : true) && (
            <MaterialSearch label={showLiningMode ? "Lining" : ""} type="lining" selected={state.lining} onSelect={(l) => onChange({ lining: l })} />
          )}
          {showLiningMode && state.liningMode !== 1 && state.fabric && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Auto-matched Lining</p>
              <p className="mt-0.5 text-sm font-medium text-gray-800">
                {resolveBestMatchLining(state.fabric.Name, state.liningMode as 2 | 3, catalog.liningColorMap).name}
              </p>
            </div>
          )}
          {showLiningMode && state.liningMode !== 1 && !state.fabric && (
            <p className="text-xs text-gray-400 italic">Select a fabric first to preview lining match</p>
          )}
        </div>
      )}

      {showButtons && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Buttons / Trim</label>
          {state.buttonTrimId ? (
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
              <IconButton />
              <span className="flex-1 text-sm font-medium text-gray-900">
                {catalog.buttonOptions.find((b) => b.trimId === state.buttonTrimId)?.label ?? `#${state.buttonTrimId}`}
              </span>
              <button onClick={() => onChange({ buttonTrimId: null })} type="button" className="rounded border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">Change</button>
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><IconSearch /></div>
                <input type="text" value={buttonSearch} onChange={(e) => setButtonSearch(e.target.value)} placeholder="Search buttons..." className={inputCls + " pl-9"} />
              </div>
              <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-gray-200">
                {filteredButtons.map((b, i) => (
                  <button
                    key={b.trimId}
                    type="button"
                    onClick={() => { onChange({ buttonTrimId: b.trimId }); setButtonSearch(""); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-blue-50 ${i > 0 ? "border-t border-gray-100" : ""}`}
                  >
                    <IconButton /> {b.label}
                  </button>
                ))}
                {filteredButtons.length === 0 && <p className="px-3 py-2 text-center text-xs text-gray-400">No match</p>}
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Occasion</label>
        <input value={state.occasion} onChange={(e) => onChange({ occasion: e.target.value })} className={inputCls} placeholder="e.g. Wedding, Business" />
      </div>
    </div>
  );
}

// ── Step 3: Fit Profile ──────────────────────────────────────────────────────

interface FitProfileOption {
  orderNumber: string;
  productPartName: string;
  fitProfileName: string;
  fitName: string;
  tryOn: string;
}

function StepFitProfile({
  state,
  onChange,
  catalog,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  catalog: CatalogData;
}) {
  const parts = getActiveParts(state, catalog);
  const [activeTab, setActiveTab] = useState(0);
  const [profiles, setProfiles] = useState<Record<string, FitProfileOption[]>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!state.customer || loadedRef.current) return;
    loadedRef.current = true;
    setLoadingProfiles(true);
    fetch("/api/orders/by-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: state.customer.Id }),
    })
      .then((r) => r.json())
      .then((data) => {
        const grouped: Record<string, FitProfileOption[]> = {};
        for (const fp of data.fitProfiles ?? []) {
          for (const part of fp.parts) {
            const key = part.productPartName;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push({
              orderNumber: fp.orderNumber,
              productPartName: part.productPartName,
              fitProfileName: part.fitProfileName,
              fitName: part.fitName,
              tryOn: part.tryOn,
            });
          }
        }
        setProfiles(grouped);
      })
      .catch(() => {})
      .finally(() => setLoadingProfiles(false));
  }, [state.customer]);

  function getPartFit(partId: number): PartFitState {
    return state.partFit[partId] ?? {
      fitAdviseMode: 1, fitProfileId: 0, fitProfileName: "", fitId: 0, fitName: "", tryOnType: "", tryOnId: 0, tryOnSize: "", leftTryOnId: 0, rightTryOnId: 0, sourceOrderNumber: "", fitToolValues: {},
    };
  }

  function updatePartFit(partId: number, patch: Partial<PartFitState>) {
    const current = getPartFit(partId);
    onChange({ partFit: { ...state.partFit, [partId]: { ...current, ...patch } } });
  }

  const activePart = parts[activeTab];
  if (!activePart) return <p className="text-xs text-gray-400">Select an item type first.</p>;

  const pf = getPartFit(activePart.id);
  const fitAdviseOptions = catalog.fitAdviseByPart[activePart.id] ?? [{ id: 1, name: "Create from TryOn" }];
  const fits = catalog.fitsByPart[activePart.id] ?? [];
  const allTryons = catalog.tryonSizesByPart[activePart.id] ?? [];
  const partProfiles = profiles[activePart.name] ?? [];

  const fitFilteredTryons = pf.fitId ? allTryons.filter((t) => t.fitId === pf.fitId) : allTryons;
  const tryonTypes = [...new Set(fitFilteredTryons.map((t) => t.tryonType).filter((t): t is string => !!t))];
  const hasTryonTypes = tryonTypes.length > 0;
  const tryons = hasTryonTypes && pf.tryOnType
    ? fitFilteredTryons.filter((t) => t.tryonType === pf.tryOnType)
    : fitFilteredTryons.filter((t) => !t.tryonType);

  return (
    <div className="space-y-4">
      <PartTabs parts={parts} active={activeTab} onSelect={setActiveTab} />

      <div className="space-y-4">
        <TermSelect
          label="Fit Advise"
          icon={<IconRuler />}
          options={fitAdviseOptions.map((o) => ({ value: o.id, label: o.name }))}
          value={pf.fitAdviseMode}
          onChange={(v) => updatePartFit(activePart.id, { fitAdviseMode: Number(v) })}
        />

        {loadingProfiles && <p className="text-xs text-gray-400">Loading fit profiles...</p>}
        {pf.fitAdviseMode === 21 && partProfiles.length > 0 && (
          <TermSelect
            label="Existing Fit Profile"
            options={partProfiles.map((p) => ({
              value: p.orderNumber,
              label: `${p.fitProfileName} · ${p.fitName}`,
              sublabel: p.orderNumber,
            }))}
            value={pf.sourceOrderNumber}
            onChange={(v) => {
              const sel = partProfiles.find((p) => p.orderNumber === v);
              if (sel) {
                updatePartFit(activePart.id, { sourceOrderNumber: sel.orderNumber, fitProfileName: sel.fitProfileName, fitName: sel.fitName, tryOnSize: sel.tryOn });
              } else {
                updatePartFit(activePart.id, { sourceOrderNumber: "" });
              }
            }}
            placeholder="Select profile..."
            searchable
          />
        )}
        {pf.fitAdviseMode === 21 && partProfiles.length === 0 && !loadingProfiles && (
          <p className="text-xs text-amber-600">No existing fit profiles for this customer.</p>
        )}

        {(pf.fitAdviseMode === 1 || pf.fitAdviseMode === 22) && (() => {
          const selectedCat = (catalog.itemTypeCategories ?? []).find((c) => c.id === state.selectedCategoryId);
          const isShoe = selectedCat?.fieldConfig?.isShoeOrder ?? false;
          return (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Fit Profile Name</label>
                <input value={pf.fitProfileName} onChange={(e) => updatePartFit(activePart.id, { fitProfileName: e.target.value })} className={inputCls} placeholder="e.g. suit jacket sep 25" />
              </div>
              <div className={`grid gap-4 ${hasTryonTypes ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
                <TermSelect
                  label="Fit *"
                  options={[{ value: 0, label: "Select fit..." }, ...fits.map((f) => ({ value: f.id, label: f.name }))]}
                  value={pf.fitId}
                  onChange={(v) => {
                    const fitId = Number(v);
                    const fit = fits.find((f) => f.id === fitId);
                    updatePartFit(activePart.id, { fitId, fitName: fit?.name ?? "", tryOnType: "", tryOnId: 0, tryOnSize: "" });
                  }}
                />
                {hasTryonTypes && (
                  <TermSelect
                    label="TryOn Type *"
                    options={[{ value: "", label: "Select type..." }, ...tryonTypes.map((t) => ({ value: t, label: t }))]}
                    value={pf.tryOnType}
                    onChange={(v) => {
                      updatePartFit(activePart.id, { tryOnType: String(v), tryOnId: 0, tryOnSize: "" });
                    }}
                  />
                )}
                {!isShoe && (
                  <TermSelect
                    label="TryOn Size *"
                    options={[{ value: 0, label: "Select size..." }, ...tryons.map((s) => ({ value: s.id, label: s.label }))]}
                    value={pf.tryOnId}
                    onChange={(v) => {
                      const tryOnId = Number(v);
                      const tryon = tryons.find((t) => t.id === tryOnId);
                      updatePartFit(activePart.id, { tryOnId, tryOnSize: tryon?.label ?? "" });
                    }}
                  />
                )}
              </div>
              {isShoe && tryons.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <TermSelect
                    label="Left TryOn Size *"
                    options={[{ value: 0, label: "Select size..." }, ...tryons.map((s) => ({ value: s.id, label: s.label }))]}
                    value={pf.leftTryOnId}
                    onChange={(v) => {
                      const id = Number(v);
                      updatePartFit(activePart.id, { leftTryOnId: id, tryOnId: id });
                    }}
                  />
                  <TermSelect
                    label="Right TryOn Size *"
                    options={[{ value: 0, label: "Select size..." }, ...tryons.map((s) => ({ value: s.id, label: s.label }))]}
                    value={pf.rightTryOnId}
                    onChange={(v) => updatePartFit(activePart.id, { rightTryOnId: Number(v) })}
                  />
                </div>
              )}
            </>
          );
        })()}

        {pf.fitAdviseMode === 2 && (
          <p className="text-xs text-gray-500 italic">Fit will be automatically converted to T40.</p>
        )}
      </div>
    </div>
  );
}

// ── Step 4: Fit Tools ────────────────────────────────────────────────────────

function NumericStepper({
  value,
  onChange,
  step,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  function adjust(delta: number) {
    const next = Math.round((value + delta) * 100) / 100;
    if (next >= min && next <= max) onChange(next);
  }
  const display = value === 0 ? "0.00" : value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);

  return (
    <div className="flex items-center gap-0.5">
      <button onClick={() => adjust(-step)} className="rounded-l border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-50" type="button">&minus;</button>
      <span className="border-y border-gray-200 bg-gray-50 px-3 py-1 font-mono text-xs tabular-nums text-gray-800">{display}</span>
      <button onClick={() => adjust(step)} className="rounded-r border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-50" type="button">+</button>
    </div>
  );
}

function StepFitTools({
  state,
  onChange,
  catalog,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  catalog: CatalogData;
}) {
  const parts = getActiveParts(state, catalog);
  const [activeTab, setActiveTab] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Auto-select the sole fit when a part has exactly one (Fit Profile step is skipped)
  useEffect(() => {
    const patch: Record<number, PartFitState> = {};
    let changed = false;
    for (const p of parts) {
      const fits = catalog.fitsByPart[p.id] ?? [];
      const current = state.partFit[p.id];
      if (fits.length === 1 && (!current || current.fitId === 0)) {
        patch[p.id] = {
          ...(current ?? { fitAdviseMode: 1, fitProfileId: 0, fitProfileName: "", fitId: 0, fitName: "", tryOnType: "", tryOnId: 0, tryOnSize: "", leftTryOnId: 0, rightTryOnId: 0, sourceOrderNumber: "", fitToolValues: {} }),
          fitId: fits[0].id,
          fitName: fits[0].name,
        };
        changed = true;
      }
    }
    if (changed) onChange({ partFit: { ...state.partFit, ...patch } });
  }, [parts.map((p) => p.id).join(",")]);

  const activePart = parts[activeTab];
  if (!activePart) return <p className="text-xs text-gray-400">Select an item type first.</p>;

  const allTools = catalog.fitToolsByPart[activePart.id] ?? [];
  const pf = state.partFit[activePart.id];
  const fitValues = pf?.fitToolValues ?? {};
  const selectedFitId = pf?.fitId ?? 0;

  const tools = selectedFitId > 0
    ? allTools.filter((t) => t.fitId === selectedFitId || t.fitId === 0)
    : allTools;

  const sections = getFitToolSections(tools);

  function updateFitTool(name: string, value: string) {
    const currentPf = state.partFit[activePart.id] ?? {
      fitAdviseMode: 1, fitProfileId: 0, fitProfileName: "", fitId: 0, fitName: "", tryOnType: "", tryOnId: 0, tryOnSize: "", leftTryOnId: 0, rightTryOnId: 0, sourceOrderNumber: "", fitToolValues: {},
    };
    onChange({
      partFit: {
        ...state.partFit,
        [activePart.id]: {
          ...currentPf,
          fitToolValues: { ...currentPf.fitToolValues, [name]: value },
        },
      },
    });
  }

  function resetAll() {
    const currentPf = state.partFit[activePart.id] ?? {
      fitAdviseMode: 1, fitProfileId: 0, fitProfileName: "", fitId: 0, fitName: "", tryOnType: "", tryOnId: 0, tryOnSize: "", leftTryOnId: 0, rightTryOnId: 0, sourceOrderNumber: "", fitToolValues: {},
    };
    const newVals = { ...currentPf.fitToolValues };
    for (const t of tools) newVals[t.name] = t.defaultValue;
    onChange({ partFit: { ...state.partFit, [activePart.id]: { ...currentPf, fitToolValues: newVals } } });
  }

  if (allTools.length === 0) return <p className="text-xs text-gray-400">No fit tools for this item type.</p>;

  if (selectedFitId === 0) {
    return (
      <div className="space-y-3">
        <PartTabs parts={parts} active={activeTab} onSelect={setActiveTab} />
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-700">Select a fit in the Fit Profile step first to see available fit tools.</p>
        </div>
      </div>
    );
  }

  if (tools.length === 0) return <p className="text-xs text-gray-400">No fit tools for this fit.</p>;

  const modifiedCount = tools.filter((t) => parseFloat(fitValues[t.name] ?? t.defaultValue) !== 0).length;

  function expandAll() { setCollapsed({}); }
  function collapseAll() {
    const c: Record<string, boolean> = {};
    for (const s of sections) c[`${activePart.id}-${s}`] = true;
    setCollapsed(c);
  }

  function renderTool(tool: typeof tools[number]) {
    const val = parseFloat(fitValues[tool.name] ?? tool.defaultValue);
    const isModified = val !== 0;
    return (
      <div key={tool.name} className={`flex items-center justify-between gap-2 py-1.5 ${isModified ? "bg-blue-50/60 px-2 rounded" : ""}`}>
        <span className={`text-xs leading-tight ${isModified ? "font-medium text-gray-800" : "text-gray-600"}`}>{tool.name}</span>
        <NumericStepper
          value={val}
          onChange={(v) => updateFitTool(tool.name, v.toString())}
          step={tool.step || 0.5}
          min={tool.min ?? -12}
          max={tool.max ?? 4}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PartTabs parts={parts} active={activeTab} onSelect={setActiveTab} />

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {pf?.tryOnSize && (
            <span className="text-[10px] text-gray-500">TryOn <span className="font-semibold text-gray-700">{pf.tryOnSize}</span></span>
          )}
          <p className="text-[10px] text-gray-400">{tools.length} tools{modifiedCount > 0 && <> &middot; <span className="font-semibold text-blue-600">{modifiedCount} modified</span></>}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={expandAll} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-50">Expand all</button>
          <button type="button" onClick={collapseAll} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-50">Collapse all</button>
          <button type="button" onClick={resetAll} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-50">Reset all</button>
        </div>
      </div>

      {sections.map((section) => {
        const sectionTools = tools.filter((t) => t.section === section);
        const key = `${activePart.id}-${section}`;
        const isCollapsed = collapsed[key];
        const sectionModified = sectionTools.filter((t) => parseFloat(fitValues[t.name] ?? t.defaultValue) !== 0).length;
        const midpoint = Math.ceil(sectionTools.length / 2);
        const leftCol = sectionTools.slice(0, midpoint);
        const rightCol = sectionTools.slice(midpoint);

        return (
          <div key={section} className="overflow-hidden">
            <button
              onClick={() => setCollapsed({ ...collapsed, [key]: !isCollapsed })}
              className="flex w-full items-center justify-between rounded-t-md bg-gray-200 px-3 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-300"
              type="button"
            >
              <div className="flex items-center gap-2">
                <IconChevron open={!isCollapsed} />
                <span>{section}</span>
              </div>
              {sectionModified > 0 && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">{sectionModified}</span>}
            </button>
            {!isCollapsed && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-0 border border-t-0 border-gray-200 rounded-b-md px-3 py-2">
                <div className="space-y-0">{leftCol.map(renderTool)}</div>
                <div className="space-y-0">{rightCol.map(renderTool)}</div>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[10px] text-gray-400">Use +/&minus; to adjust fit values. Only non-zero values are sent with the order.</p>
    </div>
  );
}

// ── Step 5: Design Options ───────────────────────────────────────────────────

function StepDesignOptions({
  state,
  onChange,
  catalog,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  catalog: CatalogData;
}) {
  const parts = getActiveParts(state, catalog);
  const [activeTab, setActiveTab] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const activePart = parts[activeTab];
  if (!activePart) return <p className="text-xs text-gray-400">Select an item type first.</p>;

  const allCategories = catalog.designOptionsByPart[activePart.id] ?? [];
  const categories = allCategories.filter((c) => !c.isMonogram);
  const partDesign = state.partDesign[activePart.id] ?? { selectedOptions: {} };
  const conflicts = checkDesignOptionConflicts(activePart.id, partDesign.selectedOptions, catalog.designOptionConflicts);

  function updateOption(optionId: number, valueId: number | string, label: string) {
    const current = state.partDesign[activePart.id] ?? { selectedOptions: {} };
    onChange({
      partDesign: {
        ...state.partDesign,
        [activePart.id]: {
          ...current,
          selectedOptions: { ...current.selectedOptions, [optionId]: { valueId, label } },
        },
      },
    });
  }

  if (categories.length === 0) return <p className="text-xs text-gray-400">No design options for this item type.</p>;

  return (
    <div className="space-y-3">
      <PartTabs parts={parts} active={activeTab} onSelect={setActiveTab} />

      {conflicts.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-red-700 mb-1">Conflict detected</p>
          {conflicts.map((msg, i) => (
            <p key={i} className="text-xs text-red-600">{msg}</p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
        <IconGarment />
        <span className="text-xs text-gray-500">Model:</span>
        <span className="text-xs font-semibold text-gray-800">
          {catalog.modelsByPart[activePart.id]?.find((m) => m.id === state.modelByPart[activePart.id])?.name ?? catalog.modelsByPart[activePart.id]?.[0]?.name ?? "Design from Scratch"}
        </span>
      </div>

      {(() => {
        // Separate single-option categories (render flat) from multi-option categories (render as collapsible sections)
        const flatOptions: typeof categories[0]["options"] = [];
        const groupedCategories: typeof categories = [];
        for (const cat of categories) {
          if (cat.options.length === 1) {
            flatOptions.push(cat.options[0]);
          } else {
            groupedCategories.push(cat);
          }
        }

        function renderOption(opt: typeof flatOptions[0]) {
          const sel = partDesign.selectedOptions[opt.optionId];
          if (opt.values.length === 0) {
            return (
              <div key={opt.optionId} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="shrink-0 text-xs text-gray-600">{opt.name}</span>
                <input
                  type="text"
                  value={sel?.label ?? ""}
                  onChange={(e) => updateOption(opt.optionId, 0, e.target.value)}
                  className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 max-w-[200px] w-full focus:border-blue-500 focus:outline-none"
                  placeholder="Enter..."
                />
              </div>
            );
          }
          return (
            <div key={opt.optionId} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="shrink-0 text-xs text-gray-600">{opt.name}</span>
              <div className="max-w-[220px] w-full">
                <TermSelect
                  options={[
                    { value: "", label: "—" },
                    ...opt.values.map((v) => ({ value: `${v.valueId}::${v.label}`, label: v.label })),
                  ]}
                  value={sel ? `${sel.valueId}::${sel.label}` : ""}
                  onChange={(v) => {
                    if (!v) return;
                    const [vid, ...rest] = v.split("::");
                    const numVid = Number(vid);
                    updateOption(opt.optionId, isNaN(numVid) ? vid : numVid, rest.join("::"));
                  }}
                  compact
                />
              </div>
            </div>
          );
        }

        return (
          <>
            {flatOptions.length > 0 && (
              <div className="rounded-md border border-gray-200 divide-y divide-gray-100">
                {flatOptions.map(renderOption)}
              </div>
            )}
            {groupedCategories.map((cat) => {
              const key = `${activePart.id}-${cat.categoryId}`;
              const isCollapsed = collapsed[key];
              return (
                <div key={key} className="rounded-md border border-gray-200">
                  <button
                    onClick={() => setCollapsed({ ...collapsed, [key]: !isCollapsed })}
                    className="flex w-full items-center justify-between rounded-t-md bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hover:bg-gray-100"
                    type="button"
                  >
                    <span>{cat.categoryName}</span>
                    <IconChevron open={!isCollapsed} />
                  </button>
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-100">
                      {cat.options.map(renderOption)}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        );
      })()}
    </div>
  );
}

// ── Monogram thread colour swatches ──────────────────────────────────────────

const MONOGRAM_THREAD_COLORS: Record<string, string> = {
  "white": "#FFFFFF",
  "off white": "#F5F0E1",
  "silver": "#C0C0C0",
  "light grey": "#D3D3D3",
  "mid grey": "#999999",
  "anthracite": "#3E3E3E",
  "black": "#1A1A1A",
  "sand": "#C2B280",
  "light brown": "#C4A882",
  "mid brown": "#8B6914",
  "chocolate brown": "#4E2E0F",
  "dark brown": "#3B1F00",
  "light green": "#8FBF6F",
  "forest green": "#228B22",
  "dark green": "#1B5E20",
  "light blue": "#90C4E8",
  "sky blue": "#5BA3D9",
  "royal blue": "#2962FF",
  "navy blue": "#1A237E",
  "slate blue": "#5C6BC0",
  "midnight blue": "#1A1A4E",
  "purple": "#7B1FA2",
  "violet": "#9C27B0",
  "pink": "#F48FB1",
  "red": "#E53935",
  "dark red": "#8B0000",
  "wine red": "#722F37",
  "orange": "#F57C00",
  "oxide red": "#742C2C",
  "gold": "#D4A017",
};

function ThreadSwatch({ color, size = 20 }: { color: string; size?: number }) {
  const hex = MONOGRAM_THREAD_COLORS[color.toLowerCase()];
  if (!hex) return null;
  const isLight = ["white", "off white", "silver", "light grey"].includes(color.toLowerCase());
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${isLight ? "border border-gray-200" : ""}`}
      style={{ width: size, height: size, backgroundColor: hex }}
    />
  );
}

function BestMatchBadge() {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
      <span className="text-[6px] font-bold uppercase leading-none text-gray-500">BM</span>
    </span>
  );
}

// ── Step 6: Monogram & Branding ──────────────────────────────────────────────

function StepMonogramBranding({
  state,
  onChange,
  catalog,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  catalog: CatalogData;
}) {
  const parts = getActiveParts(state, catalog);

  const selectedCat = (catalog.itemTypeCategories ?? []).find((c) => c.id === state.selectedCategoryId);
  const hasLining = selectedCat?.fieldConfig?.showLining ?? false;

  // Dynamically gather ALL monogram categories (is_monogram flag set at import)
  const monogramOptionsByPart = parts
    .map((p) => {
      const cats = (catalog.designOptionsByPart[p.id] ?? []).filter((c) => c.isMonogram);
      return { part: p, cats };
    })
    .filter((x) => x.cats.length > 0);

  // Flatten all monogram options across parts and categories
  const allMonogramOptions = monogramOptionsByPart.flatMap((x) =>
    x.cats.flatMap((c) => c.options)
  );

  const hasMonogramOptions = allMonogramOptions.length > 0;

  // Classify options by role using name heuristics (fully dynamic)
  function classifyMonogramOption(opt: { optionId: number; name: string; values: { valueId: number | string; label: string }[] }) {
    const n = opt.name.toLowerCase();
    if (n.includes("position") || n.includes("monogram ties") || n.includes("monogram shirt") || n.includes("monogram pocket")) return "position";
    if (n.includes("colour") || n.includes("color") || n.includes("designoptions")) return "colour";
    if (n.includes("font")) return "font";
    if (n.includes("length")) return "length";
    // Fallback: check values for colour-like content
    const firstVal = opt.values[0]?.label?.toLowerCase() ?? "";
    if (firstVal.includes("match") || firstVal.includes("white") || firstVal.includes("black")) return "colour";
    return "other";
  }

  const classified = allMonogramOptions.map((opt) => ({ ...opt, role: classifyMonogramOption(opt) }));
  const positionOpts = classified.filter((o) => o.role === "position");
  const colourOpts = classified.filter((o) => o.role === "colour");
  const fontOpts = classified.filter((o) => o.role === "font");
  const otherOpts = classified.filter((o) => o.role === "other" || o.role === "length");

  function updateMonogramDesign(optionId: number, valueId: number | string, label: string) {
    const current = { ...state.monogram };
    const n = allMonogramOptions.find((o) => o.optionId === optionId)?.name?.toLowerCase() ?? "";
    if (n.includes("position") || n.includes("monogram ties") || n.includes("monogram shirt") || n.includes("monogram pocket")) {
      current.MonogramPositionId = Number(valueId);
    } else if (n.includes("colour") || n.includes("color") || n.includes("designoptions")) {
      current.MonogramColourId = Number(valueId);
    } else if (n.includes("font")) {
      current.MonogramFontId = Number(valueId);
    } else if (n.includes("length")) {
      current.MonogramLengthId = Number(valueId);
    }
    onChange({ monogram: current, partDesign: {
      ...state.partDesign,
      ...Object.fromEntries(parts.map((p) => {
        const existing = state.partDesign[p.id] ?? { selectedOptions: {} };
        return [p.id, { ...existing, selectedOptions: { ...existing.selectedOptions, [optionId]: { valueId, label } } }];
      })),
    }});
  }

  function renderMonogramSelect(label: string, opts: typeof classified, isColour = false) {
    if (opts.length === 0) return null;
    const opt = opts[0];
    const pd = state.partDesign[parts[0]?.id] ?? { selectedOptions: {} };
    const sel = pd.selectedOptions[opt.optionId];

    let values = opt.values;
    if (isColour && !hasLining) {
      values = values.filter((v) => !v.label.toLowerCase().includes("best match with lining"));
    }

    function getColourIcon(lbl: string): React.ReactNode | undefined {
      if (!isColour) return undefined;
      const lower = lbl.toLowerCase();
      if (lower.includes("best match")) return <BestMatchBadge />;
      if (MONOGRAM_THREAD_COLORS[lower]) return <ThreadSwatch color={lower} />;
      return undefined;
    }

    return (
      <TermSelect
        label={label}
        options={[
          { value: "", label: "—" },
          ...values.map((v) => ({
            value: `${v.valueId}::${v.label}`,
            label: v.label,
            icon: getColourIcon(v.label),
          })),
        ]}
        value={sel ? `${sel.valueId}::${sel.label}` : ""}
        onChange={(v) => {
          if (!v) return;
          const [vid, ...rest] = v.split("::");
          const numVid = Number(vid);
          updateMonogramDesign(opt.optionId, isNaN(numVid) ? vid : numVid, rest.join("::"));
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {hasMonogramOptions ? (
        <div className="rounded-md border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Monogram</SectionLabel>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={state.monogramEnabled} onChange={(e) => onChange({ monogramEnabled: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              Enable
            </label>
          </div>

          {state.monogramEnabled && (
            <div className="space-y-3">
              {renderMonogramSelect("Position", positionOpts)}
              <div className="grid grid-cols-2 gap-3">
                {renderMonogramSelect("Colour", colourOpts, true)}
                {renderMonogramSelect("Font", fontOpts)}
              </div>
              {otherOpts.map((opt) => {
                const pd = state.partDesign[parts[0]?.id] ?? { selectedOptions: {} };
                const sel = pd.selectedOptions[opt.optionId];
                return (
                  <TermSelect
                    key={opt.optionId}
                    label={opt.name}
                    options={[{ value: "", label: "—" }, ...opt.values.map((v) => ({ value: `${v.valueId}::${v.label}`, label: v.label }))]}
                    value={sel ? `${sel.valueId}::${sel.label}` : ""}
                    onChange={(v) => {
                      if (!v) return;
                      const [vid, ...rest] = v.split("::");
                      const numVid = Number(vid);
                      updateMonogramDesign(opt.optionId, isNaN(numVid) ? vid : numVid, rest.join("::"));
                    }}
                  />
                );
              })}
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Text (Line 1)</label>
                <input
                  value={state.monogram.MonogramFirstLine}
                  onChange={(e) => onChange({ monogram: { ...state.monogram, MonogramFirstLine: e.target.value.toUpperCase() } })}
                  className={inputCls}
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Text (Line 2)</label>
                <input
                  value={state.monogram.MonogramSecondLine}
                  onChange={(e) => onChange({ monogram: { ...state.monogram, MonogramSecondLine: e.target.value.toUpperCase() } })}
                  className={inputCls}
                  placeholder="Optional"
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              <p className="text-xs font-semibold text-red-600">**Monogram only possible in CAPITAL letters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-xs text-gray-400 italic">No monogram options available for this product type.</p>
        </div>
      )}

      <div className="rounded-md border border-gray-200 p-4 space-y-4">
        <SectionLabel>Branding</SectionLabel>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={state.showSize} onChange={(e) => onChange({ showSize: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Size label
        </label>

        {parts.some((p) => catalog.brandingPositionsByPart[p.id]) && (
          <div className="space-y-2">
            {state.brandingEntries.map((entry, idx) => {
              const positions = parts.flatMap((p) => catalog.brandingPositionsByPart[p.id] ?? []);
              const selectedPos = positions.find((p) => p.positionId === entry.PositionId);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <TermSelect
                      options={[{ value: 0, label: "Position..." }, ...positions.map((p) => ({ value: p.positionId, label: p.positionName }))]}
                      value={entry.PositionId}
                      onChange={(v) => {
                        const updated = [...state.brandingEntries];
                        updated[idx] = { ...updated[idx], PositionId: Number(v), LabelId: 0 };
                        onChange({ brandingEntries: updated });
                      }}
                      compact
                    />
                  </div>
                  {selectedPos && (
                    <div className="flex-1">
                      <TermSelect
                        options={[{ value: 0, label: "Label..." }, ...selectedPos.labels.map((l) => ({ value: l.labelId, label: l.labelName }))]}
                        value={entry.LabelId}
                        onChange={(v) => {
                          const updated = [...state.brandingEntries];
                          updated[idx] = { ...updated[idx], LabelId: Number(v) };
                          onChange({ brandingEntries: updated });
                        }}
                        compact
                      />
                    </div>
                  )}
                  <button onClick={() => onChange({ brandingEntries: state.brandingEntries.filter((_, i) => i !== idx) })} type="button" className="rounded border border-gray-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                    Remove
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => onChange({ brandingEntries: [...state.brandingEntries, { LabelId: 0, PositionId: 0 }] })}
              type="button"
              className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
            >
              + Add branding label
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 7: Review ───────────────────────────────────────────────────────────

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-medium text-gray-800 text-right max-w-[55%] truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function ReviewSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border border-gray-200 overflow-hidden">
      <button onClick={() => setOpen(!open)} type="button" className="flex w-full items-center justify-between bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hover:bg-gray-100">
        <span>{title}</span>
        <IconChevron open={open} />
      </button>
      {open && <div className="px-3 py-2 space-y-0.5">{children}</div>}
    </div>
  );
}

function StepReview({
  state,
  onChange,
  onSubmit,
  onSaveDraft,
  submitting,
  savingDraft,
  catalog,
  pricing,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  submitting: boolean;
  savingDraft: boolean;
  catalog: CatalogData;
  pricing: PricingData | null;
}) {
  const parts = getActiveParts(state, catalog);

  return (
    <div className="space-y-3">
      <ReviewSection title="Primary Info">
        <ReviewRow label="Customer" value={state.customer ? `${state.customer.FirstName} ${state.customer.LastName}` : ""} />
        <ReviewRow label="Item" value={`${state.itemType?.Name ?? ""} · Qty ${state.quantity}`} />
        <ReviewRow label="Sales Person" value={catalog.salesAssociates.find((s) => s.id === state.salesPersonId)?.name ?? "—"} />
        {parts.map((p) => (
          <ReviewRow key={`model-${p.id}`} label={`${p.name} Model`} value={catalog.modelsByPart[p.id]?.find((m) => m.id === state.modelByPart[p.id])?.name ?? catalog.modelsByPart[p.id]?.[0]?.name ?? "—"} />
        ))}
        {parts.map((p) => (
          <ReviewRow key={`make-${p.id}`} label={`${p.name} Make`} value={catalog.makesByPart[p.id]?.find((m) => m.id === (state.makeByPart[p.id]))?.name ?? catalog.makesByPart[p.id]?.[0]?.name ?? "—"} />
        ))}
        {(() => {
          const sc = (catalog.itemTypeCategories ?? []).find((c) => c.id === state.selectedCategoryId);
          const rfc = sc?.fieldConfig;
          return (
            <>
              {rfc?.showCanvas && catalog.canvasOptions.length > 0 && parts.map((p) => (
                <ReviewRow key={`canvas-${p.id}`} label={`${p.name} Canvas`} value={catalog.canvasOptions.find((c) => c.valueId === state.canvasByPart[p.id])?.label ?? catalog.canvasOptions[0]?.label ?? "—"} />
              ))}
              {(rfc?.showFabricSearch ?? true) && (
                <ReviewRow label="Fabric" value={state.fabric?.label ?? ""} mono />
              )}
              {(rfc?.showLining ?? false) && (
                <ReviewRow label="Lining" value={
                  state.liningMode === 1
                    ? (state.lining?.label ?? "none")
                    : state.fabric
                      ? `${catalog.liningModes.find((m) => m.id === state.liningMode)?.name} → ${resolveBestMatchLining(state.fabric.Name, state.liningMode as 2 | 3, catalog.liningColorMap).name}`
                      : (catalog.liningModes.find((m) => m.id === state.liningMode)?.name ?? "—")
                } />
              )}
              {(rfc?.showButtons ?? false) && (
                <ReviewRow label="Buttons" value={catalog.buttonOptions.find((b) => b.trimId === state.buttonTrimId)?.label ?? "none"} />
              )}
            </>
          );
        })()}
        <ReviewRow label="Occasion" value={state.occasion} />
        <ReviewRow label="Shop Order #" value={state.shopOrderNumber} mono />
      </ReviewSection>

      <ReviewSection title="Fit & TryOn">
        {(() => {
          const reviewCat = (catalog.itemTypeCategories ?? []).find((c) => c.id === state.selectedCategoryId);
          const reviewIsShoe = reviewCat?.fieldConfig?.isShoeOrder ?? false;
          return parts.map((p) => {
            const pf = state.partFit[p.id];
            const tryons = catalog.tryonSizesByPart[p.id] ?? [];
            return (
              <div key={p.id} className="mb-1.5">
                <p className="text-xs font-semibold text-gray-700 mb-0.5">{p.name}</p>
                <ReviewRow label="FitProfile" value={pf?.fitProfileName ?? ""} />
                <ReviewRow label="Fit" value={pf?.fitName ?? ""} />
                {reviewIsShoe ? (
                  <>
                    <ReviewRow label="Left TryOn" value={tryons.find((t) => t.id === pf?.leftTryOnId)?.label ?? ""} />
                    <ReviewRow label="Right TryOn" value={tryons.find((t) => t.id === pf?.rightTryOnId)?.label ?? ""} />
                  </>
                ) : (
                  <ReviewRow label="TryOn" value={pf?.tryOnSize ?? ""} />
                )}
              </div>
            );
          });
        })()}
      </ReviewSection>

      <ReviewSection title="Fit Tools" defaultOpen={false}>
        {parts.map((p) => {
          const pf = state.partFit[p.id];
          const vals = pf?.fitToolValues ?? {};
          const allTools = catalog.fitToolsByPart[p.id] ?? [];
          const fitId = pf?.fitId ?? 0;
          const partTools = fitId > 0 ? allTools.filter((t) => t.fitId === fitId || t.fitId === 0) : allTools;
          const modifiedTools = partTools.filter((t) => {
            const val = parseFloat(vals[t.name] ?? t.defaultValue);
            return val !== 0;
          });
          return (
            <div key={p.id} className="mb-1.5">
              <p className="text-xs font-semibold text-gray-700 mb-0.5">{p.name}</p>
              {modifiedTools.length === 0 ? (
                <p className="text-[10px] text-gray-400">All standard</p>
              ) : (
                modifiedTools.map((t) => {
                  const num = parseFloat(vals[t.name] ?? t.defaultValue);
                  const display = num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
                  return <ReviewRow key={t.name} label={t.name} value={display} mono />;
                })
              )}
            </div>
          );
        })}
      </ReviewSection>

      <ReviewSection title="Design Options" defaultOpen={false}>
        {parts.map((p) => {
          const pd = state.partDesign[p.id];
          const categories = (catalog.designOptionsByPart[p.id] ?? []).filter((c) => !c.isMonogram);
          return (
            <div key={p.id} className="mb-1.5">
              <p className="text-xs font-semibold text-gray-700 mb-0.5">{p.name}</p>
              {categories.map((cat) =>
                cat.options.map((opt) => {
                  const sel = pd?.selectedOptions[opt.optionId];
                  if (!sel) return null;
                  return <ReviewRow key={opt.optionId} label={opt.name} value={sel.label} />;
                })
              )}
            </div>
          );
        })}
      </ReviewSection>

      {(state.monogramEnabled || state.brandingEntries.length > 0) && (
        <ReviewSection title="Monogram & Branding">
          {state.monogramEnabled && (
            <>
              <ReviewRow label="Monogram Text" value={`${state.monogram.MonogramFirstLine} ${state.monogram.MonogramSecondLine}`.trim()} />
            </>
          )}
          {state.brandingEntries.length > 0 && state.brandingEntries.map((b, i) => (
            <ReviewRow key={i} label={`Label ${i + 1}`} value={`Pos ${b.PositionId} · Label ${b.LabelId}`} mono />
          ))}
          <ReviewRow label="Size label" value={state.showSize ? "Yes" : "No"} />
        </ReviewSection>
      )}

      {(() => {
        const reviewParts = getActiveParts(state, catalog);
        const firstMake = reviewParts.length > 0
          ? (catalog.makesByPart[reviewParts[0].id]?.find((m) => m.id === state.makeByPart[reviewParts[0].id])?.name
            ?? catalog.makesByPart[reviewParts[0].id]?.[0]?.name ?? null)
          : null;
        const reviewButtonLabel = catalog.buttonOptions.find((b) => b.trimId === state.buttonTrimId)?.label ?? null;
        const reviewLiningType: "solid" | "bemberg" | "manual" | null =
          state.liningMode === 1 ? "manual" : state.liningMode === 2 ? "solid" : state.liningMode === 3 ? "bemberg" : null;
        const reviewDesignOpts = collectDesignOptionsForPricing(state, catalog);
        const monoLines = state.monogramEnabled ? [state.monogram.MonogramFirstLine, state.monogram.MonogramSecondLine].filter(Boolean).length : 0;
        const bd = computePricing({
          priceCategory: state.fabric?.priceCategories ?? null,
          garmentTypeName: state.itemType?.Name ?? null,
          makeName: firstMake,
          liningType: reviewLiningType,
          buttonLabel: reviewButtonLabel,
          quantity: state.quantity,
          pricing,
          designOptions: reviewDesignOpts,
          monogramEnabled: state.monogramEnabled,
          monogramLineCount: monoLines,
        });
        if (bd.missingPricing) return null;
        return (
          <ReviewSection title="Price Breakdown">
            <div className="space-y-1.5">
              <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-gray-300">
                <span />
                <div className="flex gap-3">
                  <span className="w-16 text-right">Cost</span>
                  <span className="w-16 text-right">Sale</span>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">{bd.garmentType} ({bd.construction})</span>
                <div className="flex gap-3">
                  <span className="w-16 text-right font-mono text-gray-400">{formatGbp(bd.baseCostEur! * bd.eurToGbp)}</span>
                  <span className="w-16 text-right font-mono text-gray-900">{formatGbp(bd.salePrice)}</span>
                </div>
              </div>
              {bd.liningUpchargeGbp > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Lining upcharge</span>
                  <div className="flex gap-3">
                    <span className="w-16 text-right font-mono text-gray-400">+{formatGbp(bd.liningUpchargeEur * bd.eurToGbp)}</span>
                    <span className="w-16 text-right font-mono text-gray-900">+{formatGbp(bd.liningUpchargeGbp)}</span>
                  </div>
                </div>
              )}
              {bd.buttonUpchargeGbp > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Button upcharge</span>
                  <div className="flex gap-3">
                    <span className="w-16 text-right font-mono text-gray-400">+{formatGbp(bd.buttonUpchargeEur * bd.eurToGbp)}</span>
                    <span className="w-16 text-right font-mono text-gray-900">+{formatGbp(bd.buttonUpchargeGbp)}</span>
                  </div>
                </div>
              )}
              {bd.surchargeItems.map((si, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-600 truncate max-w-[55%]">{si.label}</span>
                  <div className="flex gap-3">
                    <span className="w-16 text-right font-mono text-gray-400">+{formatGbp(si.costGbp)}</span>
                    <span className="w-16 text-right font-mono text-gray-900">+{formatGbp(si.saleGbp)}</span>
                  </div>
                </div>
              ))}
              {bd.quantity > 1 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">x{bd.quantity}</span>
                  <span className="font-mono text-gray-400">{formatGbp(bd.subtotalSale)}</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-200 pt-1.5" />
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total cost</span>
                <span className="font-mono text-gray-500">{formatGbp(bd.costGbp! * bd.quantity)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Sale price (excl. VAT)</span>
                <span className="font-mono text-gray-900">{formatGbp(bd.subtotalSale)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">VAT (20%)</span>
                <span className="font-mono text-gray-400">{formatGbp(bd.vat)}</span>
              </div>
              <div className="border-t border-gray-200 pt-1.5" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-900">Total (incl. VAT)</span>
                <span className="font-mono text-gray-900">{formatGbp(bd.total)}</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1">1€ = £{bd.eurToGbp.toFixed(4)} (live rate)</p>
            </div>
          </ReviewSection>
        );
      })()}

      <div className="rounded-md border border-gray-200 p-4 space-y-3">
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input type="checkbox" checked={state.confirmed} onChange={(e) => onChange({ confirmed: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          I have reviewed and confirm this order
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={state.skipWarnings} onChange={(e) => onChange({ skipWarnings: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Skip warnings
        </label>
        <div className="flex gap-2">
          <button onClick={onSaveDraft} disabled={savingDraft || submitting} type="button" className="flex-1 rounded-md border border-gray-300 bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
            {savingDraft ? "Saving..." : "Save as Draft"}
          </button>
          <button onClick={onSubmit} disabled={!state.confirmed || submitting || savingDraft} type="button" className="flex-1 rounded-md bg-gray-900 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40">
            {submitting ? "Submitting..." : "Submit to GoCreate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live Order Summary (right panel) ─────────────────────────────────────────

function PriceRow({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${muted ? "text-gray-400" : "text-gray-600"}`}>{label}</span>
      <span className={`font-mono text-[11px] ${bold ? "font-semibold text-gray-900" : muted ? "text-gray-400" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

function OrderSummary({ state, catalog, pricing }: { state: WizardState; catalog: CatalogData; pricing: PricingData | null }) {
  const parts = getActiveParts(state, catalog);

  const fitToolCount = parts.reduce((acc, p) => {
    const pf = state.partFit[p.id];
    const vals = pf?.fitToolValues ?? {};
    const fitId = pf?.fitId ?? 0;
    const allTools = catalog.fitToolsByPart[p.id] ?? [];
    const partTools = fitId > 0 ? allTools.filter((t) => t.fitId === fitId || t.fitId === 0) : allTools;
    return acc + partTools.filter((t) => parseFloat(vals[t.name] ?? t.defaultValue) !== 0).length;
  }, 0);

  const designCount = parts.reduce((acc, p) => {
    const pd = state.partDesign[p.id];
    return acc + Object.keys(pd?.selectedOptions ?? {}).length;
  }, 0);

  const firstPartMake = parts.length > 0
    ? (catalog.makesByPart[parts[0].id]?.find((m) => m.id === state.makeByPart[parts[0].id])?.name
      ?? catalog.makesByPart[parts[0].id]?.[0]?.name
      ?? null)
    : null;

  const buttonLabel = catalog.buttonOptions.find((b) => b.trimId === state.buttonTrimId)?.label ?? null;

  const liningType: "solid" | "bemberg" | "manual" | null =
    state.liningMode === 1 ? "manual" :
    state.liningMode === 2 ? "solid" :
    state.liningMode === 3 ? "bemberg" : null;

  const sidebarDesignOpts = collectDesignOptionsForPricing(state, catalog);
  const sidebarMonoLines = state.monogramEnabled ? [state.monogram.MonogramFirstLine, state.monogram.MonogramSecondLine].filter(Boolean).length : 0;

  const breakdown = computePricing({
    priceCategory: state.fabric?.priceCategories ?? null,
    garmentTypeName: state.itemType?.Name ?? null,
    makeName: firstPartMake,
    liningType,
    buttonLabel,
    quantity: state.quantity,
    pricing,
    designOptions: sidebarDesignOpts,
    monogramEnabled: state.monogramEnabled,
    monogramLineCount: sidebarMonoLines,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <IconClipboard />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Order Summary</h3>
      </div>

      {/* Customer */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Customer</p>
        {state.customer ? (
          <p className="text-sm font-medium text-gray-900">{state.customer.FirstName} {state.customer.LastName}</p>
        ) : (
          <p className="text-xs text-gray-300 italic">Not selected</p>
        )}
      </div>

      {/* Item */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Item</p>
        {state.itemType ? (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{state.itemType.Name}</p>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">x{state.quantity}</span>
          </div>
        ) : (
          <p className="text-xs text-gray-300 italic">Not selected</p>
        )}
      </div>

      {/* Parts */}
      {parts.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Parts</p>
          {parts.map((p) => {
            const model = catalog.modelsByPart[p.id]?.find((m) => m.id === state.modelByPart[p.id])?.name ?? catalog.modelsByPart[p.id]?.[0]?.name;
            const make = catalog.makesByPart[p.id]?.find((m) => m.id === state.makeByPart[p.id])?.name ?? catalog.makesByPart[p.id]?.[0]?.name;
            return (
              <div key={p.id} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-700">{p.name}</span>
                <span className="text-[10px] text-gray-400">{model} / {make}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Materials */}
      <div className="space-y-1.5 border-t border-gray-100 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Materials</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Fabric</span>
          <span className="max-w-[55%] truncate text-right font-mono text-[10px] text-gray-800">{state.fabric?.label ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Lining</span>
          <span className="max-w-[55%] truncate text-right font-mono text-[10px] text-gray-800">
            {state.liningMode === 1
              ? (state.lining?.label ?? "—")
              : state.fabric
                ? resolveBestMatchLining(state.fabric.Name, state.liningMode as 2 | 3, catalog.liningColorMap).name
                : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Buttons</span>
          <span className="max-w-[55%] truncate text-right text-[10px] text-gray-800">{buttonLabel ?? "—"}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1.5 border-t border-gray-100 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Configuration</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Fit Adjustments</span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">{fitToolCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Design Options</span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">{designCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Monogram</span>
          <span className={`text-[10px] ${state.monogramEnabled ? "text-blue-600 font-medium" : "text-gray-400"}`}>{state.monogramEnabled ? "Yes" : "No"}</span>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-1.5 border-t border-gray-100 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Pricing</p>
        {breakdown.missingPricing ? (
          <p className="text-[10px] text-gray-300 italic">{state.fabric && state.itemType ? "No pricing data for this combination" : "Select fabric & item to see pricing"}</p>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between text-[9px] font-medium uppercase tracking-wider text-gray-300">
              <span />
              <div className="flex gap-2">
                <span className="w-14 text-right">Cost</span>
                <span className="w-14 text-right">Sale</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">{breakdown.garmentType}</span>
              <div className="flex gap-2">
                <span className="w-14 text-right font-mono text-[10px] text-gray-400">{formatGbp(breakdown.baseCostEur! * breakdown.eurToGbp)}</span>
                <span className="w-14 text-right font-mono text-[11px] text-gray-800">{formatGbp(breakdown.salePrice)}</span>
              </div>
            </div>
            <p className="text-[9px] text-gray-300 -mt-0.5 mb-0.5">{breakdown.construction}</p>
            {breakdown.liningUpchargeGbp > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Lining</span>
                <div className="flex gap-2">
                  <span className="w-14 text-right font-mono text-[10px] text-gray-400">+{formatGbp(breakdown.liningUpchargeEur * breakdown.eurToGbp)}</span>
                  <span className="w-14 text-right font-mono text-[11px] text-gray-800">+{formatGbp(breakdown.liningUpchargeGbp)}</span>
                </div>
              </div>
            )}
            {breakdown.buttonUpchargeGbp > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Buttons</span>
                <div className="flex gap-2">
                  <span className="w-14 text-right font-mono text-[10px] text-gray-400">+{formatGbp(breakdown.buttonUpchargeEur * breakdown.eurToGbp)}</span>
                  <span className="w-14 text-right font-mono text-[11px] text-gray-800">+{formatGbp(breakdown.buttonUpchargeGbp)}</span>
                </div>
              </div>
            )}
            {breakdown.surchargeItems.map((si, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 truncate max-w-[45%]" title={si.label}>{si.label}</span>
                <div className="flex gap-2">
                  <span className="w-14 text-right font-mono text-[10px] text-gray-400">+{formatGbp(si.costGbp)}</span>
                  <span className="w-14 text-right font-mono text-[11px] text-gray-800">+{formatGbp(si.saleGbp)}</span>
                </div>
              </div>
            ))}
            {breakdown.quantity > 1 && (
              <PriceRow label={`× ${breakdown.quantity}`} value={formatGbp(breakdown.subtotalSale)} muted />
            )}
            <div className="my-1 border-t border-dashed border-gray-200" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Total cost</span>
              <span className="font-mono text-[10px] text-gray-500">{formatGbp(breakdown.costGbp! * breakdown.quantity)}</span>
            </div>
            <PriceRow label="Sale price (excl. VAT)" value={formatGbp(breakdown.subtotalSale)} />
            <PriceRow label="VAT (20%)" value={formatGbp(breakdown.vat)} muted />
            <PriceRow label="Total (incl. VAT)" value={formatGbp(breakdown.total)} bold />
          </>
        )}
        {!breakdown.missingPricing && (
          <p className="text-[9px] text-gray-300 mt-1">1€ = £{breakdown.eurToGbp.toFixed(4)}</p>
        )}
      </div>

      {state.shopOrderNumber && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Reference</p>
          <p className="font-mono text-xs text-gray-800">{state.shopOrderNumber}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

interface DraftSummary {
  id: string;
  title: string;
  status: string;
  gocreate_id: number | null;
  order_number: string | null;
  created_at: string;
  updated_at: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { catalog, loading: catalogLoading, error: catalogError } = useCatalog();
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [successMode, setSuccessMode] = useState<"draft" | "submitted">("submitted");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [, setDraftsLoading] = useState(true);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [pricing, setPricing] = useState<PricingData | null>(null);

  const STEPS = getVisibleSteps(state, catalog);
  const clampedIdx = Math.min(stepIdx, STEPS.length - 1);
  const step = STEPS[clampedIdx]?.key ?? "customer";
  const setStep = (idx: number) => setStepIdx(Math.max(0, Math.min(idx, STEPS.length - 1)));

  useEffect(() => {
    fetch("/api/pricing").then((r) => r.json()).then((d) => {
      if (d.priceMap) setPricing(d);
    }).catch(() => {});
  }, []);


  const loadDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/drafts/list");
      const data = await res.json();
      if (res.ok && data.drafts) {
        const pending = data.drafts.filter((d: DraftSummary) => d.status === "draft");
        setDrafts(pending);
        if (pending.length > 0) setDraftsOpen(true);
      }
    } catch { /* ignore */ }
    finally { setDraftsLoading(false); }
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  function onChange(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function getAllConflicts(): { part: string; messages: string[] }[] {
    if (!catalog) return [];
    const parts = getActiveParts(state, catalog);
    const results: { part: string; messages: string[] }[] = [];
    for (const p of parts) {
      const pd = state.partDesign[p.id];
      if (!pd) continue;
      const msgs = checkDesignOptionConflicts(p.id, pd.selectedOptions, catalog.designOptionConflicts);
      if (msgs.length > 0) results.push({ part: p.name, messages: msgs });
    }
    return results;
  }

  function canAdvance(): boolean {
    switch (step) {
      case "customer": return !!state.customer;
      case "primary": {
        if (!state.itemType) return false;
        const cat = catalog?.itemTypeCategories?.find((c) => c.id === state.selectedCategoryId);
        const needsFabric = cat?.fieldConfig?.showFabricSearch ?? true;
        if (needsFabric && !state.fabric) return false;
        return true;
      }
      case "design": return getAllConflicts().length === 0;
      default: return true;
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/drafts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId, wizardState: state }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft");
      setDraftId(data.draft.id);
      setSuccessId(data.draft.id);
      setSuccessMode("draft");
      loadDrafts();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSubmit() {
    if (!catalog) return;
    const errors: string[] = [];
    if (!state.customer) errors.push("Customer is required.");
    if (!state.itemType) errors.push("Item combination is required.");
    if (!state.fabric) errors.push("Fabric must be selected.");
    if (!state.salesPersonId) errors.push("Sales person is required.");

    const allConflicts = getAllConflicts();
    if (allConflicts.length > 0) {
      const conflictMsgs = allConflicts.flatMap(c => c.messages.map(m => `${c.part}: ${m}`));
      errors.push("Impossible items — " + conflictMsgs.join("; "));
    }

    if (errors.length > 0) { setSubmitError(errors.join(" ")); return; }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const parts = getActiveParts(state, catalog);
      const payload = buildGoCreatePayload(state, parts, catalog);

      let res: Response;
      let data: Record<string, unknown>;

      if (draftId) {
        res = await fetch(`/api/drafts/${draftId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload }),
        });
        data = await res.json();
      } else {
        res = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      }

      if (!res.ok || !data.success) {
        throw new Error((data.error || data.errorMessage || "Order creation failed") as string);
      }
      setSuccessId(String(data.orderId ?? "OK"));
      setSuccessMode("submitted");
      loadDrafts();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResumeDraft(id: string) {
    try {
      const res = await fetch(`/api/drafts/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(data.draft.wizard_state as WizardState);
      setDraftId(id);
      setStepIdx(0);
      setDraftsOpen(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to load draft");
    }
  }

  async function handleDeleteDraft(id: string) {
    try {
      await fetch(`/api/drafts/${id}`, { method: "DELETE" });
      if (draftId === id) setDraftId(null);
      loadDrafts();
    } catch { /* ignore */ }
  }

  async function handleSubmitDraftDirectly(id: string) {
    if (!catalog) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/drafts/${id}`);
      const draftData = await res.json();
      if (!res.ok) throw new Error(draftData.error);
      const ws = draftData.draft.wizard_state as WizardState;
      const parts = getActiveParts(ws, catalog);
      const payload = buildGoCreatePayload(ws, parts, catalog);

      const submitRes = await fetch(`/api/drafts/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok || !submitData.success) {
        throw new Error(submitData.error || "Order creation failed");
      }
      setSuccessId(String(submitData.orderId ?? "OK"));
      setSuccessMode("submitted");
      loadDrafts();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (catalogLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
          <p className="text-xs text-gray-500">Loading catalog...</p>
        </div>
      </div>
    );
  }

  if (catalogError || !catalog) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">Failed to load catalog</p>
          <p className="text-xs text-gray-500">{catalogError ?? "Unknown error"}</p>
          <button onClick={() => window.location.reload()} type="button" className="rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800">Retry</button>
        </div>
      </div>
    );
  }

  if (successId) {
    const isDraft = successMode === "draft";
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-sm text-center space-y-4">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${isDraft ? "bg-blue-50" : "bg-green-50"}`}>
            {isDraft ? (
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
            ) : (
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">{isDraft ? "Draft Saved" : "Order Submitted to GoCreate"}</p>
          <p className="font-mono text-xs text-gray-500">{isDraft ? "You can resume or submit this later" : `Order ID: ${successId}`}</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => { setState(INITIAL_STATE); setStepIdx(0); setSuccessId(null); setDraftId(null); setSuccessMode("submitted"); }} type="button" className="rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800">Create Another</button>
            {isDraft ? (
              <button onClick={() => { setSuccessId(null); setStepIdx(STEPS.length - 1); }} type="button" className="rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Continue Editing</button>
            ) : (
              <button onClick={() => router.push("/orders")} type="button" className="rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">View Orders</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: Wizard */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-sm font-semibold text-gray-900">New Order</h1>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 sm:px-2">
              {step + 1}/{STEPS.length}
            </span>
            {draftId && (
              <span className="hidden rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 sm:inline-flex">Editing Draft</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {drafts.length > 0 && (
              <button
                type="button"
                onClick={() => setDraftsOpen(!draftsOpen)}
                className="rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-[10px] font-medium text-blue-700 hover:bg-blue-100 sm:px-3 sm:text-xs"
              >
                <span className="sm:hidden">{drafts.length}</span>
                <span className="hidden sm:inline">Drafts ({drafts.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setStep(clampedIdx - 1)}
              disabled={clampedIdx === 0}
              className="rounded border border-gray-200 px-2 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 sm:px-3 sm:text-xs"
            >
              Back
            </button>
            {clampedIdx < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setStep(clampedIdx + 1)}
                disabled={!canAdvance()}
                className="rounded bg-gray-900 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-gray-800 disabled:opacity-30 sm:px-3 sm:text-xs"
              >
                Next
              </button>
            )}
          </div>
        </div>

        {/* Drafts panel */}
        {draftsOpen && drafts.length > 0 && (
          <div className="border-b border-blue-100 bg-blue-50/50 px-3 py-3 sm:px-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-blue-800">Saved Drafts</p>
              <button type="button" onClick={() => setDraftsOpen(false)} className="text-[10px] text-blue-600 hover:text-blue-800">Hide</button>
            </div>
            <div className="space-y-1.5">
              {drafts.map((d) => (
                <div key={d.id} className={`flex flex-col gap-2 rounded-md border bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${draftId === d.id ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200"}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-900">{d.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(d.updated_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => handleResumeDraft(d.id)} className="rounded border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-gray-50">
                      Resume
                    </button>
                    <button type="button" onClick={() => handleSubmitDraftDirectly(d.id)} disabled={submitting} className="rounded bg-gray-900 px-2 py-1 text-[10px] font-medium text-white hover:bg-gray-800 disabled:opacity-40">
                      {submitting ? "..." : "Submit"}
                    </button>
                    <button type="button" onClick={() => handleDeleteDraft(d.id)} className="rounded border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step nav - horizontally scrollable on mobile */}
        <div className="overflow-x-auto border-b border-gray-200 bg-white scrollbar-none">
          <div className="flex px-3 sm:px-6" style={{ minWidth: "max-content" }}>
            {STEPS.map((s, i) => {
              const isActive = i === clampedIdx;
              const isComplete = i < clampedIdx;
              const isClickable = i < clampedIdx;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => isClickable && setStep(i)}
                  className={`relative flex items-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-medium whitespace-nowrap transition sm:px-3 ${
                    isActive
                      ? "border-gray-900 text-gray-900"
                      : isComplete
                        ? "border-transparent text-blue-600 cursor-pointer hover:text-blue-700"
                        : "border-transparent text-gray-400 cursor-default"
                  }`}
                >
                  {isComplete ? (
                    <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="text-gray-400">{s.icon}</span>
                  )}
                  <span className="hidden xs:inline sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-3 sm:p-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">{STEPS[clampedIdx]?.label}</h2>

            {step === "customer" && <StepCustomer selected={state.customer} onSelect={(c) => onChange({ customer: c })} />}
            {step === "primary" && <StepPrimaryInfo state={state} onChange={onChange} catalog={catalog} />}
            {step === "fitprofile" && <StepFitProfile state={state} onChange={onChange} catalog={catalog} />}
            {step === "fittools" && <StepFitTools state={state} onChange={onChange} catalog={catalog} />}
            {step === "design" && <StepDesignOptions state={state} onChange={onChange} catalog={catalog} />}
            {step === "monogram" && <StepMonogramBranding state={state} onChange={onChange} catalog={catalog} />}
            {step === "review" && <StepReview state={state} onChange={onChange} onSubmit={handleSubmit} onSaveDraft={handleSaveDraft} submitting={submitting} savingDraft={savingDraft} catalog={catalog} pricing={pricing} />}

            {submitError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">{submitError}</div>
            )}

            {/* Mobile summary (below content on small screens) */}
            <div className="mt-6 rounded border border-gray-200 bg-white p-4 lg:hidden">
              <OrderSummary state={state} catalog={catalog} pricing={pricing} />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Order Summary (desktop only) */}
      <div className="hidden w-80 shrink-0 border-l border-gray-200 bg-white lg:block">
        <div className="sticky top-0 h-full overflow-y-auto p-5">
          <OrderSummary state={state} catalog={catalog} pricing={pricing} />
        </div>
      </div>
    </div>
  );
}
