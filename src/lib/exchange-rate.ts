const FALLBACK_EUR_TO_GBP = 0.86;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cached: { rate: number; fetchedAt: number } | null = null;

export async function getEurToGbp(): Promise<number> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rate;
  }
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?symbols=GBP", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate = data?.rates?.GBP;
    if (typeof rate === "number" && rate > 0) {
      cached = { rate, fetchedAt: Date.now() };
      return rate;
    }
  } catch (e) {
    console.warn("[Exchange Rate] Failed to fetch live rate, using fallback", e);
  }
  return cached?.rate ?? FALLBACK_EUR_TO_GBP;
}
