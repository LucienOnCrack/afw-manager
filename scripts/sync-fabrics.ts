import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

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

function getCredentials() {
  const UserName = process.env.GOCREATE_USERNAME;
  const Password = process.env.GOCREATE_PASSWORD;
  const AuthenticationToken = process.env.GOCREATE_AUTH_TOKEN;
  if (!UserName || !Password || !AuthenticationToken) {
    throw new Error("Missing GoCreate credentials in .env.local");
  }
  return { UserName, Password, AuthenticationToken };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase credentials in .env.local");
  }
  return createClient(url, key);
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
      console.log(`  429 rate limited, backing off ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
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

async function upsertBatch(
  supabase: any,
  rows: ReturnType<typeof toDbRow>[]
) {
  const { error } = await supabase
    .from("fabrics")
    .upsert(rows as any, { onConflict: "id" });

  if (error) {
    throw new Error(`Supabase upsert error: ${error.message}`);
  }
}

async function main() {
  console.log("=== GoCreate -> Supabase Fabric Sync ===\n");

  const creds = getCredentials();
  const supabase = getSupabase();
  const seenIds = new Set<number>();
  let pendingRows: ReturnType<typeof toDbRow>[] = [];
  let totalFetched = 0;
  let totalUpserted = 0;

  async function flushBatch() {
    if (pendingRows.length === 0) return;
    await upsertBatch(supabase, pendingRows);
    totalUpserted += pendingRows.length;
    console.log(`  -> Upserted ${pendingRows.length} rows (total: ${totalUpserted})`);
    pendingRows = [];
  }

  for (const prefix of CODE_PREFIXES) {
    let page = 1;
    let prefixCount = 0;

    while (true) {
      console.log(`[${prefix}] page ${page}...`);

      const response = await apiPostWithRetry<FabricPostResponse>("/Fabric/Post", {
        ...creds,
        PageNo: page,
        PageSize: PAGE_SIZE,
        FabricInputs: [{ ID: 0, Code: prefix, SearchStartWith: true }],
      });

      if (!response.IsValidResult) {
        console.log(`  [${prefix}] API error: ${response.ErrorCode} - ${response.ErrorMessage}, skipping`);
        break;
      }

      const batch = (response.FabricStockResult ?? []).filter(
        (f) => f.MessageCode !== "NOT_FOUND"
      );

      let newInBatch = 0;
      for (const fabric of batch) {
        if (!seenIds.has(fabric.Id)) {
          seenIds.add(fabric.Id);
          pendingRows.push(toDbRow(fabric));
          newInBatch++;

          if (pendingRows.length >= UPSERT_BATCH_SIZE) {
            await flushBatch();
          }
        }
      }

      prefixCount += newInBatch;
      totalFetched += newInBatch;
      console.log(`  [${prefix}] page ${page}: ${batch.length} results, ${newInBatch} new (prefix total: ${prefixCount}, grand total: ${totalFetched})`);

      if (batch.length < PAGE_SIZE) break;
      page++;

      await sleep(DELAY_MS);
    }

    await sleep(DELAY_MS);
  }

  await flushBatch();

  console.log(`\n=== Sync complete ===`);
  console.log(`Total unique fabrics: ${totalFetched}`);
  console.log(`Total upserted to Supabase: ${totalUpserted}`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
