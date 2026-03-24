import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import type {
  OrderAnalytics,
  DailyOrderData,
  CustomerSpend,
  FabricPopularity,
  CategoryBreakdown,
  ShopPerformance,
} from "@/lib/types";

const MAX_RANGE_DAYS = 365;

interface OrderRow {
  order_number: string;
  retail_price: number | null;
  p_price: number | null;
  customer_id: string | null;
  customer_name: string | null;
  company: string | null;
  order_type: string | null;
  status: string | null;
  fabric: string | null;
  shop_name: string | null;
  created_date: string | null;
  p_price_discount: number | null;
  total_p_price: number | null;
  r_price_discount: number | null;
  r_price_service_charge: number | null;
  total_r_price: number | null;
  outstanding_amount: number | null;
  synced_at: string | null;
}

function aggregateDbOrders(
  orders: OrderRow[],
  startDate: string,
  endDate: string
): OrderAnalytics {
  const dateMap = new Map<string, { orderCount: number; revenue: number; pPrice: number }>();

  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dateMap.set(current.toISOString().split("T")[0], { orderCount: 0, revenue: 0, pPrice: 0 });
    current.setDate(current.getDate() + 1);
  }

  const totalOrders = orders.length;
  let totalRevenue = 0;
  let totalPPrice = 0;

  const customerMap = new Map<
    string,
    { customerName: string; customerId: string; company: string; orderCount: number; totalRevenue: number; totalPPrice: number }
  >();

  const fabricMap = new Map<string, { orderCount: number; totalRevenue: number }>();
  const typeMap = new Map<string, { count: number; revenue: number }>();
  const statusMap = new Map<string, { count: number; revenue: number }>();
  const shopMap = new Map<string, { orderCount: number; totalRevenue: number; totalPPrice: number }>();

  for (const o of orders) {
    const revenue = o.total_r_price ?? o.retail_price ?? 0;
    const pPrice = o.total_p_price ?? o.p_price ?? 0;
    totalRevenue += revenue;
    totalPPrice += pPrice;

    const dateKey = o.created_date ?? "unknown";
    const dayEntry = dateMap.get(dateKey);
    if (dayEntry) {
      dayEntry.orderCount++;
      dayEntry.revenue += revenue;
      dayEntry.pPrice += pPrice;
    }

    const custKey = o.customer_id || o.customer_name || "Unknown";
    const custExisting = customerMap.get(custKey);
    if (custExisting) {
      custExisting.orderCount++;
      custExisting.totalRevenue += revenue;
      custExisting.totalPPrice += pPrice;
    } else {
      customerMap.set(custKey, {
        customerName: o.customer_name || "Unknown",
        customerId: o.customer_id || "",
        company: o.company || "",
        orderCount: 1,
        totalRevenue: revenue,
        totalPPrice: pPrice,
      });
    }

    const fabric = o.fabric || "Unknown";
    const fabExisting = fabricMap.get(fabric);
    if (fabExisting) {
      fabExisting.orderCount++;
      fabExisting.totalRevenue += revenue;
    } else {
      fabricMap.set(fabric, { orderCount: 1, totalRevenue: revenue });
    }

    const type = o.order_type || "Unknown";
    const typeExisting = typeMap.get(type);
    if (typeExisting) {
      typeExisting.count++;
      typeExisting.revenue += revenue;
    } else {
      typeMap.set(type, { count: 1, revenue });
    }

    const status = o.status || "Unknown";
    const statusExisting = statusMap.get(status);
    if (statusExisting) {
      statusExisting.count++;
      statusExisting.revenue += revenue;
    } else {
      statusMap.set(status, { count: 1, revenue });
    }

    const shop = o.shop_name || "Unknown";
    const shopExisting = shopMap.get(shop);
    if (shopExisting) {
      shopExisting.orderCount++;
      shopExisting.totalRevenue += revenue;
      shopExisting.totalPPrice += pPrice;
    } else {
      shopMap.set(shop, { orderCount: 1, totalRevenue: revenue, totalPPrice: pPrice });
    }
  }

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const ordersByDate: DailyOrderData[] = [...dateMap.entries()]
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topCustomers: CustomerSpend[] = [...customerMap.values()]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 20);

  const topFabrics: FabricPopularity[] = [...fabricMap.entries()]
    .map(([fabric, data]) => ({ fabric, ...data }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 20);

  const ordersByType: CategoryBreakdown[] = [...typeMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  const ordersByStatus: CategoryBreakdown[] = [...statusMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  const shopPerformance: ShopPerformance[] = [...shopMap.entries()]
    .map(([shopName, data]) => ({
      shopName,
      ...data,
      avgOrderValue: data.orderCount > 0 ? data.totalRevenue / data.orderCount : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    totalOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalPPrice: Math.round(totalPPrice * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    uniqueCustomers: customerMap.size,
    ordersByDate,
    topCustomers,
    topFabrics,
    ordersByType,
    ordersByStatus,
    shopPerformance,
    dateRange: { startDate, endDate },
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate query params are required (yyyy-MM-dd)" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { error: "Dates must be in yyyy-MM-dd format" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date values" }, { status: 400 });
    }

    if (start > end) {
      return NextResponse.json(
        { error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${MAX_RANGE_DAYS} days` },
        { status: 400 }
      );
    }

    console.log(`[Analytics] Request: ${startDate} → ${endDate} (${dayDiff} days) by user ${user.email}`);
    const t0 = Date.now();

    const serviceClient = getServiceClient();
    const { data: orders, error: queryError } = await serviceClient
      .from("orders")
      .select(
        "order_number, retail_price, p_price, customer_id, customer_name, company, order_type, status, fabric, shop_name, created_date, p_price_discount, total_p_price, r_price_discount, r_price_service_charge, total_r_price, outstanding_amount, synced_at"
      )
      .gte("created_date", startDate)
      .lte("created_date", endDate)
      .order("created_date", { ascending: true });

    if (queryError) {
      console.error(`[Analytics] DB query error: ${queryError.message}`);
      return NextResponse.json(
        { error: `Database error: ${queryError.message}` },
        { status: 500 }
      );
    }

    const orderCount = orders?.length ?? 0;
    console.log(`[Analytics] DB query returned ${orderCount} orders in ${Date.now() - t0}ms`);

    const analytics = aggregateDbOrders(orders as OrderRow[], startDate, endDate);

    console.log(`[Analytics] Done — ${analytics.totalOrders} orders, ${analytics.uniqueCustomers} customers, total revenue €${analytics.totalRevenue} in ${Date.now() - t0}ms`);
    return NextResponse.json(analytics);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error fetching order analytics";
    console.error(`[Analytics] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
