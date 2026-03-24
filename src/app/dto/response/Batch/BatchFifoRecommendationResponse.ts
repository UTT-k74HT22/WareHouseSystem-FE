export interface BatchFifoRecommendationResponse {
  batch_id?: string;
  batchId?: string;
  batch_number?: string;
  batchNumber?: string;
  manufacturing_date: string;
  expiry_date: string;
  available_quantity?: number;
  inventory_snapshot?: {
    total_available_quantity?: number;
    warehouses?: Array<{
      warehouse_id?: string;
      warehouse_name?: string;
      available_quantity?: number;
      locations?: Array<{
        location_id?: string;
        location_name?: string;
        location_code?: string;
        available_quantity?: number;
      }>;
    }>;
  };
}
