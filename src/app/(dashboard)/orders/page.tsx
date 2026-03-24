"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Order {
  order_number: string;
  shop_order_number: string | null;
  retail_price: number | null;
  p_price: number | null;
  downpayment: number | null;
  customer_id: string | null;
  process_date: string | null;
  order_type: string | null;
  tailor: string | null;
  status: string | null;
  days_in_status: string | null;
  fabric: string | null;
  lining: string | null;
  delivery_date: string | null;
  updated_delivery_date: string | null;
  latest_delivery_date: string | null;
  shop_label: string | null;
  created_by: string | null;
  created_date: string | null;
  customer_name: string | null;
  company: string | null;
  fabric_price_category: string | null;
  total_p_price: number | null;
  total_r_price: number | null;
  outstanding_amount: number | null;
  expected_delivery_date: string | null;
  urgent_order: string | null;
  shop_name: string | null;
  occasion: string | null;
}

interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: {
    statuses: string[];
    shops: string[];
  };
}

type SortField =
  | "created_date"
  | "order_number"
  | "customer_name"
  | "status"
  | "fabric"
  | "shop_name"
  | "total_r_price"
  | "total_p_price"
  | "outstanding_amount"
  | "order_type";
type SortDir = "asc" | "desc";

function formatCurrency(val: number | null): string {
  if (val === null || val === undefined) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_COLORS: Record<string, string> = {
  "In Production": "bg-gray-900 text-white",
  Delivered: "bg-green-700 text-white",
  Completed: "bg-green-700 text-white",
  Cancelled: "bg-red-600 text-white",
  "Ready for Dispatch": "bg-amber-600 text-white",
  "Waiting for Fabric": "bg-orange-600 text-white",
  New: "bg-blue-600 text-white",
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400">—</span>;
  const color = STATUS_COLORS[status] ?? "bg-gray-200 text-gray-700";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${color}`}
    >
      {status}
    </span>
  );
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className = "",
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const active = currentSort === field;
  return (
    <th
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (
          <span className="text-gray-900">
            {currentDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );
}

export default function OrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("created_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("sortBy", sortBy);
        params.set("sortDir", sortDir);
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        if (shopFilter) params.set("shop", shopFilter);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`/api/orders/list?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
        const json: OrdersResponse = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [sortBy, sortDir, search, statusFilter, shopFilter, startDate, endDate]
  );

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  function handleSort(field: SortField) {
    if (field === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleClearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setShopFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  const hasFilters = search || statusFilter || shopFilter || startDate || endDate;
  const activeFilterCount = [statusFilter, shopFilter, startDate, endDate].filter(Boolean).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-sm font-semibold text-gray-900">Orders</h1>
          {data && (
            <span className="hidden rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500 sm:inline-flex">
              {data.totalCount} total
            </span>
          )}
        </div>
        <Link
          href="/orders/new"
          className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
        >
          <span className="sm:hidden">+</span>
          <span className="hidden sm:inline">+ New Order</span>
        </Link>
      </div>

      {/* Search + filter toggle bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
        <div className="flex gap-1.5">
          <form onSubmit={handleSearch} className="flex flex-1 gap-1.5">
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search order #, customer, fabric..."
                className="w-full rounded border border-gray-200 py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
              />
            </div>
            <button
              type="submit"
              className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`relative rounded border px-2.5 py-1.5 text-xs font-medium transition ${
              filtersOpen || activeFilterCount > 0
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg className="h-3.5 w-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible filter panel */}
        {filtersOpen && (
          <div className="mt-2.5 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-2.5">
            <div className="w-full min-w-[120px] sm:w-auto">
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-0"
              >
                <option value="">All Statuses</option>
                {data?.filters.statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="w-full min-w-[120px] sm:w-auto">
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">Shop</label>
              <select
                value={shopFilter}
                onChange={(e) => { setShopFilter(e.target.value); setPage(1); }}
                className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-0"
              >
                <option value="">All Shops</option>
                {data?.filters.shops.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="min-w-[120px]">
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-0"
              />
            </div>

            <div className="min-w-[120px]">
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-0"
              />
            </div>

            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="rounded border border-gray-200 px-2.5 py-1.5 text-[10px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="mx-4 mt-3 rounded border border-red-200 bg-red-50 px-4 py-3 sm:mx-6">
          <p className="text-xs font-medium text-red-800">Error loading orders</p>
          <p className="mt-0.5 text-[10px] text-red-600">{error}</p>
          <button
            onClick={() => fetchOrders(page)}
            className="mt-2 rounded bg-gray-900 px-3 py-1 text-[10px] font-medium text-white hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Mobile card view + Desktop table view */}
      <div className="flex-1 overflow-auto">
        {/* Desktop table (hidden on small screens) */}
        <div className="hidden md:block">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
              <tr>
                <th className="w-7 px-3 py-2.5" />
                <SortHeader label="Order #" field="order_number" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Date" field="created_date" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Customer" field="customer_name" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Status" field="status" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Type" field="order_type" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortHeader label="Fabric" field="fabric" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="hidden xl:table-cell" />
                <SortHeader label="Shop" field="shop_name" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortHeader label="Revenue" field="total_r_price" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Outstanding" field="outstanding_amount" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="hidden xl:table-cell" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading && !data && (
                <tr>
                  <td colSpan={10} className="px-3 py-16 text-center">
                    <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
                    <p className="text-[10px] text-gray-400">Loading orders...</p>
                  </td>
                </tr>
              )}
              {data?.orders.map((order) => (
                <DesktopOrderRow
                  key={order.order_number}
                  order={order}
                  expanded={expandedOrder === order.order_number}
                  onToggle={() =>
                    setExpandedOrder(
                      expandedOrder === order.order_number ? null : order.order_number
                    )
                  }
                />
              ))}
              {data && data.orders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-16 text-center text-xs text-gray-400">
                    No orders found{hasFilters ? " matching your filters" : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden">
          {loading && !data && (
            <div className="px-4 py-16 text-center">
              <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
              <p className="text-[10px] text-gray-400">Loading orders...</p>
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {data?.orders.map((order) => (
              <MobileOrderCard
                key={order.order_number}
                order={order}
                expanded={expandedOrder === order.order_number}
                onToggle={() =>
                  setExpandedOrder(
                    expandedOrder === order.order_number ? null : order.order_number
                  )
                }
              />
            ))}
          </div>
          {data && data.orders.length === 0 && (
            <div className="px-4 py-16 text-center text-xs text-gray-400">
              No orders found{hasFilters ? " matching your filters" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2.5 sm:px-6">
          <p className="text-[10px] text-gray-500">
            <span className="font-medium text-gray-700">
              {(data.page - 1) * data.pageSize + 1}
            </span>
            –
            <span className="font-medium text-gray-700">
              {Math.min(data.page * data.pageSize, data.totalCount)}
            </span>{" "}
            of <span className="font-medium text-gray-700">{data.totalCount}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="rounded border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="px-1.5 text-[10px] text-gray-500">
              {data.page}/{data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages || loading}
              className="rounded border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {loading && data && (
        <div className="border-t border-gray-100 bg-white px-4 py-1.5 text-center text-[10px] text-gray-400 sm:px-6">
          Refreshing...
        </div>
      )}
    </div>
  );
}

function MobileOrderCard({
  order,
  expanded,
  onToggle,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`bg-white ${expanded ? "bg-gray-50/50" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <svg
          className={`mt-0.5 h-3 w-3 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-medium text-gray-900">{order.order_number}</span>
              {order.urgent_order === "Yes" && (
                <span className="rounded bg-red-600 px-1 py-px text-[9px] font-bold text-white">URGENT</span>
              )}
            </div>
            <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-gray-900">
              {formatCurrency(order.total_r_price)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] text-gray-600">{order.customer_name || "—"}</span>
            {order.company && (
              <span className="text-[10px] text-gray-400">· {order.company}</span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={order.status} />
            {order.days_in_status && (
              <span className="text-[10px] text-gray-400">{order.days_in_status}d</span>
            )}
            <span className="text-[10px] text-gray-400">{formatDate(order.created_date)}</span>
            {order.order_type && (
              <span className="text-[10px] text-gray-400">· {order.order_type}</span>
            )}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <MobileOrderDetails order={order} />
        </div>
      )}
    </div>
  );
}

function MobileOrderDetails({ order }: { order: Order }) {
  return (
    <div className="space-y-3">
      <DetailSection title="Order Details">
        <DetailRow label="Order #" value={order.order_number} />
        <DetailRow label="Shop Order #" value={order.shop_order_number || "—"} />
        <DetailRow label="Type" value={order.order_type || "—"} />
        <DetailRow label="Created" value={formatDate(order.created_date)} />
        <DetailRow label="Created By" value={order.created_by || "—"} />
        <DetailRow label="Occasion" value={order.occasion || "—"} />
        <DetailRow
          label="Urgent"
          value={
            order.urgent_order === "Yes" ? (
              <span className="font-bold text-red-600">Yes</span>
            ) : ("No")
          }
        />
      </DetailSection>
      <DetailSection title="Production & Delivery">
        <DetailRow label="Status" value={<StatusBadge status={order.status} />} />
        <DetailRow label="Days in Status" value={order.days_in_status ? `${order.days_in_status} days` : "—"} />
        <DetailRow label="Tailor" value={order.tailor || "—"} />
        <DetailRow label="Fabric" value={order.fabric || "—"} />
        <DetailRow label="Fabric Category" value={order.fabric_price_category || "—"} />
        <DetailRow label="Lining" value={order.lining || "—"} />
        <DetailRow label="Delivery Date" value={formatDate(order.delivery_date)} />
        <DetailRow label="Expected" value={formatDate(order.expected_delivery_date)} />
      </DetailSection>
      <DetailSection title="Pricing">
        <DetailRow label="Retail Price" value={formatCurrency(order.retail_price)} />
        <DetailRow label="Total R-Price" value={formatCurrency(order.total_r_price)} />
        <DetailRow label="P-Price" value={formatCurrency(order.p_price)} />
        <DetailRow label="Total P-Price" value={formatCurrency(order.total_p_price)} />
        <DetailRow label="Downpayment" value={formatCurrency(order.downpayment)} />
        <DetailRow
          label="Outstanding"
          value={
            order.outstanding_amount !== null && order.outstanding_amount > 0 ? (
              <span className="font-bold text-red-600">{formatCurrency(order.outstanding_amount)}</span>
            ) : (formatCurrency(order.outstanding_amount))
          }
        />
        <DetailRow label="Shop" value={order.shop_name || "—"} />
      </DetailSection>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-3">
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{title}</h4>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function DesktopOrderRow({
  order,
  expanded,
  onToggle,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`cursor-pointer transition-colors hover:bg-gray-50/70 ${expanded ? "bg-gray-50" : ""}`}
        onClick={onToggle}
      >
        <td className="px-3 py-2.5 text-gray-400">
          <svg
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] font-medium text-gray-900">
          {order.order_number}
          {order.urgent_order === "Yes" && (
            <span className="ml-1 rounded bg-red-600 px-1 py-px text-[9px] font-bold text-white">URGENT</span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500">
          {formatDate(order.created_date)}
        </td>
        <td className="px-3 py-2.5">
          <div className="text-xs font-medium text-gray-900">{order.customer_name || "—"}</div>
          {order.company && <div className="text-[10px] text-gray-400">{order.company}</div>}
        </td>
        <td className="whitespace-nowrap px-3 py-2.5">
          <StatusBadge status={order.status} />
          {order.days_in_status && (
            <span className="ml-1 text-[10px] text-gray-400">{order.days_in_status}d</span>
          )}
        </td>
        <td className="hidden whitespace-nowrap px-3 py-2.5 text-xs text-gray-500 lg:table-cell">
          {order.order_type || "—"}
        </td>
        <td className="hidden max-w-[140px] truncate px-3 py-2.5 text-xs text-gray-500 xl:table-cell">
          {order.fabric || "—"}
        </td>
        <td className="hidden whitespace-nowrap px-3 py-2.5 text-xs text-gray-500 lg:table-cell">
          {order.shop_name || "—"}
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs font-medium tabular-nums text-gray-900">
          {formatCurrency(order.total_r_price)}
        </td>
        <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs tabular-nums text-gray-500 xl:table-cell">
          {formatCurrency(order.outstanding_amount)}
        </td>
      </tr>
      {expanded && <DesktopOrderDetails order={order} />}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex justify-between py-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-right text-xs text-gray-900">{value}</span>
    </div>
  );
}

function DesktopOrderDetails({ order }: { order: Order }) {
  return (
    <tr className="bg-gray-50/60">
      <td colSpan={10} className="px-3 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailSection title="Order Details">
            <DetailRow label="Order #" value={order.order_number} />
            <DetailRow label="Shop Order #" value={order.shop_order_number || "—"} />
            <DetailRow label="Type" value={order.order_type || "—"} />
            <DetailRow label="Created" value={formatDate(order.created_date)} />
            <DetailRow label="Created By" value={order.created_by || "—"} />
            <DetailRow label="Occasion" value={order.occasion || "—"} />
            <DetailRow
              label="Urgent"
              value={
                order.urgent_order === "Yes" ? (
                  <span className="font-bold text-red-600">Yes</span>
                ) : ("No")
              }
            />
          </DetailSection>

          <DetailSection title="Production & Delivery">
            <DetailRow label="Status" value={<StatusBadge status={order.status} />} />
            <DetailRow label="Days in Status" value={order.days_in_status ? `${order.days_in_status} days` : "—"} />
            <DetailRow label="Tailor" value={order.tailor || "—"} />
            <DetailRow label="Fabric" value={order.fabric || "—"} />
            <DetailRow label="Fabric Category" value={order.fabric_price_category || "—"} />
            <DetailRow label="Lining" value={order.lining || "—"} />
            <DetailRow label="Delivery Date" value={formatDate(order.delivery_date)} />
            <DetailRow label="Updated Delivery" value={formatDate(order.updated_delivery_date)} />
            <DetailRow label="Expected Delivery" value={formatDate(order.expected_delivery_date)} />
            <DetailRow label="Process Date" value={formatDate(order.process_date)} />
          </DetailSection>

          <DetailSection title="Pricing">
            <DetailRow label="Retail Price" value={formatCurrency(order.retail_price)} />
            <DetailRow label="Total R-Price" value={formatCurrency(order.total_r_price)} />
            <DetailRow label="P-Price" value={formatCurrency(order.p_price)} />
            <DetailRow label="Total P-Price" value={formatCurrency(order.total_p_price)} />
            <DetailRow label="Downpayment" value={formatCurrency(order.downpayment)} />
            <DetailRow
              label="Outstanding"
              value={
                order.outstanding_amount !== null && order.outstanding_amount > 0 ? (
                  <span className="font-bold text-red-600">{formatCurrency(order.outstanding_amount)}</span>
                ) : (formatCurrency(order.outstanding_amount))
              }
            />
            <div className="mt-2 border-t border-gray-100 pt-2">
              <DetailRow label="Shop" value={order.shop_name || "—"} />
              <DetailRow label="Shop Label" value={order.shop_label || "—"} />
              <DetailRow label="Customer" value={order.customer_name || "—"} />
              <DetailRow label="Company" value={order.company || "—"} />
            </div>
          </DetailSection>
        </div>
      </td>
    </tr>
  );
}
