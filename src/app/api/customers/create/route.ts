import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addCustomer } from "@/lib/gocreate";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.FirstName || !body?.LastName) {
      return NextResponse.json(
        { error: "FirstName and LastName are required" },
        { status: 400 }
      );
    }

    const result = await addCustomer(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create customer";
    console.error(`[Customer Create] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
