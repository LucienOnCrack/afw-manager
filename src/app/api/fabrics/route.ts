import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Fabric, FabricsApiResponse, GarmentPrice, Surcharge } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "all";
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));
    const sort = searchParams.get("sort") || "code";
    const dir = searchParams.get("dir") === "desc" ? false : true;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let countQuery = supabase
      .from("fabrics")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase
      .from("fabrics")
      .select("*")
      .range(from, to);

    if (type !== "all") {
      countQuery = countQuery.eq("used_for", type);
      dataQuery = dataQuery.eq("used_for", type);
    }

    if (search.trim()) {
      const tsQuery = search.trim().split(/\s+/).join(" & ");
      countQuery = countQuery.textSearch("fts", tsQuery, { type: "plain" });
      dataQuery = dataQuery.textSearch("fts", tsQuery, { type: "plain" });
    }

    const sortColumn = ({
      code: "code",
      name: "name",
      supplier: "supplier",
      priceCategory: "price_categories",
      stock: "stock",
      usedFor: "used_for",
    } as Record<string, string>)[sort] || "code";

    dataQuery = dataQuery.order(sortColumn, { ascending: dir, nullsFirst: false });

    const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countError) throw new Error(countError.message);
    if (dataError) throw new Error(dataError.message);

    const totalCount = count ?? 0;

    const { data: statsData, error: statsErr } = await supabase.rpc("get_fabric_stats");
    if (statsErr) throw new Error(statsErr.message);

    const stats = {
      uniqueTypes: statsData?.unique_types ?? 0,
      uniquePriceCodes: statsData?.unique_price_codes ?? 0,
      uniqueSuppliers: statsData?.unique_suppliers ?? 0,
      inStockCount: statsData?.in_stock_count ?? 0,
    };

    const fabrics: Fabric[] = (data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      collection: row.collection,
      bunch: row.bunch,
      supplier: row.supplier,
      composition: row.composition,
      description: row.description,
      priceCategory: row.price_categories,
      stock: row.stock ?? 0,
      status: row.status,
      statusId: row.status_id ?? 0,
      imageUrl: row.image_url,
      usedFor: row.used_for,
      atelierName: row.atelier_name,
      season: row.season,
      cutLength: row.cut_length_fabric ?? false,
      rPrice: row.r_price ?? 0,
      soldOutSince: row.sold_out_since,
      extraDays: row.extra_days ?? 0,
      fabricOnOrder: row.fabric_on_order ?? 0,
      isCustomerOwn: row.is_customer_own ?? false,
    }));

    const allCats = new Set<string>();
    for (const f of fabrics) {
      if (!f.priceCategory) continue;
      for (const part of f.priceCategory.split(",")) {
        const trimmed = part.trim();
        if (trimmed) allCats.add(trimmed);
      }
    }
    const categories = [...allCats];

    const priceMap: Record<string, GarmentPrice[]> = {};
    if (categories.length > 0) {
      const { data: priceRows, error: priceErr } = await supabase
        .from("price_list")
        .select("price_category, section, construction, make_type, garment_type, price_eur")
        .in("price_category", categories)
        .eq("season", "SS26")
        .order("section")
        .order("garment_type");
      if (!priceErr && priceRows) {
        for (const row of priceRows) {
          const cat = row.price_category;
          if (!priceMap[cat]) priceMap[cat] = [];
          priceMap[cat].push({
            section: row.section,
            construction: row.construction,
            make_type: row.make_type,
            garment_type: row.garment_type,
            price_eur: row.price_eur,
          });
        }
      }
    }

    const surchargesMap: Record<string, Surcharge[]> = {};
    const { data: surchargeRows, error: surchargeErr } = await supabase
      .from("surcharges")
      .select("section, name, price_eur, invoice_code, remarks")
      .eq("season", "SS26")
      .order("section")
      .order("name");
    if (!surchargeErr && surchargeRows) {
      for (const row of surchargeRows) {
        if (!surchargesMap[row.section]) surchargesMap[row.section] = [];
        surchargesMap[row.section].push({
          section: row.section,
          name: row.name,
          price_eur: row.price_eur,
          invoice_code: row.invoice_code,
          remarks: row.remarks,
        });
      }
    }

    const response: FabricsApiResponse = {
      fabrics,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats,
      priceMap,
      surcharges: surchargesMap,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error fetching fabrics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
