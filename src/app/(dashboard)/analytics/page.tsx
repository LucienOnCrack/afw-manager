"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  OrderAnalytics,
  DailyOrderData,
  CustomerSpend,
  FabricPopularity,
  CategoryBreakdown,
  ShopPerformance,
} from "@/lib/types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#a855f7", "#0ea5e9", "#eab308",
];

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDefaultRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatCurrencyShort(val: number): string {
  if (val >= 1_000_000) return `€${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `€${(val / 1_000).toFixed(1)}K`;
  return `€${val.toFixed(0)}`;
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}

function formatDateLabel(d: unknown): string {
  const str = String(d);
  const dt = new Date(str);
  if (isNaN(dt.getTime())) return str;
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTick(d: string): string {
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function OrderVolumeChart({ data }: { data: DailyOrderData[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Order Volume Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDateTick} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip labelFormatter={formatDateLabel} />
          <Bar dataKey="orderCount" name="Orders" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueChart({ data }: { data: DailyOrderData[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Revenue Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDateTick} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrencyShort(Number(v))} />
          <Tooltip
            labelFormatter={formatDateLabel}
            formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieLabel({ name, percent }: { name?: string; percent?: number }) {
  return `${name ?? "?"} ${((percent ?? 0) * 100).toFixed(0)}%`;
}

function OrderTypePie({ data }: { data: CategoryBreakdown[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Order Types
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={PieLabel}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [Number(v), "Orders"]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrderStatusPie({ data }: { data: CategoryBreakdown[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Order Status Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={PieLabel}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [Number(v), "Orders"]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopFabricsChart({ data }: { data: FabricPopularity[] }) {
  const top10 = data.slice(0, 10);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Top 10 Fabrics by Order Count
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(300, top10.length * 36)}>
        <BarChart data={top10} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="fabric"
            tick={{ fontSize: 11 }}
            width={140}
          />
          <Tooltip />
          <Bar dataKey="orderCount" name="Orders" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopCustomersTable({ data }: { data: CustomerSpend[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Top Customers by Spend
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-2.5 font-medium text-gray-500">#</th>
              <th className="px-5 py-2.5 font-medium text-gray-500">Customer</th>
              <th className="px-5 py-2.5 font-medium text-gray-500">Company</th>
              <th className="px-5 py-2.5 text-right font-medium text-gray-500">Orders</th>
              <th className="px-5 py-2.5 text-right font-medium text-gray-500">Revenue</th>
              <th className="px-5 py-2.5 text-right font-medium text-gray-500">P-Price</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={c.customerId || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-2.5 text-gray-400">{i + 1}</td>
                <td className="px-5 py-2.5 font-medium text-gray-900">{c.customerName}</td>
                <td className="px-5 py-2.5 text-gray-600">{c.company || "—"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums text-gray-700">{c.orderCount}</td>
                <td className="px-5 py-2.5 text-right tabular-nums font-medium text-gray-900">
                  {formatCurrency(c.totalRevenue)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums text-gray-600">
                  {formatCurrency(c.totalPPrice)}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No customer data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShopPerformanceTable({ data }: { data: ShopPerformance[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Shop Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-2.5 font-medium text-gray-500">Shop</th>
              <th className="px-5 py-2.5 text-right font-medium text-gray-500">Orders</th>
              <th className="px-5 py-2.5 text-right font-medium text-gray-500">Revenue</th>
              <th className="px-5 py-2.5 text-right font-medium text-gray-500">P-Price</th>
              <th className="px-5 py-2.5 text-right font-medium text-gray-500">Avg Order</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-2.5 font-medium text-gray-900">{s.shopName}</td>
                <td className="px-5 py-2.5 text-right tabular-nums text-gray-700">{s.orderCount}</td>
                <td className="px-5 py-2.5 text-right tabular-nums font-medium text-gray-900">
                  {formatCurrency(s.totalRevenue)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums text-gray-600">
                  {formatCurrency(s.totalPPrice)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums text-gray-600">
                  {formatCurrency(s.avgOrderValue)}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No shop data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type PresetKey = "7d" | "14d" | "30d" | "60d" | "90d";

const PRESETS: { key: PresetKey; label: string; days: number }[] = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "14d", label: "14 days", days: 14 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "60d", label: "60 days", days: 60 },
  { key: "90d", label: "90 days", days: 90 },
];

export default function AnalyticsPage() {
  const defaults = getDefaultRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [activePreset, setActivePreset] = useState<PresetKey>("7d");

  const [data, setData] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    totalUpserted: number;
    elapsed: number;
    syncedAt: string;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (sd: string, ed: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders/analytics?startDate=${sd}&endDate=${ed}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json: OrderAnalytics = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/orders/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setSyncResult({
        totalUpserted: json.totalUpserted,
        elapsed: json.elapsed,
        syncedAt: new Date().toLocaleString("en-GB"),
      });
      fetchAnalytics(startDate, endDate);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - preset.days);
    const sd = formatDate(start);
    const ed = formatDate(end);
    setStartDate(sd);
    setEndDate(ed);
    setActivePreset(preset.key);
    fetchAnalytics(sd, ed);
  }

  function handleCustomFetch() {
    setActivePreset(undefined as unknown as PresetKey);
    fetchAnalytics(startDate, endDate);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Order Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Insights from synced GoCreate order data
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync Orders"}
        </button>
      </div>

      {/* Sync feedback */}
      {syncResult && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3">
          <p className="text-sm text-emerald-800">
            Synced <strong>{syncResult.totalUpserted}</strong> orders in{" "}
            {(syncResult.elapsed / 1000).toFixed(1)}s &middot; Last synced:{" "}
            {syncResult.syncedAt}
          </p>
        </div>
      )}
      {syncError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-5 py-3">
          <p className="text-sm text-red-800">
            Sync failed: {syncError}
          </p>
        </div>
      )}

      {/* Date Controls */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p)}
                disabled={loading}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activePreset === p.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="h-px w-full bg-gray-200 sm:h-8 sm:w-px" />

          {/* Custom date inputs */}
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleCustomFetch}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="mb-6 flex items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-12">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium text-blue-700">
              Loading analytics...
            </p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-800">Error loading analytics</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={() => fetchAnalytics(startDate, endDate)}
            className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Analytics Content */}
      {data && !loading && (
        <div className="space-y-6">
          {data.totalOrders === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-800">No orders found for this date range</p>
              <p className="mt-1 text-sm text-amber-600">
                Click <strong>Sync Orders</strong> to pull the latest data from GoCreate for the selected dates.
              </p>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Orders"
              value={data.totalOrders.toLocaleString()}
              subtitle={`${data.dateRange.startDate} to ${data.dateRange.endDate}`}
            />
            <SummaryCard
              title="Total Revenue"
              value={formatCurrency(data.totalRevenue)}
              subtitle="Retail price total"
            />
            <SummaryCard
              title="Avg Order Value"
              value={formatCurrency(data.averageOrderValue)}
              subtitle="Revenue per order"
            />
            <SummaryCard
              title="Unique Customers"
              value={data.uniqueCustomers.toLocaleString()}
              subtitle={`${data.totalOrders > 0 && data.uniqueCustomers > 0 ? (data.totalOrders / data.uniqueCustomers).toFixed(1) : 0} orders per customer`}
            />
          </div>

          {data.totalOrders > 0 && (
            <>
              {/* Time Series Charts */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <OrderVolumeChart data={data.ordersByDate} />
                <RevenueChart data={data.ordersByDate} />
              </div>

              {/* Pie Charts */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <OrderTypePie data={data.ordersByType} />
                <OrderStatusPie data={data.ordersByStatus} />
              </div>

              {/* Top Fabrics */}
              <TopFabricsChart data={data.topFabrics} />

              {/* Top Customers */}
              <TopCustomersTable data={data.topCustomers} />

              {/* Shop Performance */}
              <ShopPerformanceTable data={data.shopPerformance} />
            </>
          )}

          {/* Footer info */}
          <p className="text-center text-xs text-gray-400">
            Showing {data.totalOrders} orders from {data.dateRange.startDate} to{" "}
            {data.dateRange.endDate}
            {syncResult && <> &middot; Last synced: {syncResult.syncedAt}</>}
          </p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm text-gray-500">
            Select a date range and click Apply to load analytics
          </p>
        </div>
      )}
    </div>
  );
}
