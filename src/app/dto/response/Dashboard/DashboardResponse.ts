export interface DashboardOverviewResponse {
  total_on_hand_quantity: number;
  total_reserved_quantity: number;
  total_available_quantity: number;
  low_stock_sku_count: number;
  expiring_batch_count: number;
  active_warehouse_count: number;
  near_capacity_warehouse_count: number;
  pending_inbound_receipts: number;
  pending_outbound_shipments: number;
  open_purchase_orders: number;
  open_sales_orders: number;
  running_jobs: number;
  failed_jobs_today: number;
}

export interface DashboardAlertResponse {
  code: string;
  severity: string;
  title: string;
  description: string;
  value: number;
}

export interface DashboardTrendPointResponse {
  label: string;
  inbound_count: number;
  outbound_count: number;
}

export interface DashboardWarehouseCapacityResponse {
  warehouse_id: string;
  warehouse_name: string;
  occupied_locations: number;
  total_locations: number;
  utilization_percent: number;
  alert_level: string;
}

export interface DashboardActivityResponse {
  movement_id: string;
  movement_type: string;
  warehouse_name: string;
  location_name: string;
  product_sku: string;
  product_name: string;
  reference_number: string | null;
  quantity_change: number;
  movement_date: string;
}

export interface DashboardJobResponse {
  id: string;
  job_code: string;
  job_type: string;
  business_type: string;
  status: string;
  current_step: string | null;
  progress_percent: number;
  processed_rows: number;
  total_rows: number;
  result_file_name: string | null;
  error_code: string | null;
  created_at: string;
  finished_at: string | null;
  cancellable: boolean;
  retryable: boolean;
}

export interface DashboardResponse {
  overview: DashboardOverviewResponse;
  alerts: DashboardAlertResponse[];
  trend: DashboardTrendPointResponse[];
  warehouse_capacities: DashboardWarehouseCapacityResponse[];
  recent_activities: DashboardActivityResponse[];
  recent_jobs: DashboardJobResponse[];
  generated_at: string;
}
