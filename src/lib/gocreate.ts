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
    throw new Error(`GoCreate API error ${res.status}: ${res.statusText}`);
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
