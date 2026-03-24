export interface Fabric {
  id: number;
  code: string | null;
  name: string | null;
  collection: string | null;
  bunch: string | null;
  supplier: string | null;
  composition: string | null;
  description: string | null;
  priceCategory: string | null;
  stock: number;
  status: string | null;
  statusId: number;
  imageUrl: string | null;
  usedFor: string | null;
  atelierName: string | null;
  season: string | null;
  cutLength: boolean;
  rPrice: number;
  soldOutSince: string | null;
  extraDays: number;
  fabricOnOrder: number;
  isCustomerOwn: boolean;
}

export interface FabricStats {
  uniqueTypes: number;
  uniquePriceCodes: number;
  uniqueSuppliers: number;
  inStockCount: number;
}

export interface GarmentPrice {
  section: string;
  construction: string | null;
  make_type: string | null;
  garment_type: string;
  price_eur: number;
}

export interface Surcharge {
  section: string;
  name: string;
  price_eur: number;
  invoice_code: string | null;
  remarks: string | null;
}

export interface FabricsApiResponse {
  fabrics: Fabric[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: FabricStats;
  priceMap: Record<string, GarmentPrice[]>;
  surcharges: Record<string, Surcharge[]>;
}

// --- Order Analytics types ---

export interface DailyOrderData {
  date: string;
  orderCount: number;
  revenue: number;
  pPrice: number;
}

export interface CustomerSpend {
  customerName: string;
  customerId: string;
  company: string;
  orderCount: number;
  totalRevenue: number;
  totalPPrice: number;
}

export interface FabricPopularity {
  fabric: string;
  orderCount: number;
  totalRevenue: number;
}

export interface CategoryBreakdown {
  name: string;
  count: number;
  revenue: number;
}

export interface ShopPerformance {
  shopName: string;
  orderCount: number;
  totalRevenue: number;
  totalPPrice: number;
  avgOrderValue: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  totalPPrice: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  ordersByDate: DailyOrderData[];
  topCustomers: CustomerSpend[];
  topFabrics: FabricPopularity[];
  ordersByType: CategoryBreakdown[];
  ordersByStatus: CategoryBreakdown[];
  shopPerformance: ShopPerformance[];
  dateRange: { startDate: string; endDate: string };
}

// --- Customer types ---

export interface CustomerInfo {
  Id: number;
  CustomerNumber: string;
  FirstName: string;
  LastName: string;
  Initials: string;
  Suffix: string;
  Address: string;
  PostalCode: string;
  City: string;
  CountryName: string;
  CountryCode: string;
  DateOfBirth: string;
  PhoneNumber: string;
  MobileNumber: string;
  Email: string;
  ReferredByCustomer: string;
  KeepInformed: boolean;
  CompanyName: string;
  CompanyAddress: string;
  CompanyPostalCode: string;
  CompanyCity: string;
  CustomerProject: string;
  CustomFields: { FieldName: string; FieldValue: string }[];
}

export interface CustomerAddParams {
  FirstName: string;
  LastName: string;
  Email?: string;
  MobileNumber?: string;
  PhoneNumber?: string;
  Address?: string;
  PostalCode?: string;
  City?: string;
  Country?: string;
  CompanyName?: string;
  CompanyAddress?: string;
  Remarks?: string;
  SSID?: string;
}

// --- Lining types ---

export interface LiningStockInfo {
  Id: number;
  Code: string | null;
  Name: string | null;
  Bunch: string | null;
  Collection: string | null;
  ImageUrl: string | null;
  Supplier: string | null;
  Season: string | null;
  Description: string | null;
  PPriceCategories: string | null;
  CutLengthLining: boolean;
  Stock: number;
  ExtraDays: number;
  RPrice: number;
  SoldOutSince: string | null;
  Status: string | null;
  StatusId: number;
  UsedFor: string | null;
  Composition: string | null;
}

// --- Order Creation types ---

export interface IdAndName {
  Id: number;
  Name: string;
}

export const ORDER_TYPES: IdAndName[] = [
  { Id: 1, Name: "2-piece suit" },
  { Id: 7, Name: "2-piece suit + extra trousers" },
  { Id: 5, Name: "3-piece suit" },
  { Id: 14, Name: "3-piece suit + extra trousers" },
  { Id: 2, Name: "Jacket" },
  { Id: 3, Name: "Trousers" },
  { Id: 4, Name: "Waistcoat" },
  { Id: 17, Name: "Jacket + Bermudas" },
  { Id: 8, Name: "Shirt" },
  { Id: 9, Name: "Overcoat" },
  { Id: 16, Name: "Bermudas" },
  { Id: 22, Name: "Chinos" },
  { Id: 28, Name: "Sneaker" },
  { Id: 29, Name: "Tie" },
  { Id: 31, Name: "Pocket square" },
  { Id: 32, Name: "Bow tie" },
  { Id: 54, Name: "Knit" },
  { Id: 59, Name: "Quilted vest" },
];

export interface DesignOptionValue {
  Name: string | null;
  Value: string | null;
  OptionId: number;
  OptionValueId: number | string;
  TrimMasterId: number;
  LiningId: number;
  IsForTrim: boolean;
}

export interface MonogramData {
  MonogramColourId: number;
  MonogramFontId: number;
  MonogramLengthId: number;
  MonogramPositionId: number;
  MonogramFirstLine: string;
  MonogramSecondLine: string;
}

export interface BrandingOptionData {
  LabelId: number;
  PositionId: number;
}

export interface FitToolEntry {
  Id: number;
  Name: string;
  Value: number;
}

export interface FitAndTryOnData {
  FitProfileId: number;
  FitId: number;
  TryonId: number;
  FitProfileName: string;
  FitToolData: FitToolEntry[];
}

export interface ProductDataEntry {
  ProductPartId: number;
  StyleOrderNumber: string;
  ModelId?: number;
  MakeId: number;
  CanvasId?: number;
  FitAndTryOnData: FitAndTryOnData;
  DesignOptions?: DesignOptionValue[];
  MonogramData?: MonogramData[];
  BrandingOptionData: BrandingOptionData[];
}

export interface OrderCreateData {
  CustomerId: number;
  Status: string;
  Quantity?: number;
  SalesPersonId?: number;
  TrimId?: number;
  LiningGroupId?: number;
  ExtraTrouserAddOn: boolean;
  Item: IdAndName;
  Fabric?: IdAndName;
  Lining?: IdAndName;
  ExtraLining?: IdAndName;
  ProductData?: ProductDataEntry[];
  ShopOrderNumber: string;
  ShowSize: boolean;
  Occasion: string;
  SkipWarnings: boolean;
}

export const STATUS_OPTIONS: { id: number; label: string }[] = [
  { id: 6, label: "Processed" },
  { id: 11, label: "In alteration" },
  { id: 12, label: "On hold" },
  { id: 14, label: "Delivered to customer" },
  { id: 16, label: "Received" },
  { id: 17, label: "Cancelled" },
  { id: 67, label: "Deposit paid" },
];
