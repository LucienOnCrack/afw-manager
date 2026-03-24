"use client";

import { useState, useEffect, useRef } from "react";
import type { CatalogData } from "@/lib/gocreate-catalog";

let cachedCatalog: CatalogData | null = null;
let fetchPromise: Promise<CatalogData> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchCatalog(): Promise<CatalogData> {
  const res = await fetch("/api/catalog", { cache: "no-store" });
  if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
  return res.json();
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogData | null>(cachedCatalog);
  const [loading, setLoading] = useState(!cachedCatalog);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const cacheValid = cachedCatalog && Date.now() - cacheTimestamp < CACHE_TTL_MS;
    if (cacheValid) {
      setCatalog(cachedCatalog);
      setLoading(false);
      return;
    }

    // Invalidate stale cache
    cachedCatalog = null;
    fetchPromise = null;

    if (!fetchPromise) {
      fetchPromise = fetchCatalog();
    }

    fetchPromise
      .then((data) => {
        cachedCatalog = data;
        cacheTimestamp = Date.now();
        if (mountedRef.current) {
          setCatalog(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        fetchPromise = null;
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load catalog");
          setLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { catalog, loading, error };
}
