import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { fetchOrdersForDateRange, toOrderDbRow } from "@/lib/gocreate";

const MAX_RANGE_DAYS = 90;
const UPSERT_BATCH_SIZE = 200;

export async function POST(request: NextRequest) {
  const syncId = Math.random().toString(36).slice(2, 8);
  const log = (msg: string) => console.log(`[Sync:${syncId}] ${msg}`);
  const warn = (msg: string) => console.warn(`[Sync:${syncId}] ${msg}`);
  const err = (msg: string) => console.error(`[Sync:${syncId}] ${msg}`);

  try {
    log("--- SYNC REQUEST RECEIVED ---");
    const t0 = Date.now();

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      warn(`Auth failed: ${authError?.message ?? "no user session"}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log(`Authenticated user: ${user.email} (${user.id})`);

    const body = await request.json().catch(() => null);
    const startDate = body?.startDate as string | undefined;
    const endDate = body?.endDate as string | undefined;

    if (!startDate || !endDate) {
      warn("Missing startDate or endDate in body");
      return NextResponse.json(
        { error: "startDate and endDate are required in request body (yyyy-MM-dd)" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      warn(`Invalid date format: start="${startDate}", end="${endDate}"`);
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

    log(`=== STARTING SYNC: ${startDate} → ${endDate} (${dayDiff} days) ===`);

    // --- Phase 1: Fetch from GoCreate ---
    log(`[Phase 1/3] Fetching orders from GoCreate API...`);
    const fetchT0 = Date.now();
    const dailyResults = await fetchOrdersForDateRange(startDate, endDate);
    const fetchElapsed = Date.now() - fetchT0;

    let totalRawOrders = 0;
    let skippedNoOrderNumber = 0;
    const dailySummary: string[] = [];

    for (const { date, orders } of dailyResults) {
      totalRawOrders += orders.length;
      const withNumber = orders.filter((o) => o.OrderNumber).length;
      const withoutNumber = orders.length - withNumber;
      skippedNoOrderNumber += withoutNumber;
      dailySummary.push(`  ${date}: ${orders.length} orders (${withNumber} valid, ${withoutNumber} skipped)`);
    }

    log(`[Phase 1/3] Fetch complete in ${fetchElapsed}ms`);
    log(`[Phase 1/3] Raw orders fetched: ${totalRawOrders}`);
    log(`[Phase 1/3] Orders without OrderNumber (skipped): ${skippedNoOrderNumber}`);
    log(`[Phase 1/3] Daily breakdown:\n${dailySummary.join("\n")}`);

    // --- Phase 2: Transform to DB rows ---
    log(`[Phase 2/3] Transforming GoCreate orders → DB rows...`);
    const transformT0 = Date.now();
    const allRows = dailyResults.flatMap(({ orders }) =>
      orders.filter((o) => o.OrderNumber).map(toOrderDbRow)
    );
    const transformElapsed = Date.now() - transformT0;

    log(`[Phase 2/3] Transformed ${allRows.length} rows in ${transformElapsed}ms`);

    if (allRows.length > 0) {
      const sample = allRows[0];
      log(`[Phase 2/3] Sample row: order_number=${sample.order_number}, customer_name=${sample.customer_name}, created_date=${sample.created_date}, total_r_price=${sample.total_r_price}, shop_name=${sample.shop_name}`);
    }

    const uniqueCustomers = new Set(allRows.map((r) => r.customer_id ?? r.customer_name)).size;
    const uniqueFabrics = new Set(allRows.map((r) => r.fabric)).size;
    const uniqueShops = new Set(allRows.map((r) => r.shop_name)).size;
    log(`[Phase 2/3] Unique customers: ${uniqueCustomers}, fabrics: ${uniqueFabrics}, shops: ${uniqueShops}`);

    // --- Phase 3: Upsert into Supabase ---
    log(`[Phase 3/3] Upserting ${allRows.length} orders into Supabase (batch size: ${UPSERT_BATCH_SIZE})...`);
    const upsertT0 = Date.now();
    const serviceClient = getServiceClient();
    let totalUpserted = 0;
    const totalBatches = Math.ceil(allRows.length / UPSERT_BATCH_SIZE);

    for (let i = 0; i < allRows.length; i += UPSERT_BATCH_SIZE) {
      const batch = allRows.slice(i, i + UPSERT_BATCH_SIZE);
      const batchNum = Math.floor(i / UPSERT_BATCH_SIZE) + 1;
      const batchT0 = Date.now();

      const { error: upsertError } = await serviceClient
        .from("orders")
        .upsert(batch, { onConflict: "order_number" });

      const batchElapsed = Date.now() - batchT0;

      if (upsertError) {
        err(`[Phase 3/3] Upsert FAILED at batch ${batchNum}/${totalBatches} (${batchElapsed}ms): ${upsertError.message}`);
        err(`[Phase 3/3] Failed batch order_numbers: ${batch.slice(0, 5).map((r) => r.order_number).join(", ")}${batch.length > 5 ? "..." : ""}`);
        throw new Error(`Supabase upsert error: ${upsertError.message}`);
      }

      totalUpserted += batch.length;
      log(`[Phase 3/3] Batch ${batchNum}/${totalBatches}: ${batch.length} rows upserted (${batchElapsed}ms) — cumulative: ${totalUpserted}/${allRows.length}`);
    }

    const upsertElapsed = Date.now() - upsertT0;
    log(`[Phase 3/3] All upserts complete in ${upsertElapsed}ms`);

    // --- Summary ---
    const totalElapsed = Date.now() - t0;
    log(`=== SYNC COMPLETE ===`);
    log(`  Date range:       ${startDate} → ${endDate} (${dayDiff} days)`);
    log(`  Raw orders:       ${totalRawOrders}`);
    log(`  Skipped (no ID):  ${skippedNoOrderNumber}`);
    log(`  Upserted:         ${totalUpserted}`);
    log(`  Unique customers: ${uniqueCustomers}`);
    log(`  Unique fabrics:   ${uniqueFabrics}`);
    log(`  Unique shops:     ${uniqueShops}`);
    log(`  Timing:           fetch=${fetchElapsed}ms, transform=${transformElapsed}ms, upsert=${upsertElapsed}ms, total=${totalElapsed}ms`);
    log(`========================`);

    return NextResponse.json({
      success: true,
      totalFetched: totalRawOrders,
      totalUpserted,
      skippedNoOrderNumber,
      uniqueCustomers,
      uniqueFabrics,
      uniqueShops,
      elapsed: totalElapsed,
      timing: {
        fetch: fetchElapsed,
        transform: transformElapsed,
        upsert: upsertElapsed,
      },
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error";
    err(`SYNC FAILED: ${message}`);
    if (error instanceof Error && error.stack) {
      err(`Stack: ${error.stack}`);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
