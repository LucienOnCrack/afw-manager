import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("draft_orders")
      .select("id, title, status, gocreate_id, order_number, created_at, updated_at")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Drafts] List failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ drafts: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list drafts";
    console.error("[Drafts]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
