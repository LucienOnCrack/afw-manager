import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("draft_orders")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) {
      console.error("[Drafts] Delete failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete draft";
    console.error("[Drafts]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("draft_orders")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (error) {
      console.error("[Drafts] Get failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ draft: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to get draft";
    console.error("[Drafts]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
