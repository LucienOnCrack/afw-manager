"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FabricsApiResponse, Fabric, FabricStats, GarmentPrice, Surcharge } from "@/lib/types";

type SortField = "code" | "name" | "priceCategory" | "supplier" | "stock" | "usedFor";
type SortDir = "asc" | "desc";

const USED_FOR_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "Suit", label: "Suits" },
  { value: "Shirt", label: "Shirts" },
  { value: "Coat", label: "Overcoats" },
  { value: "Coat,Suit", label: "Coat / Suit" },
  { value: "Shoe", label: "Shoes" },
  { value: "Tie", label: "Ties" },
  { value: "Pant", label: "Pants" },
  { value: "Knitwear", label: "Knitwear" },
  { value: "Vest", label: "Vests" },
];

const PAGE_SIZE = 100;
const EUR_TO_GBP = 0.86;

const USED_FOR_SECTIONS: Record<string, string[]> = {
  Suit: ["Suits", "CutLength"],
  "Coat,Suit": ["Suits", "Coats", "CutLength"],
  Coat: ["Coats", "CutLength"],
  Shirt: ["Shirts"],
  Shoe: ["Shoes"],
  Tie: ["Accessories"],
  Pant: ["Pants"],
  Knitwear: ["Knitwear"],
  Vest: ["Suits", "CutLength"],
};

const USED_FOR_SURCHARGE_SECTIONS: Record<string, string[]> = {
  Suit: ["Suits", "Big Size"],
  "Coat,Suit": ["Suits", "Coats", "Big Size"],
  Coat: ["Coats", "Big Size"],
  Shirt: ["Shirts", "Big Size"],
  Shoe: ["Shoes (Italy)", "Shoes (Portugal)", "Big Size"],
  Tie: ["Accessories", "Big Size"],
  Pant: ["Pants", "Big Size"],
  Knitwear: ["Big Size"],
  Vest: ["Suits", "Big Size"],
};

function filterSurchargesForFabric(
  surcharges: Record<string, Surcharge[]>,
  usedFor: string | null
): Surcharge[] {
  if (!usedFor) return Object.values(surcharges).flat();
  const allowed = USED_FOR_SURCHARGE_SECTIONS[usedFor];
  if (!allowed) return Object.values(surcharges).flat();
  return allowed.flatMap((s) => surcharges[s] ?? []);
}

function filterPricesForFabric(
  prices: GarmentPrice[],
  usedFor: string | null
): GarmentPrice[] {
  if (!usedFor || prices.length === 0) return prices;
  const allowed = USED_FOR_SECTIONS[usedFor];
  if (!allowed) return prices;
  return prices.filter((p) => allowed.includes(p.section));
}

export default function Home() {
  const [data, setData] = useState<FabricsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFabrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sort: sortField,
        dir: sortDir,
      });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/fabrics?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as FabricsApiResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, debouncedSearch, sortField, sortDir]);

  useEffect(() => {
    fetchFabrics();
  }, [fetchFabrics]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, debouncedSearch]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <span className="ml-1 text-gray-300">&#8597;</span>;
    return (
      <span className="ml-1 text-blue-600">
        {sortDir === "asc" ? "\u25B2" : "\u25BC"}
      </span>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
        <div className="max-w-lg rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-800">
            Failed to load fabrics
          </h2>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Fabric Catalogue
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse fabrics from GoCreate
              {data ? ` \u00B7 ${data.totalCount.toLocaleString()} fabrics` : ""}
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
              router.refresh();
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <input
              type="text"
              placeholder="Search code, name, supplier, composition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {USED_FOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            )}
            {data && (
              <span>
                Page {data.page} of {data.totalPages} ({data.totalCount.toLocaleString()} results)
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        {data && <SummaryCards totalCount={data.totalCount} stats={data.stats} />}

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="w-16 px-4 py-3 font-medium text-gray-600">
                    Image
                  </th>
                  <Th field="code" label="Code" toggleSort={toggleSort}>
                    <SortIcon field="code" />
                  </Th>
                  <Th field="name" label="Name" toggleSort={toggleSort}>
                    <SortIcon field="name" />
                  </Th>
                  <Th field="usedFor" label="Type" toggleSort={toggleSort}>
                    <SortIcon field="usedFor" />
                  </Th>
                  <Th field="supplier" label="Supplier" toggleSort={toggleSort}>
                    <SortIcon field="supplier" />
                  </Th>
                  <Th
                    field="priceCategory"
                    label="Price Code"
                    toggleSort={toggleSort}
                  >
                    <SortIcon field="priceCategory" />
                  </Th>
                  <Th field="stock" label="Stock" toggleSort={toggleSort} right>
                    <SortIcon field="stock" />
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!data || data.fabrics.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      {loading ? "Loading..." : "No fabrics match your search."}
                    </td>
                  </tr>
                ) : (
                  data.fabrics.map((f) => (
                    <FabricRow
                      key={f.id}
                      fabric={f}
                      hasImageError={imageErrors.has(f.id)}
                      onImageError={() =>
                        setImageErrors((prev) => new Set(prev).add(f.id))
                      }
                      prices={filterPricesForFabric(
                        f.priceCategory
                          ? f.priceCategory
                              .split(",")
                              .flatMap((c) => data.priceMap[c.trim()] ?? [])
                          : [],
                        f.usedFor
                      )}
                      surcharges={filterSurchargesForFabric(data.surcharges, f.usedFor)}
                      expanded={expandedId === f.id}
                      onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </main>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              p === page
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function Th({
  field,
  label,
  toggleSort,
  right,
  children,
}: {
  field: SortField;
  label: string;
  toggleSort: (f: SortField) => void;
  right?: boolean;
  children: React.ReactNode;
}) {
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 font-medium text-gray-600 hover:text-gray-900 ${
        right ? "text-right" : ""
      }`}
      onClick={() => toggleSort(field)}
    >
      {label}
      {children}
    </th>
  );
}

function FabricRow({
  fabric,
  hasImageError,
  onImageError,
  prices,
  surcharges,
  expanded,
  onToggle,
}: {
  fabric: Fabric;
  hasImageError: boolean;
  onImageError: () => void;
  prices: GarmentPrice[];
  surcharges: Surcharge[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasPrices = prices.length > 0;

  return (
    <>
      <tr
        className={`transition-colors hover:bg-gray-50 ${hasPrices ? "cursor-pointer" : ""} ${expanded ? "bg-blue-50/50" : ""}`}
        onClick={hasPrices ? onToggle : undefined}
      >
        <td className="px-4 py-3">
          {fabric.imageUrl && !hasImageError ? (
            <img
              src={fabric.imageUrl}
              alt={fabric.code ?? "Fabric"}
              className="h-12 w-12 rounded object-cover"
              onError={onImageError}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
              N/A
            </div>
          )}
        </td>
        <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
          {fabric.code ?? "\u2014"}
        </td>
        <td className="max-w-[200px] truncate px-4 py-3 text-gray-700">
          {fabric.name ?? "\u2014"}
        </td>
        <td className="px-4 py-3">
          <TypeBadge usedFor={fabric.usedFor} />
        </td>
        <td className="max-w-[140px] truncate px-4 py-3 text-gray-600">
          {fabric.supplier ?? "\u2014"}
        </td>
        <td className="px-4 py-3">
          {fabric.priceCategory ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {fabric.priceCategory}
              {hasPrices && (
                <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
                  &#9660;
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400">\u2014</span>
          )}
        </td>
        <td className="px-4 py-3 text-right font-mono text-gray-700">
          {fabric.stock > 0 ? fabric.stock.toFixed(1) : "\u2014"}
        </td>
      </tr>
      {expanded && hasPrices && (
        <tr>
          <td colSpan={7} className="bg-blue-50/30 px-4 py-4">
            <PriceBreakdown
              prices={prices}
              surcharges={surcharges}
              priceCategory={fabric.priceCategory!}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function PriceBreakdown({
  prices,
  surcharges,
  priceCategory,
}: {
  prices: GarmentPrice[];
  surcharges: Surcharge[];
  priceCategory: string;
}) {
  const grouped = new Map<string, GarmentPrice[]>();
  for (const p of prices) {
    const key = [p.section, p.construction, p.make_type].filter(Boolean).join(" / ");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  const surchargesBySection = new Map<string, Surcharge[]>();
  for (const s of surcharges) {
    if (!surchargesBySection.has(s.section)) surchargesBySection.set(s.section, []);
    surchargesBySection.get(s.section)!.push(s);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Garment prices for {priceCategory} &middot; SS26
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...grouped.entries()].map(([group, items]) => (
          <div
            key={group}
            className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
          >
            <p className="mb-2 text-xs font-semibold text-gray-700">{group}</p>
            <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-gray-400">
              <span>Garment</span>
              <div className="flex gap-4">
                <span className="w-16 text-right">Cost (EUR)</span>
                <span className="w-16 text-right">RRP (GBP)</span>
              </div>
            </div>
            <div className="space-y-1">
              {items.map((item, i) => {
                const eur = Number(item.price_eur);
                const rrp = Math.ceil((eur * EUR_TO_GBP * 3.35) / 5) * 5;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-600">{item.garment_type}</span>
                    <div className="flex gap-4">
                      <span className="w-16 text-right font-mono text-gray-500">
                        &euro;{eur.toLocaleString("en", { minimumFractionDigits: 0 })}
                      </span>
                      <span className="w-16 text-right font-mono font-semibold text-green-700">
                        &pound;{rrp.toFixed(0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {surcharges.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Surcharges &middot; SS26
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...surchargesBySection.entries()].map(([section, items]) => (
              <div
                key={section}
                className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 shadow-sm"
              >
                <p className="mb-2 text-xs font-semibold text-amber-800">{section}</p>
                <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-amber-400">
                  <span>Option</span>
                  <div className="flex gap-4">
                    <span className="w-16 text-right">Cost (EUR)</span>
                    <span className="w-16 text-right">RRP (GBP)</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {items.map((item, i) => {
                    const eur = Number(item.price_eur);
                    const rrp = Math.ceil((eur * EUR_TO_GBP * 3.35) / 5) * 5;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-amber-700" title={[item.invoice_code, item.remarks].filter(Boolean).join(" · ") || undefined}>
                          {item.name}
                        </span>
                        <div className="flex gap-4">
                          <span className="w-16 text-right font-mono text-amber-600">
                            &euro;{eur.toLocaleString("en", { minimumFractionDigits: 0 })}
                          </span>
                          <span className="w-16 text-right font-mono font-semibold text-amber-800">
                            &pound;{rrp.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TypeBadge({ usedFor }: { usedFor: string | null }) {
  if (!usedFor) return <span className="text-gray-400">\u2014</span>;

  const colorMap: Record<string, string> = {
    Suit: "bg-indigo-100 text-indigo-700",
    "Coat,Suit": "bg-purple-100 text-purple-700",
    Coat: "bg-amber-100 text-amber-700",
    Shirt: "bg-sky-100 text-sky-700",
    Tie: "bg-rose-100 text-rose-700",
    Shoe: "bg-orange-100 text-orange-700",
    Pant: "bg-teal-100 text-teal-700",
    Knitwear: "bg-emerald-100 text-emerald-700",
    Vest: "bg-cyan-100 text-cyan-700",
  };

  const color = colorMap[usedFor] ?? "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {usedFor}
    </span>
  );
}

function SummaryCards({ totalCount, stats }: { totalCount: number; stats: FabricStats }) {
  const cards = [
    { label: "Total Fabrics", value: totalCount.toLocaleString() },
    { label: "Types", value: stats.uniqueTypes.toLocaleString() },
    { label: "Price Codes", value: stats.uniquePriceCodes.toLocaleString() },
    { label: "Suppliers", value: stats.uniqueSuppliers.toLocaleString() },
    { label: "In Stock", value: stats.inStockCount.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {c.label}
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
