import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const API_BASE = "https://api.gocreate.nu";
const MAX_RETRIES = 6;
const INITIAL_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 30000;
const PAGE_SIZE = 5000;
const UPSERT_BATCH_SIZE = 500;
const CONCURRENCY = 5;

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

async function apiPostWithRetry(
  endpoint: string,
  body: Record<string, unknown>
): Promise<FabricPostResponse> {
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
      console.log(`    429 rate limited — waiting ${(backoff / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      continue;
    }

    if (!res.ok) {
      throw new Error(`GoCreate API error ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as FabricPostResponse;
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

async function loadExistingIds(supabase: any): Promise<Set<number>> {
  const ids = new Set<number>();
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("fabrics")
      .select("id")
      .range(from, from + batchSize - 1);

    if (error) throw new Error(`Supabase select error: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) ids.add((row as { id: number }).id);
    from += batchSize;
  }

  return ids;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
) {
  const queue = [...items];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log("=== GoCreate -> Supabase RESUME Sync ===");
  console.log(`    PageSize: ${PAGE_SIZE} | Concurrency: ${CONCURRENCY} | No delays\n`);

  const creds = getCredentials();
  const supabase = getSupabase();

  console.log("Loading existing fabric IDs from Supabase...");
  const existingIds = await loadExistingIds(supabase);
  console.log(`  Found ${existingIds.size.toLocaleString()} fabrics already in DB\n`);

  let totalNew = 0;
  let totalSkipped = 0;
  let totalUpserted = 0;
  const start = Date.now();

  const upsertLock = { pending: [] as ReturnType<typeof toDbRow>[] };

  async function flushBatch() {
    if (upsertLock.pending.length === 0) return;
    const batch = upsertLock.pending.splice(0, UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from("fabrics")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      console.error(`  Supabase upsert error: ${error.message}`);
      return;
    }
    totalUpserted += batch.length;
  }

  await runWithConcurrency(CODE_PREFIXES, CONCURRENCY, async (prefix) => {
    let page = 1;
    let prefixNew = 0;
    let prefixSkipped = 0;

    while (true) {
      try {
        const response = await apiPostWithRetry("/Fabric/Post", {
          ...creds,
          PageNo: page,
          PageSize: PAGE_SIZE,
          FabricInputs: [{ ID: 0, Code: prefix, SearchStartWith: true }],
        });

        if (!response.IsValidResult) {
          console.log(`  [${prefix}] API error: ${response.ErrorCode} — skipping`);
          break;
        }

        const batch = (response.FabricStockResult ?? []).filter(
          (f) => f.MessageCode !== "NOT_FOUND"
        );

        for (const fabric of batch) {
          if (existingIds.has(fabric.Id)) {
            prefixSkipped++;
            continue;
          }
          existingIds.add(fabric.Id);
          upsertLock.pending.push(toDbRow(fabric));
          prefixNew++;

          if (upsertLock.pending.length >= UPSERT_BATCH_SIZE) {
            await flushBatch();
          }
        }

        if (batch.length < PAGE_SIZE) break;
        page++;
      } catch (err) {
        console.log(`  [${prefix}] ERROR on page ${page}: ${err} — retrying after pause`);
        await sleep(5000);
      }
    }

    totalNew += prefixNew;
    totalSkipped += prefixSkipped;
    console.log(`  [${prefix}] done — ${prefixNew.toLocaleString()} new, ${prefixSkipped.toLocaleString()} skipped (already in DB)`);
  });

  await flushBatch();
  while (upsertLock.pending.length > 0) {
    await flushBatch();
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n=== Resume sync complete ===`);
  console.log(`  Already in DB:    ${(existingIds.size - totalNew).toLocaleString()}`);
  console.log(`  Skipped:          ${totalSkipped.toLocaleString()}`);
  console.log(`  New fabrics:      ${totalNew.toLocaleString()}`);
  console.log(`  Total upserted:   ${totalUpserted.toLocaleString()}`);
  console.log(`  Total in DB now:  ${existingIds.size.toLocaleString()}`);
  console.log(`  Time:             ${elapsed}s`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
