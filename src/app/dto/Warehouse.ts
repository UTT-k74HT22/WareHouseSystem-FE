export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  currentOccupancy: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  manager: string;
  phone: string;
  email: string;
  createdDate: Date;
  lastUpdated: Date;
}

export interface WarehouseStats {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  totalOccupancy: number;
  utilizationRate: number;
}
