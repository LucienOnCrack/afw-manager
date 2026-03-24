import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";

const PAGE_SIZE = 50;

const SORTABLE_COLUMNS = new Set([
  "created_date",
  "order_number",
  "customer_name",
  "status",
  "fabric",
  "shop_name",
  "total_r_price",
  "total_p_price",
  "outstanding_amount",
  "order_type",
]);

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

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const sortBy = searchParams.get("sortBy") ?? "created_date";
    const sortDir = searchParams.get("sortDir") === "asc" ? true : false;
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const shop = searchParams.get("shop") ?? "";
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";

    if (!SORTABLE_COLUMNS.has(sortBy)) {
      return NextResponse.json({ error: "Invalid sort column" }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    let query = serviceClient
      .from("orders")
      .select(
        "order_number, shop_order_number, retail_price, p_price, downpayment, customer_id, process_date, order_type, tailor, status, days_in_status, fabric, lining, delivery_date, updated_delivery_date, latest_delivery_date, shop_label, created_by, created_date, customer_name, company, fabric_price_category, total_p_price, total_r_price, outstanding_amount, expected_delivery_date, urgent_order, shop_name, occasion",
        { count: "exact" }
      );

    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,fabric.ilike.%${search}%,shop_order_number.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (shop) {
      query = query.eq("shop_name", shop);
    }

    if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      query = query.gte("created_date", startDate);
    }

    if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      query = query.lte("created_date", endDate);
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    query = query
      .order(sortBy, { ascending: sortDir, nullsFirst: false })
      .range(from, to);

    const { data: orders, count, error: queryError } = await query;

    if (queryError) {
      console.error(`[Orders List] DB error: ${queryError.message}`);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    // Fetch distinct statuses and shops for filter dropdowns
    const [{ data: statuses }, { data: shops }] = await Promise.all([
      serviceClient.from("orders").select("status").not("status", "is", null),
      serviceClient.from("orders").select("shop_name").not("shop_name", "is", null),
    ]);

    const uniqueStatuses = [...new Set((statuses ?? []).map((r) => r.status as string))].sort();
    const uniqueShops = [...new Set((shops ?? []).map((r) => r.shop_name as string))].sort();

    return NextResponse.json({
      orders: orders ?? [],
      totalCount: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      filters: {
        statuses: uniqueStatuses,
        shops: uniqueShops,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Orders List] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
