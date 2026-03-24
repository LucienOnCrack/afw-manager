import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchOrdersByCustomerId, fetchOrderByNumber } from "@/lib/gocreate";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const customerId = body?.customerId;
    if (!customerId || typeof customerId !== "number") {
      return NextResponse.json({ error: "customerId (number) is required" }, { status: 400 });
    }

    const orders = await fetchOrdersByCustomerId(customerId, 1, 50);

    const fitProfiles: {
      orderNumber: string;
      orderType: string;
      parts: {
        productPartId: number;
        productPartName: string;
        fitProfileName: string;
        fitName: string;
        makeName: string;
        tryOn: string;
      }[];
    }[] = [];

    const orderDetails = await Promise.all(
      orders.slice(0, 10).map(async (o) => {
        if (!o.OrderNumber) return null;
        try {
          const detail = await fetchOrderByNumber(o.OrderNumber, {
            itemDetails: true,
            fitTools: false,
            designOptions: false,
            brandingOptions: false,
          });
          if (!detail.IsValidResult || !detail.ItemDetails?.length) return null;
          return {
            orderNumber: o.OrderNumber,
            orderType: o.OrderType ?? "Unknown",
            parts: detail.ItemDetails.map((item) => ({
              productPartId: item.ProductPartId,
              productPartName: item.ProductPartName,
              fitProfileName: item.FitProfileName,
              fitName: item.FitName,
              makeName: item.MakeName,
              tryOn: item.TryOn,
            })),
          };
        } catch {
          return null;
        }
      })
    );

    for (const d of orderDetails) {
      if (d) fitProfiles.push(d);
    }

    return NextResponse.json({
      orders: orders.map((o) => ({
        orderNumber: o.OrderNumber,
        orderType: o.OrderType,
        status: o.Status,
        fabric: o.Fabric,
        createdDate: o.CreatedDate,
      })),
      fitProfiles,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch customer orders";
    console.error(`[Orders By Customer] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
