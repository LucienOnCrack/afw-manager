import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const code = body?.code;
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const pageSize = Math.min(body?.pageSize ?? 50, 200);

    const prefix = code.toUpperCase();

    const { data, error } = await supabase
      .from("fabrics")
      .select("id, code, name, used_for, stock, image_url, price_categories, cut_length_fabric, composition, supplier, r_price, status_id, extra_days, sold_out_since")
      .like("code", `${prefix}%`)
      .order("code")
      .limit(pageSize);

    if (error) throw new Error(error.message);

    const fabrics = (data ?? []).map((row) => ({
      Id: row.id,
      Code: row.code,
      Name: row.name,
      ImageUrl: row.image_url,
      Stock: row.stock ?? 0,
      PPriceCategories: row.price_categories,
      CutLengthFabric: row.cut_length_fabric ?? false,
      Composition: row.composition,
      Supplier: row.supplier,
      RPrice: row.r_price ?? 0,
      UsedFor: row.used_for,
      StatusId: row.status_id ?? 0,
      ExtraDays: row.extra_days ?? 0,
      SoldOutSince: row.sold_out_since,
    }));

    return NextResponse.json({ fabrics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fabric search failed";
    console.error(`[Fabric Search] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
