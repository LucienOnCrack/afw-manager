import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEurToGbp } from "@/lib/exchange-rate";
import type { GarmentPrice, Surcharge } from "@/lib/types";

type PriceRow = { price_category: string; section: string; construction: string | null; make_type: string | null; garment_type: string; price_eur: number };

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    async function fetchAllPrices(): Promise<PriceRow[]> {
      const all: PriceRow[] = [];
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("price_list")
          .select("price_category, section, construction, make_type, garment_type, price_eur")
          .eq("season", "SS26")
          .range(from, from + pageSize - 1)
          .order("price_category")
          .order("section")
          .order("garment_type");
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        all.push(...(data as PriceRow[]));
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return all;
    }

    const [priceRows, surchargeResult] = await Promise.all([
      fetchAllPrices(),
      supabase
        .from("surcharges")
        .select("section, name, price_eur, invoice_code, remarks")
        .eq("season", "SS26")
        .order("section")
        .order("name"),
    ]);

    if (surchargeResult.error) throw new Error(surchargeResult.error.message);

    const priceMap: Record<string, GarmentPrice[]> = {};
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

    const surcharges: Record<string, Surcharge[]> = {};
    for (const row of surchargeResult.data ?? []) {
      if (!surcharges[row.section]) surcharges[row.section] = [];
      surcharges[row.section].push({
        section: row.section,
        name: row.name,
        price_eur: row.price_eur,
        invoice_code: row.invoice_code,
        remarks: row.remarks,
      });
    }

    const eurToGbp = await getEurToGbp();

    return NextResponse.json({ priceMap, surcharges, eurToGbp });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load pricing";
    console.error("[Pricing]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
