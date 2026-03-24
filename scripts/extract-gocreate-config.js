// GoCreate Order Creation Config Extractor
// ==========================================
// Paste this ENTIRE script into your browser dev console (F12 → Console)
// while logged into gocreate.nu
//
// It will hit every order-creation config route and download a JSON file
// with ALL the data.

(async function extractGoCreateConfig() {
  const results = {};
  const errors = [];
  let completed = 0;

  const routes = [
    { key: "itemCombinations",   path: "/Order/GetItemCombinations" },
    { key: "productParts",       path: "/Product/GetParts" },
    { key: "orderProductParts",  path: "/Order/GetProductParts" },
    { key: "makes",              path: "/Order/GetMakes" },
    { key: "models",             path: "/Order/GetModels" },
    { key: "designOptionsAll",   path: "/DesignOption/GetAll" },
    { key: "designOptions",      path: "/Order/GetDesignOptions" },
    { key: "fitProfiles",        path: "/Order/GetFitProfiles" },
    { key: "fitTools",           path: "/Order/GetFitTools" },
    { key: "buttons",            path: "/Order/GetButtons" },
    { key: "linings",            path: "/Order/GetLinings" },
    { key: "trims",              path: "/Order/GetTrims" },
    { key: "brandingOptions",    path: "/Order/GetBrandingOptions" },
    { key: "monogramOptions",    path: "/Order/GetMonogramOptions" },
    { key: "designOptionsByPart",path: "/DesignOption/GetByProductPart" },
    { key: "orderCreate",        path: "/Order/Create" },
    { key: "orderNew",           path: "/Order/New" },
    { key: "orderIndex",         path: "/Order/Index" },
    { key: "fabricIndex",        path: "/Fabric/Index" },
    { key: "liningIndex",        path: "/Lining/Index" },
    { key: "settingsIndex",      path: "/Settings/Index" },
    { key: "homeIndex",          path: "/Home/Index" },
    { key: "dashboardIndex",     path: "/Dashboard/Index" },
    { key: "readymadeIndex",     path: "/ReadymadeOrderOverview/Index" },
    { key: "readymadeHasMulti",  path: "/ReadymadeOrderOverview/HasShopMultipleProductLine" },
    { key: "readymadeLoadPerShop", path: "/ReadymadeOrderOverview/LoadReadyMadeOrderCreationPerShop" },
  ];

  const total = routes.length;
  console.log(`%c[GoCreate Extractor] Starting extraction of ${total} routes...`, "color: #00ff00; font-weight: bold;");

  async function fetchRoute(route) {
    try {
      const resp = await fetch(route.path, {
        method: "GET",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      const contentType = resp.headers.get("content-type") || "";
      const text = await resp.text();
      completed++;

      let parsed = null;
      let dataType = "unknown";

      if (contentType.includes("json")) {
        try { parsed = JSON.parse(text); dataType = "json"; } catch(e) { parsed = text; dataType = "text"; }
      } else if (contentType.includes("html")) {
        dataType = "html";
        parsed = text;
      } else {
        try { parsed = JSON.parse(text); dataType = "json"; } catch(e) { parsed = text; dataType = "text"; }
      }

      const info = {
        status: resp.status,
        contentType,
        dataType,
        dataLength: text.length,
        data: parsed,
      };

      console.log(
        `%c[${completed}/${total}] ${route.key}: ${resp.status} (${dataType}, ${text.length} chars)`,
        resp.status === 200 ? "color: #00ff00" : "color: #ffaa00"
      );

      return info;
    } catch (err) {
      completed++;
      const errInfo = { status: 0, error: err.message, dataType: "error", data: null };
      console.log(`%c[${completed}/${total}] ${route.key}: ERROR - ${err.message}`, "color: #ff0000");
      errors.push({ route: route.key, path: route.path, error: err.message });
      return errInfo;
    }
  }

  // Also try POST variants for the key config routes
  const postRoutes = [
    { key: "POST_designOptions",    path: "/Order/GetDesignOptions" },
    { key: "POST_productParts",     path: "/Order/GetProductParts" },
    { key: "POST_makes",            path: "/Order/GetMakes" },
    { key: "POST_models",           path: "/Order/GetModels" },
    { key: "POST_fitProfiles",      path: "/Order/GetFitProfiles" },
    { key: "POST_fitTools",         path: "/Order/GetFitTools" },
    { key: "POST_buttons",          path: "/Order/GetButtons" },
    { key: "POST_linings",          path: "/Order/GetLinings" },
    { key: "POST_trims",            path: "/Order/GetTrims" },
    { key: "POST_brandingOptions",  path: "/Order/GetBrandingOptions" },
    { key: "POST_monogramOptions",  path: "/Order/GetMonogramOptions" },
    { key: "POST_itemCombinations", path: "/Order/GetItemCombinations" },
    { key: "POST_designOptionsAll", path: "/DesignOption/GetAll" },
    { key: "POST_designOptionsByPart", path: "/DesignOption/GetByProductPart" },
  ];

  // Fetch GET routes (4 at a time to avoid hammering)
  for (let i = 0; i < routes.length; i += 4) {
    const batch = routes.slice(i, i + 4);
    const batchResults = await Promise.all(batch.map(r => fetchRoute(r)));
    batch.forEach((r, idx) => { results[r.key] = batchResults[idx]; });
    if (i + 4 < routes.length) await new Promise(r => setTimeout(r, 300));
  }

  console.log(`%c[GoCreate Extractor] GET routes done. Now trying POST variants...`, "color: #00aaff; font-weight: bold;");

  // Fetch POST routes
  async function fetchPostRoute(route, body = {}) {
    try {
      const resp = await fetch(route.path, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch(e) { parsed = text; }
      const contentType = resp.headers.get("content-type") || "";
      console.log(`  POST ${route.key}: ${resp.status} (${text.length} chars)`);
      return { status: resp.status, contentType, dataLength: text.length, data: parsed };
    } catch (err) {
      console.log(`  POST ${route.key}: ERROR - ${err.message}`);
      return { status: 0, error: err.message, data: null };
    }
  }

  for (let i = 0; i < postRoutes.length; i += 4) {
    const batch = postRoutes.slice(i, i + 4);
    const batchResults = await Promise.all(batch.map(r => fetchPostRoute(r)));
    batch.forEach((r, idx) => { results[r.key] = batchResults[idx]; });
    if (i + 4 < postRoutes.length) await new Promise(r => setTimeout(r, 300));
  }

  // Also try POST with productPartId params (1=Jacket, 2=Trousers, 3=Waistcoat, 4=Shirt, 12=Bermuda, etc.)
  console.log(`%c[GoCreate Extractor] Trying parameterized routes...`, "color: #00aaff; font-weight: bold;");

  const partIds = [1, 2, 3, 4, 12, 21, 22, 23, 24, 32, 36];
  const combinationIds = [1, 2, 3, 4, 5, 7, 8, 9, 14, 16, 17, 22, 28, 29, 31, 32, 54, 59];

  for (const partId of partIds) {
    const r = await fetchPostRoute(
      { key: `designOptionsByPart_${partId}`, path: "/DesignOption/GetByProductPart" },
      { productPartId: partId, ProductPartId: partId }
    );
    results[`designOptionsByPart_${partId}`] = r;

    const r2 = await fetchPostRoute(
      { key: `designOptions_part${partId}`, path: "/Order/GetDesignOptions" },
      { productPartId: partId, ProductPartId: partId }
    );
    results[`designOptions_part${partId}`] = r2;

    const r3 = await fetchPostRoute(
      { key: `fitTools_part${partId}`, path: "/Order/GetFitTools" },
      { productPartId: partId, ProductPartId: partId }
    );
    results[`fitTools_part${partId}`] = r3;

    const r4 = await fetchPostRoute(
      { key: `makes_part${partId}`, path: "/Order/GetMakes" },
      { productPartId: partId, ProductPartId: partId }
    );
    results[`makes_part${partId}`] = r4;

    const r5 = await fetchPostRoute(
      { key: `models_part${partId}`, path: "/Order/GetModels" },
      { productPartId: partId, ProductPartId: partId }
    );
    results[`models_part${partId}`] = r5;

    await new Promise(r => setTimeout(r, 200));
  }

  // Try with combination IDs too
  for (const combId of combinationIds) {
    const r = await fetchPostRoute(
      { key: `productParts_combo${combId}`, path: "/Order/GetProductParts" },
      { combinationId: combId, CombinationId: combId, ItemCombinationId: combId }
    );
    results[`productParts_combo${combId}`] = r;
    await new Promise(r => setTimeout(r, 150));
  }

  // Try query-string variants for GET routes
  console.log(`%c[GoCreate Extractor] Trying query-string variants...`, "color: #00aaff; font-weight: bold;");

  for (const partId of [1, 2, 3]) {
    for (const [key, path] of [
      ["designOptionsQS", "/Order/GetDesignOptions"],
      ["fitToolsQS", "/Order/GetFitTools"],
      ["makesQS", "/Order/GetMakes"],
      ["modelsQS", "/Order/GetModels"],
    ]) {
      const r = await fetchRoute({ key: `${key}_part${partId}`, path: `${path}?productPartId=${partId}&ProductPartId=${partId}` });
      results[`${key}_part${partId}`] = r;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Summary
  const jsonRoutes = Object.entries(results).filter(([k, v]) => v.dataType === "json" || (typeof v.data === "object" && v.data !== null && typeof v.data !== "string"));
  const htmlRoutes = Object.entries(results).filter(([k, v]) => v.dataType === "html" || (typeof v.data === "string" && v.data?.includes("<")));
  const errorRoutes = Object.entries(results).filter(([k, v]) => v.status === 0 || v.error);

  console.log(`%c
============================================
EXTRACTION COMPLETE
============================================
Total routes probed: ${Object.keys(results).length}
JSON responses: ${jsonRoutes.length}
HTML responses: ${htmlRoutes.length}
Errors: ${errorRoutes.length}
============================================`, "color: #00ff00; font-weight: bold; font-size: 14px;");

  if (jsonRoutes.length > 0) {
    console.log("%cJSON routes found:", "color: #00ff00; font-weight: bold;");
    jsonRoutes.forEach(([k, v]) => console.log(`  ${k}: ${v.dataLength} chars`));
  }

  // For HTML routes, extract any embedded JSON or script data
  const extractedFromHtml = {};
  htmlRoutes.forEach(([key, val]) => {
    if (typeof val.data !== "string") return;
    const html = val.data;

    // Look for JSON in script tags
    const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    const jsonBlobs = [];
    scriptMatches.forEach(s => {
      const inner = s.replace(/<\/?script[^>]*>/gi, "").trim();
      if (inner.length > 50) jsonBlobs.push(inner);
    });

    // Look for data attributes
    const dataAttrs = html.match(/data-[a-z-]+="[^"]*"/gi) || [];

    // Look for hidden inputs with JSON values
    const hiddenInputs = html.match(/<input[^>]*type="hidden"[^>]*>/gi) || [];

    // Look for var = {...} or var = [...] patterns
    const varAssignments = html.match(/var\s+\w+\s*=\s*[\[{][\s\S]*?[}\]];/g) || [];

    if (jsonBlobs.length > 0 || dataAttrs.length > 0 || hiddenInputs.length > 0 || varAssignments.length > 0) {
      extractedFromHtml[key] = {
        scriptBlocks: jsonBlobs.length,
        dataAttributes: dataAttrs.slice(0, 50),
        hiddenInputs: hiddenInputs.slice(0, 50),
        varAssignments: varAssignments.slice(0, 20),
        scriptContents: jsonBlobs.slice(0, 10),
      };
    }
  });

  results._extractedFromHtml = extractedFromHtml;
  results._summary = {
    totalRoutes: Object.keys(results).length,
    jsonRoutes: jsonRoutes.map(([k]) => k),
    htmlRoutes: htmlRoutes.map(([k]) => k),
    errors: errors,
    extractedAt: new Date().toISOString(),
  };

  // Download as JSON file
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gocreate-config-extract-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`%cJSON file downloaded! Drop it into the project's data/ folder and let me know.`, "color: #ffff00; font-weight: bold; font-size: 14px;");

  return results;
})();
