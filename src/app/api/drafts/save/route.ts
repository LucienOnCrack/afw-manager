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
    if (!body || !body.wizardState) {
      return NextResponse.json({ error: "wizardState is required" }, { status: 400 });
    }

    const ws = body.wizardState;
    const customerName = ws.customer
      ? `${ws.customer.FirstName} ${ws.customer.LastName}`.trim()
      : "No customer";
    const itemName = ws.itemType?.Name ?? "No item";
    const title = `${customerName} — ${itemName}`;

    if (body.id) {
      const { data, error } = await supabase
        .from("draft_orders")
        .update({ wizard_state: ws, title })
        .eq("id", body.id)
        .eq("created_by", user.id)
        .select("id, title, updated_at")
        .single();

      if (error) {
        console.error("[Drafts] Update failed:", error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ draft: data });
    }

    const { data, error } = await supabase
      .from("draft_orders")
      .insert({ created_by: user.id, title, wizard_state: ws })
      .select("id, title, created_at, updated_at")
      .single();

    if (error) {
      console.error("[Drafts] Insert failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ draft: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save draft";
    console.error("[Drafts]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
