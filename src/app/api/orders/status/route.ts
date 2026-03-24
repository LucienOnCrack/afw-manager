import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { updateOrderStatus } from "@/lib/gocreate";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const orderNumber = body?.orderNumber as string | undefined;
    const status = body?.status as number | undefined;
    const remarks = body?.remarks as string | undefined;

    if (!orderNumber || status === undefined) {
      return NextResponse.json(
        { error: "orderNumber and status are required" },
        { status: 400 }
      );
    }

    console.log(`[Status Update] ${orderNumber} → status ${status} by ${user.email}`);

    const result = await updateOrderStatus(orderNumber, status, remarks);

    if (!result.success) {
      console.error(`[Status Update] Failed: ${result.message}`);
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    await serviceClient
      .from("orders")
      .update({ status: body.statusLabel ?? `Status ${status}`, synced_at: new Date().toISOString() })
      .eq("order_number", orderNumber);

    console.log(`[Status Update] ${orderNumber} updated successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status update failed";
    console.error(`[Status Update] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
