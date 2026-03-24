import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/gocreate";
import type { OrderCreateData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: OrderCreateData | null = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.CustomerId || !body.Item?.Id || !body.Fabric?.Id) {
      return NextResponse.json(
        { error: "CustomerId, Item, and Fabric are required" },
        { status: 400 }
      );
    }

    console.log(`[Order Create] Creating order for customer ${body.CustomerId}, item=${body.Item.Name}, fabric=${body.Fabric.Name} by ${user.email}`);
    const t0 = Date.now();

    const result = await createOrder(body);

    if (!result.success) {
      console.error(`[Order Create] Failed: ${result.errorMessage}`);
      return NextResponse.json(
        { error: result.errorMessage },
        { status: 400 }
      );
    }

    console.log(`[Order Create] Success — ID=${result.id} in ${Date.now() - t0}ms`);
    return NextResponse.json({ success: true, orderId: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order creation failed";
    console.error(`[Order Create] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
