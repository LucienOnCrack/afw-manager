import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/gocreate";
import type { OrderCreateData } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: draft, error: fetchErr } = await supabase
      .from("draft_orders")
      .select("id, status, wizard_state")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (fetchErr || !draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    if (draft.status === "submitted") {
      return NextResponse.json({ error: "Draft already submitted" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.payload) {
      return NextResponse.json({ error: "payload (OrderCreateData) is required" }, { status: 400 });
    }

    const payload: OrderCreateData = body.payload;
    if (!payload.CustomerId || !payload.Item?.Id || !payload.Fabric?.Id) {
      return NextResponse.json(
        { error: "CustomerId, Item, and Fabric are required in payload" },
        { status: 400 }
      );
    }

    console.log(`[Draft Submit] Submitting draft ${id} for customer ${payload.CustomerId} by ${user.email}`);
    const t0 = Date.now();

    const result = await createOrder(payload);

    if (!result.success) {
      console.error(`[Draft Submit] GoCreate rejected: ${result.errorMessage}`);
      return NextResponse.json({ error: result.errorMessage }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from("draft_orders")
      .update({
        status: "submitted",
        gocreate_id: result.id,
        order_number: result.id?.toString() ?? null,
      })
      .eq("id", id)
      .eq("created_by", user.id);

    if (updateErr) {
      console.error(`[Draft Submit] Order created (${result.id}) but draft update failed:`, updateErr.message);
    }

    console.log(`[Draft Submit] Success — GoCreate ID=${result.id} in ${Date.now() - t0}ms`);
    return NextResponse.json({ success: true, orderId: result.id, draftId: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit draft";
    console.error("[Draft Submit]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
