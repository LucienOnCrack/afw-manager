import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const API_BASE = "https://api.gocreate.nu";

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

async function checkRateLimitHeaders() {
  console.log("\n========== RESPONSE HEADERS CHECK ==========\n");
  const creds = getCredentials();

  const res = await fetch(`${API_BASE}/Fabric/Post`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...creds,
      PageNo: 1,
      PageSize: 500,
      FabricInputs: [{ ID: 0, Code: "A", SearchStartWith: true }],
    }),
  });

  console.log(`  Status: ${res.status}`);
  console.log(`  Headers:`);
  res.headers.forEach((value, key) => {
    console.log(`    ${key}: ${value}`);
  });
}

async function testPageSize() {
  console.log("\n========== PAGE SIZE TEST ==========\n");
  const creds = getCredentials();

  for (const size of [500, 1000, 2000, 5000, 10000]) {
    try {
      const start = Date.now();
      const res = await fetch(`${API_BASE}/Fabric/Post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          PageNo: 1,
          PageSize: size,
          FabricInputs: [{ ID: 0, Code: "A", SearchStartWith: true }],
        }),
      });

      const elapsed = Date.now() - start;

      if (res.status === 429) {
        console.log(`  PageSize=${size} -> 429 RATE LIMITED (${elapsed}ms)`);
        const retryAfter = res.headers.get("Retry-After");
        if (retryAfter) console.log(`    Retry-After: ${retryAfter}`);
        await sleep(5000);
        continue;
      }

      if (!res.ok) {
        console.log(`  PageSize=${size} -> HTTP ${res.status} ${res.statusText} (${elapsed}ms)`);
        continue;
      }

      const data = await res.json();
      const count = data.FabricStockResult?.length ?? 0;
      console.log(`  PageSize=${size} -> got ${count} results in ${elapsed}ms`);

      if (count < size) {
        console.log(`    (prefix "A" only has ${count} fabrics, so can't tell if ${size} is the cap)`);
      } else {
        console.log(`    Full page returned — API accepts PageSize=${size}`);
      }
    } catch (err) {
      console.log(`  PageSize=${size} -> ERROR: ${err}`);
    }

    await sleep(1000);
  }
}

async function testConcurrency() {
  console.log("\n========== CONCURRENCY TEST ==========\n");
  const creds = getCredentials();
  const prefixes = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  ];

  for (const n of [5, 10, 15, 20, 36]) {
    const batch = prefixes.slice(0, n);
    const start = Date.now();
    let rateLimited = 0;
    let succeeded = 0;
    let errored = 0;

    await Promise.allSettled(
      batch.map(async (prefix) => {
        const res = await fetch(`${API_BASE}/Fabric/Post`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...creds,
            PageNo: 1,
            PageSize: 500,
            FabricInputs: [{ ID: 0, Code: prefix, SearchStartWith: true }],
          }),
        });
        if (res.status === 429) { rateLimited++; return; }
        if (!res.ok) { errored++; return; }
        succeeded++;
      })
    );

    const elapsed = Date.now() - start;
    console.log(`  ${n} concurrent -> ${succeeded} ok, ${rateLimited} rate-limited, ${errored} errors (${elapsed}ms)`);

    await sleep(3000);
  }
}

async function testDelays() {
  console.log("\n========== DELAY TEST (20 sequential requests each) ==========\n");
  const creds = getCredentials();

  for (const delay of [0, 50, 100, 250, 500]) {
    let rateLimited = 0;
    let succeeded = 0;
    const start = Date.now();

    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${API_BASE}/Fabric/Post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          PageNo: 1,
          PageSize: 500,
          FabricInputs: [{ ID: 0, Code: "A", SearchStartWith: true }],
        }),
      });
      if (res.status === 429) rateLimited++;
      else if (res.ok) succeeded++;
      if (delay > 0) await sleep(delay);
    }

    const elapsed = Date.now() - start;
    console.log(`  delay=${delay}ms -> ${succeeded}/20 ok, ${rateLimited}/20 rate-limited (${elapsed}ms total)`);

    await sleep(3000);
  }
}

async function main() {
  console.log("=== GoCreate API Rate Limit Tester ===");
  console.log("(Read-only — does NOT touch Supabase or your database)\n");

  await checkRateLimitHeaders();
  await testPageSize();
  await testConcurrency();
  await testDelays();

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
