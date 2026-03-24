import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchOrderByNumber } from "@/lib/gocreate";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const orderNumber = body?.orderNumber;
    if (!orderNumber || typeof orderNumber !== "string") {
      return NextResponse.json({ error: "orderNumber (string) is required" }, { status: 400 });
    }

    const detail = await fetchOrderByNumber(orderNumber, {
      fitTools: body?.fitTools !== false,
      designOptions: body?.designOptions !== false,
      itemDetails: body?.itemDetails !== false,
      brandingOptions: body?.brandingOptions !== false,
    });

    if (!detail.IsValidResult) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    console.error(`[Order By Number] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
