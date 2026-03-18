import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const API_BASE = "https://api.gocreate.nu";
const MAX_RETRIES = 6;
const INITIAL_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 30000;
const CONCURRENCY = 5;
const PAGE_SIZE = 5000;

const CODE_PREFIXES = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];

function getCredentials() {
  const UserName = process.env.GOCREATE_USERNAME;
  const Password = process.env.GOCREATE_PASSWORD;
  const AuthenticationToken = process.env.GOCREATE_AUTH_TOKEN;
  if (!UserName || !Password || !AuthenticationToken) {
    throw new Error("Missing GoCreate credentials in .env.local");
  }
  return { UserName, Password, AuthenticationToken };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface FabricResult {
  Id: number;
  MessageCode: string | null;
}

interface FabricPostResponse {
  IsValidResult: boolean;
  FabricStockResult: FabricResult[] | null;
}

async function fetchWithRetry(
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
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as FabricPostResponse;
  }

  throw new Error("Unreachable");
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
  console.log("=== GoCreate Fabric Count (read-only, no DB writes) ===");
  console.log(`    Concurrency: ${CONCURRENCY} | PageSize: ${PAGE_SIZE} | Retries: ${MAX_RETRIES}\n`);

  const creds = getCredentials();
  const seenIds = new Set<number>();
  const start = Date.now();

  const prefixCounts = new Map<string, number>();

  await runWithConcurrency(CODE_PREFIXES, CONCURRENCY, async (prefix) => {
    let page = 1;
    let prefixUnique = 0;
    let prefixRaw = 0;

    while (true) {
      try {
        const data = await fetchWithRetry("/Fabric/Post", {
          ...creds,
          PageNo: page,
          PageSize: PAGE_SIZE,
          FabricInputs: [{ ID: 0, Code: prefix, SearchStartWith: true }],
        });

        const batch = (data.FabricStockResult ?? []).filter(
          (f) => f.MessageCode !== "NOT_FOUND"
        );

        prefixRaw += batch.length;
        for (const f of batch) {
          if (!seenIds.has(f.Id)) {
            seenIds.add(f.Id);
            prefixUnique++;
          }
        }

        if (batch.length < PAGE_SIZE) break;
        page++;
      } catch (err) {
        console.log(`  [${prefix}] ERROR on page ${page}: ${err} — skipping rest of prefix`);
        break;
      }
    }

    prefixCounts.set(prefix, prefixUnique);
    const pages = page;
    console.log(`  [${prefix}] ${prefixUnique.toLocaleString()} unique (${prefixRaw.toLocaleString()} raw) across ${pages} page${pages > 1 ? "s" : ""}`);
  });

  const sorted = [...prefixCounts.entries()].sort(([a], [b]) => a.localeCompare(b));

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log("\n  ========================");
  console.log("  Prefix  |  Unique Count");
  console.log("  --------|-------------");

  let sum = 0;
  for (const [prefix, count] of sorted) {
    console.log(`     ${prefix}     |  ${count.toLocaleString()}`);
    sum += count;
  }

  console.log("  --------|-------------");
  console.log(`  SUM     |  ${sum.toLocaleString()}`);
  console.log(`  UNIQUE  |  ${seenIds.size.toLocaleString()} (deduplicated by ID)`);
  console.log(`\n  Completed in ${elapsed}s`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
