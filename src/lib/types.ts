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
