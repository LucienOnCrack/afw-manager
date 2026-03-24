import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchCustomers } from "@/lib/gocreate";
import type { CustomerInfo } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const query = (body.query as string)?.trim();
    const pageSize = body.pageSize ?? 50;

    if (body.firstName || body.lastName || body.email || body.mobile) {
      const customers = await searchCustomers({
        FirstName: body.firstName,
        LastName: body.lastName,
        Email: body.email,
        MobileNumber: body.mobile,
        PhoneNumber: body.phone,
        PageNo: body.page ?? 1,
        PageSize: pageSize,
      });
      return NextResponse.json({ customers });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ customers: [] });
    }

    const parts = query.split(/\s+/);
    const seen = new Set<number>();
    const merged: CustomerInfo[] = [];

    function addUnique(list: CustomerInfo[]) {
      for (const c of list) {
        if (!seen.has(c.Id)) {
          seen.add(c.Id);
          merged.push(c);
        }
      }
    }

    if (parts.length >= 2) {
      const [first, ...rest] = parts;
      const last = rest.join(" ");
      const [byBoth, byLast, byFirst] = await Promise.all([
        searchCustomers({ FirstName: first, LastName: last, PageSize: pageSize }),
        searchCustomers({ LastName: last, PageSize: pageSize }),
        searchCustomers({ FirstName: first, PageSize: pageSize }),
      ]);
      addUnique(byBoth);
      addUnique(byLast);
      addUnique(byFirst);
    } else {
      const [byLast, byFirst] = await Promise.all([
        searchCustomers({ LastName: query, PageSize: pageSize }),
        searchCustomers({ FirstName: query, PageSize: pageSize }),
      ]);
      addUnique(byLast);
      addUnique(byFirst);
    }

    return NextResponse.json({ customers: merged });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer search failed";
    console.error(`[Customer Search] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
