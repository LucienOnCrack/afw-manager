import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const API_BASE = "https://api.gocreate.nu";
const DELAY_MS = 500;
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 3000;
const MAX_BACKOFF_MS = 30000;
const PAGE_SIZE = 500;
const UPSERT_BATCH_SIZE = 500;

const CODE_PREFIXES = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];

interface FabricStockInfo {
  Id: number;
  Code: string | null;
  Name: string | null;
  Bunch: string | null;
  Collection: string | null;
  ImageUrl: string | null;
  Supplier: string | null;
  Season: string | null;
  AtelierName: string | null;
  Description: string | null;
  PPriceCategories: string | null;
  CutLengthFabric: boolean;
  Stock: number;
  ExtraDays: number;
  RPrice: number;
  SoldOutSince: string | null;
  Status: string | null;
  StatusId: number;
  UsedFor: string | null;
  Composition: string | null;
  FabricOnOrder: number;
  IsCustomerOwn: boolean;
  MessageCode: string | null;
}

interface FabricPostResponse {
  IsValidResult: boolean;
  ErrorCode: string | null;
  ErrorMessage: string | null;
  FabricStockResult: FabricStockInfo[] | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiPostWithRetry<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  let backoff = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`Rate limited after ${MAX_RETRIES} retries`);
      }
      await sleep(backoff);
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      continue;
    }

    if (!res.ok) {
      throw new Error(`GoCreate API error ${res.status}: ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  throw new Error("Unreachable");
}

function toDbRow(f: FabricStockInfo) {
  return {
    id: f.Id,
    code: f.Code,
    name: f.Name,
    bunch: f.Bunch,
    collection: f.Collection,
    image_url: f.ImageUrl,
    supplier: f.Supplier,
    season: f.Season,
    atelier_name: f.AtelierName,
    description: f.Description,
    price_categories: f.PPriceCategories,
    cut_length_fabric: f.CutLengthFabric,
    stock: f.Stock,
    extra_days: f.ExtraDays,
    r_price: f.RPrice,
    sold_out_since: f.SoldOutSince,
    status: f.Status,
    status_id: f.StatusId,
    used_for: f.UsedFor,
    composition: f.Composition,
    fabric_on_order: f.FabricOnOrder,
    is_customer_own: f.IsCustomerOwn,
    synced_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const syncSecret = process.env.SYNC_SECRET;
  if (!syncSecret) {
    return NextResponse.json(
      { error: "SYNC_SECRET not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userName = process.env.GOCREATE_USERNAME;
  const password = process.env.GOCREATE_PASSWORD;
  const authToken = process.env.GOCREATE_AUTH_TOKEN;

  if (!userName || !password || !authToken) {
    return NextResponse.json(
      { error: "Missing GoCreate credentials" },
      { status: 500 }
    );
  }

  const creds = {
    UserName: userName,
    Password: password,
    AuthenticationToken: authToken,
  };

  try {
    const supabase = getServiceClient();
    const seenIds = new Set<number>();
    let pendingRows: ReturnType<typeof toDbRow>[] = [];
    let totalFetched = 0;
    let totalUpserted = 0;

    async function flushBatch() {
      if (pendingRows.length === 0) return;
      const { error } = await supabase
        .from("fabrics")
        .upsert(pendingRows, { onConflict: "id" });
      if (error) throw new Error(`Supabase upsert error: ${error.message}`);
      totalUpserted += pendingRows.length;
      pendingRows = [];
    }

    for (const prefix of CODE_PREFIXES) {
      let pageNum = 1;

      while (true) {
        const response = await apiPostWithRetry<FabricPostResponse>(
          "/Fabric/Post",
          {
            ...creds,
            PageNo: pageNum,
            PageSize: PAGE_SIZE,
            FabricInputs: [{ ID: 0, Code: prefix, SearchStartWith: true }],
          }
        );

        if (!response.IsValidResult) break;

        const batch = (response.FabricStockResult ?? []).filter(
          (f) => f.MessageCode !== "NOT_FOUND"
        );

        for (const fabric of batch) {
          if (!seenIds.has(fabric.Id)) {
            seenIds.add(fabric.Id);
            pendingRows.push(toDbRow(fabric));
            totalFetched++;

            if (pendingRows.length >= UPSERT_BATCH_SIZE) {
              await flushBatch();
            }
          }
        }

        if (batch.length < PAGE_SIZE) break;
        pageNum++;
        await sleep(DELAY_MS);
      }

      await sleep(DELAY_MS);
    }

    await flushBatch();

    return NextResponse.json({
      success: true,
      totalFetched,
      totalUpserted,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
