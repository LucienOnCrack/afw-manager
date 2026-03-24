const API_BASE = "https://api.gocreate.nu";

function getCredentials() {
  const UserName = process.env.GOCREATE_USERNAME;
  const Password = process.env.GOCREATE_PASSWORD;
  const AuthenticationToken = process.env.GOCREATE_AUTH_TOKEN;

  if (!UserName || !Password || !AuthenticationToken) {
    throw new Error(
      "Missing GoCreate API credentials. Set GOCREATE_USERNAME, GOCREATE_PASSWORD, and GOCREATE_AUTH_TOKEN in .env.local"
    );
  }

  return { UserName, Password, AuthenticationToken };
}

async function apiPost<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.ErrorMessage || body.errorMessage || JSON.stringify(body);
    } catch {
      try { detail = await res.text(); } catch { /* keep statusText */ }
    }
    throw new Error(`GoCreate API error ${res.status}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

export interface FabricStockInfo {
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
  RequestedId: number;
  RequestedCode: string | null;
  RequestedName: string | null;
  MessageCode: string | null;
  Message: string | null;
  UsedFor: string | null;
  Composition: string | null;
  DurabilityIndicator: string | null;
  FabricOnOrder: number;
  FabricReadyDate: string | null;
  IsCustomerOwn: boolean;
}

interface FabricPostResponse {
  IsValidResult: boolean;
  ErrorCode: string | null;
  ErrorMessage: string | null;
  Id: number;
  FabricStockResult: FabricStockInfo[] | null;
}

const CODE_PREFIXES = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];

async function searchFabricsByPrefix(
  prefix: string,
  status?: number
): Promise<FabricStockInfo[]> {
  const creds = getCredentials();
  const allResults: FabricStockInfo[] = [];
  let page = 1;
  const pageSize = 500;

  while (true) {
    const input: Record<string, unknown> = {
      ID: 0,
      Code: prefix,
      SearchStartWith: true,
    };
    if (status !== undefined) input.Status = status;

    const response = await apiPost<FabricPostResponse>("/Fabric/Post", {
      ...creds,
      PageNo: page,
      PageSize: pageSize,
      FabricInputs: [input],
    });

    if (!response.IsValidResult) {
      throw new Error(
        `GoCreate Fabric API error: ${response.ErrorCode} - ${response.ErrorMessage}`
      );
    }

    const batch = (response.FabricStockResult ?? []).filter(
      (f) => f.MessageCode !== "NOT_FOUND"
    );

    allResults.push(...batch);

    if (batch.length < pageSize) break;
    page++;
  }

  return allResults;
}

export async function fetchAllFabrics(
  statusFilter?: number
): Promise<FabricStockInfo[]> {
  const allFabrics: FabricStockInfo[] = [];
  const seenIds = new Set<number>();

  const results = await Promise.all(
    CODE_PREFIXES.map((prefix) => searchFabricsByPrefix(prefix, statusFilter))
  );

  for (const batch of results) {
    for (const fabric of batch) {
      if (!seenIds.has(fabric.Id)) {
        seenIds.add(fabric.Id);
        allFabrics.push(fabric);
      }
    }
  }

  return allFabrics;
}

// --- Customer functions ---

export interface CustomerSearchResponse {
  IsValidResult: boolean;
  ErrorCode: string;
  ErrorMessage: string;
  Id: number;
  CustomerInfo: import("@/lib/types").CustomerInfo[] | null;
}

export async function searchCustomers(params: {
  FirstName?: string;
  LastName?: string;
  Email?: string;
  MobileNumber?: string;
  PhoneNumber?: string;
  PageNo?: number;
  PageSize?: number;
}): Promise<import("@/lib/types").CustomerInfo[]> {
  const creds = getCredentials();
  const response = await apiPostWithRetry<CustomerSearchResponse>("/Customer/Search", {
    ...creds,
    ...params,
    PageNo: params.PageNo ?? 1,
    PageSize: params.PageSize ?? 50,
  });
  if (!response.IsValidResult) {
    if (response.ErrorCode === "NOT_FOUND") {
      return [];
    }
    throw new Error(`Customer search error: ${response.ErrorMessage}`);
  }
  return response.CustomerInfo ?? [];
}

interface CustomerAddResponse {
  IsValidResult: boolean;
  ErrorCode: string[] | null;
  ErrorMessage: string[] | null;
  FirstName: string | null;
  LastName: string | null;
  CustomerID: number;
}

export async function addCustomer(
  params: import("@/lib/types").CustomerAddParams
): Promise<{ customerId: number; firstName: string; lastName: string }> {
  const creds = getCredentials();
  const response = await apiPostWithRetry<CustomerAddResponse>("/Customer/Add", {
    ...creds,
    ...params,
  });
  if (!response.IsValidResult) {
    const msgs = response.ErrorMessage?.join(", ") ?? "Unknown error";
    throw new Error(`Failed to add customer: ${msgs}`);
  }
  return {
    customerId: response.CustomerID,
    firstName: response.FirstName ?? params.FirstName,
    lastName: response.LastName ?? params.LastName,
  };
}

// --- Lining functions ---

interface LiningPostResponse {
  IsValidResult: boolean;
  ErrorCode: string | null;
  ErrorMessage: string | null;
  Id: number;
  LiningStockResult: import("@/lib/types").LiningStockInfo[] | null;
}

export async function searchLinings(
  code: string,
  pageNo = 1,
  pageSize = 50
): Promise<import("@/lib/types").LiningStockInfo[]> {
  const creds = getCredentials();
  const response = await apiPostWithRetry<LiningPostResponse>("/Lining/Post", {
    ...creds,
    PageNo: pageNo,
    PageSize: pageSize,
    LiningInputs: [{ ID: 0, Code: code, SearchStartWith: true }],
  });
  if (!response.IsValidResult) {
    throw new Error(`Lining search error: ${response.ErrorMessage}`);
  }
  const raw = response.LiningStockResult ?? [];
  const filtered = raw.filter((l) => l.Code !== null);
  console.log(`[Lining Search] code="${code}" → ${raw.length} raw, ${filtered.length} after filter`);
  if (raw.length > 0 && filtered.length === 0) {
    console.log(`[Lining Search] First raw entry:`, JSON.stringify(raw[0]));
  }
  return filtered;
}

// --- Fabric search (for order creation) ---

export async function searchFabrics(
  code: string,
  pageNo = 1,
  pageSize = 50
): Promise<FabricStockInfo[]> {
  const creds = getCredentials();
  const response = await apiPost<FabricPostResponse>("/Fabric/Post", {
    ...creds,
    PageNo: pageNo,
    PageSize: pageSize,
    FabricInputs: [{ ID: 0, Code: code, SearchStartWith: true }],
  });
  if (!response.IsValidResult) {
    throw new Error(`Fabric search error: ${response.ErrorMessage}`);
  }
  return (response.FabricStockResult ?? []).filter(
    (f) => f.MessageCode !== "NOT_FOUND"
  );
}

// --- Order creation ---

interface CreateOrderResponse {
  IsValidResult: boolean;
  ErrorCode: string | null;
  ErrorMessage: string | null;
  Id: number;
}

export async function createOrder(
  orderData: import("@/lib/types").OrderCreateData
): Promise<{ success: boolean; id: number; errorMessage?: string }> {
  const creds = getCredentials();
  const body = { ...creds, OrderData: orderData };

  console.log(`[GoCreate] /Order/CreateOrder payload: ${JSON.stringify(body, null, 2)}`);

  const res = await fetch(`${API_BASE}/Order/CreateOrder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let response: CreateOrderResponse;
  try {
    response = await res.json();
  } catch {
    throw new Error(`GoCreate API error ${res.status}: ${res.statusText} (non-JSON response)`);
  }

  console.log(`[GoCreate] /Order/CreateOrder response (${res.status}): ${JSON.stringify(response)}`);

  if (!res.ok || !response.IsValidResult) {
    return {
      success: false,
      id: response.Id ?? 0,
      errorMessage: response.ErrorMessage ?? `HTTP ${res.status}: ${res.statusText}`,
    };
  }
  return { success: true, id: response.Id };
}

// --- Order status update ---

interface UpdateStatusResponse {
  IsValidResult: boolean;
  ErrorCode: string | null;
  ErrorMessage: string | null;
  Id: number;
  Order: {
    OrderNumber: string | null;
    IsUpdated: boolean;
    MessageCode: string | null;
    Message: string | null;
  } | null;
}

export async function updateOrderStatus(
  orderNumber: string,
  status: number,
  remarks?: string
): Promise<{ success: boolean; message?: string }> {
  const creds = getCredentials();
  const response = await apiPostWithRetry<UpdateStatusResponse>("/Order/UpdateStatus", {
    ...creds,
    OrderNumber: orderNumber,
    Status: status,
    Remarks: remarks ?? "",
  });
  if (!response.IsValidResult) {
    return {
      success: false,
      message: response.ErrorMessage ?? "Status update failed",
    };
  }
  if (!response.Order?.IsUpdated) {
    return {
      success: false,
      message: response.Order?.Message ?? "Status update was not applied",
    };
  }
  return { success: true };
}

// --- Fetch orders by customer ID ---

interface ByCustomerIdResponse {
  IsValidResult: boolean;
  ErrorCode: string | null;
  ErrorMessage: string | null;
  Id: number;
  Orders: GoCreateOrder[] | null;
}

export async function fetchOrdersByCustomerId(
  customerId: number,
  pageNo = 1,
  pageSize = 20
): Promise<GoCreateOrder[]> {
  const creds = getCredentials();
  const response = await apiPostWithRetry<ByCustomerIdResponse>("/Order/ByCustomerId", {
    ...creds,
    CustomerID: customerId,
    PageNo: pageNo,
    PageSize: pageSize,
  });
  if (!response.IsValidResult) {
    if (response.ErrorCode === "NOT_FOUND") return [];
    throw new Error(`Customer orders error: ${response.ErrorMessage}`);
  }
  return response.Orders ?? [];
}

// --- Fetch order by number with detailed data ---

export interface OrderDetailItemInfo {
  ProductPartId: number;
  ProductPartName: string;
  StyleName: string;
  FitProfileName: string;
  FitName: string;
  MakeName: string;
  TryOn: string;
}

export interface OrderDetailDesignOption {
  Name: string;
  Value: string | null;
  OptionId: number;
  OptionValueId: number;
  IsForTrim: boolean;
  TrimMasterId: number;
  OptionValueType: number;
  OptionCategoryId: number;
}

export interface OrderDetailCategory {
  CategoryId: number;
  CategoryName: string;
  OptionDetails: OrderDetailDesignOption[];
}

export interface OrderDetailDesignPart {
  ProductPartId: number;
  ProductPartName: string;
  OptionCategories: OrderDetailCategory[];
}

export interface OrderDetailFitTool {
  Name: string;
  Value: string;
}

export interface OrderDetailFitPart {
  ProductPartId: number;
  ProductPartName: string;
  FitToolDetails: OrderDetailFitTool[];
}

export interface OrderDetailBrandingOption {
  LabelId: number;
  PositionName: string;
  LabelName: string;
  PositionId: number;
}

export interface OrderDetailBrandingPart {
  ProductPartId: number;
  ProductPartName: string;
  BrandingOptionDetails: OrderDetailBrandingOption[];
}

interface ByOrderNumberResponse {
  IsValidResult: boolean;
  ErrorCode: string | null;
  ErrorMessage: string | null;
  Id: number;
  OrderInfo: GoCreateOrder | null;
  FitTools: OrderDetailFitPart[] | null;
  Options: OrderDetailDesignPart[] | null;
  ItemDetails: OrderDetailItemInfo[] | null;
  BrandingOptions: OrderDetailBrandingPart[] | null;
}

export async function fetchOrderByNumber(
  orderNumber: string,
  opts: {
    fitTools?: boolean;
    designOptions?: boolean;
    itemDetails?: boolean;
    brandingOptions?: boolean;
  } = {}
): Promise<ByOrderNumberResponse> {
  const creds = getCredentials();
  const response = await apiPostWithRetry<ByOrderNumberResponse>("/Order/ByOrderNumber", {
    ...creds,
    OrderNumber: orderNumber,
    OtherDetails: {
      FetchFitTools: opts.fitTools ?? true,
      FetchDesignOptions: opts.designOptions ?? true,
      FetchItemDetails: opts.itemDetails ?? true,
      FetchBrandingOptions: opts.brandingOptions ?? true,
    },
  });
  if (!response.IsValidResult) {
    if (response.ErrorCode === "NOT_FOUND") {
      return response;
    }
    throw new Error(`Order fetch error: ${response.ErrorMessage}`);
  }
  return response;
}

// --- Order types (mirrors GoCreate /Order/ByOrderdate response) ---

export interface GoCreateOrder {
  OrderNumber: string | null;
  ShopOrderNumber: string | null;
  RetailPrice: string | null;
  PPrice: string | null;
  Downpayment: string | null;
  CustomerID: string | null;
  ProcessDate: string | null;
  OrderType: string | null;
  OrderTypeId: number;
  Tailor: string | null;
  Status: string | null;
  DaysInStatus: string | null;
  Fabric: string | null;
  Lining: string | null;
  DeliveryDate: string | null;
  UpdatedDeliveryDate: string | null;
  LatestDeliveryDate: string | null;
  ShopLabel: string | null;
  CreateBy: string | null;
  CreatedDate: string | null;
  CustomerName: string | null;
  Company: string | null;
  FabricPriceCategory: string | null;
  PPriceDiscountOrCost: string | null;
  TotalPPriceInclDiscountOrCost: string | null;
  RPriceDiscount: string | null;
  RPriceServiceCharge: string | null;
  TotalRPrice: string | null;
  OutStandingAmount: string | null;
  ExpectedDeliveryDate: string | null;
  UrgentOrder: string | null;
  ShopOrderComment: string | null;
  ShopName: string | null;
  Occasion: string | null;
}

interface ByOrderDateResponse {
  IsValidResult: boolean;
  ErrorCode: string | null;
  ErrorMessage: string | null;
  Id: number;
  Orders: GoCreateOrder[] | null;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000;

async function apiPostWithRetry<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  let backoff = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const t0 = Date.now();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const elapsed = Date.now() - t0;

    if (res.status === 429) {
      console.warn(`[GoCreate] 429 rate-limited on ${endpoint} (attempt ${attempt + 1}/${MAX_RETRIES + 1}, ${elapsed}ms) — backing off ${backoff}ms`);
      if (attempt === MAX_RETRIES) {
        throw new Error(`Rate limited after ${MAX_RETRIES} retries on ${endpoint}`);
      }
      await new Promise((r) => setTimeout(r, backoff));
      backoff = Math.min(backoff * 2, 30000);
      continue;
    }

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.ErrorMessage || body.errorMessage || JSON.stringify(body);
      } catch {
        try { detail = await res.text(); } catch { /* keep statusText */ }
      }
      console.error(`[GoCreate] ${res.status} error on ${endpoint} (${elapsed}ms): ${detail}`);
      throw new Error(`GoCreate API error ${res.status}: ${detail}`);
    }

    console.log(`[GoCreate] ${endpoint} → ${res.status} (${elapsed}ms)`);
    return res.json() as Promise<T>;
  }

  throw new Error("Unreachable");
}

function parsePrice(val: string | null): number | null {
  if (!val) return null;
  const n = parseFloat(val.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

export function toOrderDbRow(o: GoCreateOrder) {
  return {
    order_number: o.OrderNumber,
    shop_order_number: o.ShopOrderNumber,
    retail_price: parsePrice(o.RetailPrice),
    p_price: parsePrice(o.PPrice),
    downpayment: parsePrice(o.Downpayment),
    customer_id: o.CustomerID,
    process_date: o.ProcessDate,
    order_type: o.OrderType,
    order_type_id: o.OrderTypeId,
    tailor: o.Tailor,
    status: o.Status,
    days_in_status: o.DaysInStatus,
    fabric: o.Fabric,
    lining: o.Lining,
    delivery_date: o.DeliveryDate,
    updated_delivery_date: o.UpdatedDeliveryDate,
    latest_delivery_date: o.LatestDeliveryDate,
    shop_label: o.ShopLabel,
    created_by: o.CreateBy,
    created_date: o.CreatedDate?.split("T")[0] ?? null,
    customer_name: o.CustomerName,
    company: o.Company,
    fabric_price_category: o.FabricPriceCategory,
    p_price_discount: parsePrice(o.PPriceDiscountOrCost),
    total_p_price: parsePrice(o.TotalPPriceInclDiscountOrCost),
    r_price_discount: parsePrice(o.RPriceDiscount),
    r_price_service_charge: parsePrice(o.RPriceServiceCharge),
    total_r_price: parsePrice(o.TotalRPrice),
    outstanding_amount: parsePrice(o.OutStandingAmount),
    expected_delivery_date: o.ExpectedDeliveryDate,
    urgent_order: o.UrgentOrder,
    shop_name: o.ShopName,
    occasion: o.Occasion,
    synced_at: new Date().toISOString(),
  };
}

export async function fetchOrdersByDate(date: string): Promise<GoCreateOrder[]> {
  const creds = getCredentials();
  console.log(`[Orders] Fetching orders for ${date}...`);
  const response = await apiPostWithRetry<ByOrderDateResponse>("/Order/ByOrderdate", {
    ...creds,
    OrderDate: date,
  });

  if (!response.IsValidResult) {
    console.error(`[Orders] Invalid result for ${date}: ${response.ErrorCode} - ${response.ErrorMessage}`);
    throw new Error(
      `GoCreate Order API error: ${response.ErrorCode} - ${response.ErrorMessage}`
    );
  }

  const count = response.Orders?.length ?? 0;
  console.log(`[Orders] ${date} → ${count} orders`);
  return response.Orders ?? [];
}

export async function fetchOrdersForDateRange(
  startDate: string,
  endDate: string,
  concurrency = 5
): Promise<{ date: string; orders: GoCreateOrder[] }[]> {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  console.log(`[Orders] Fetching ${dates.length} days (${startDate} → ${endDate}), concurrency=${concurrency}`);
  const t0 = Date.now();
  const results: { date: string; orders: GoCreateOrder[] }[] = [];

  for (let i = 0; i < dates.length; i += concurrency) {
    const batch = dates.slice(i, i + concurrency);
    const batchNum = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(dates.length / concurrency);
    console.log(`[Orders] Batch ${batchNum}/${totalBatches}: [${batch.join(", ")}]`);

    const batchResults = await Promise.all(
      batch.map(async (d) => ({
        date: d,
        orders: await fetchOrdersByDate(d),
      }))
    );
    results.push(...batchResults);
  }

  const totalOrders = results.reduce((s, r) => s + r.orders.length, 0);
  console.log(`[Orders] Done — ${totalOrders} orders across ${dates.length} days in ${Date.now() - t0}ms`);
  return results;
}
