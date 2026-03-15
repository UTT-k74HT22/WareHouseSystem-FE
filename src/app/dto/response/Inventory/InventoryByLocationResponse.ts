export interface LocationInventoryItemResponse {
  product_id: string;
  product_sku: string | null;
  product_name: string | null;
  batch_id: string | null;
  batch_number: string | null;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

export interface InventoryByLocationResponse {
  location_id: string | null;
  location_code: string | null;
  location_name: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  items: LocationInventoryItemResponse[];
}
