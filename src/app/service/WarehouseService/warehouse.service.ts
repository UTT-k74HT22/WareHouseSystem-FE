import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Warehouse, WarehouseStats } from '../../dto/Warehouse';

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {

  // Mock data cho warehouses
  private mockWarehouses: Warehouse[] = [
    {
      id: 1,
      code: 'WH-HN-001',
      name: 'Kho Hà Nội 1',
      address: '123 Đường Láng',
      city: 'Hà Nội',
      country: 'Việt Nam',
      capacity: 10000,
      currentOccupancy: 7500,
      status: 'ACTIVE',
      manager: 'Nguyễn Văn A',
      phone: '0912345678',
      email: 'hanoi1@warehouse.vn',
      createdDate: new Date('2023-01-15'),
      lastUpdated: new Date('2026-01-25')
    },
    {
      id: 2,
      code: 'WH-HCM-001',
      name: 'Kho TP.HCM 1',
      address: '456 Nguyễn Thị Minh Khai',
      city: 'TP. Hồ Chí Minh',
      country: 'Việt Nam',
      capacity: 15000,
      currentOccupancy: 12000,
      status: 'ACTIVE',
      manager: 'Trần Thị B',
      phone: '0987654321',
      email: 'hcm1@warehouse.vn',
      createdDate: new Date('2023-02-20'),
      lastUpdated: new Date('2026-01-28')
    },
    {
      id: 3,
      code: 'WH-DN-001',
      name: 'Kho Đà Nẵng 1',
      address: '789 Nguyễn Văn Linh',
      city: 'Đà Nẵng',
      country: 'Việt Nam',
      capacity: 8000,
      currentOccupancy: 5000,
      status: 'ACTIVE',
      manager: 'Lê Văn C',
      phone: '0901234567',
      email: 'danang1@warehouse.vn',
      createdDate: new Date('2023-03-10'),
      lastUpdated: new Date('2026-01-20')
    },
    {
      id: 4,
      code: 'WH-HN-002',
      name: 'Kho Hà Nội 2',
      address: '321 Giải Phóng',
      city: 'Hà Nội',
      country: 'Việt Nam',
      capacity: 12000,
      currentOccupancy: 3000,
      status: 'ACTIVE',
      manager: 'Phạm Thị D',
      phone: '0909876543',
      email: 'hanoi2@warehouse.vn',
      createdDate: new Date('2023-06-01'),
      lastUpdated: new Date('2026-01-15')
    },
    {
      id: 5,
      code: 'WH-HP-001',
      name: 'Kho Hải Phòng 1',
      address: '555 Lạch Tray',
      city: 'Hải Phòng',
      country: 'Việt Nam',
      capacity: 9000,
      currentOccupancy: 6000,
      status: 'MAINTENANCE',
      manager: 'Hoàng Văn E',
      phone: '0913456789',
      email: 'haiphong1@warehouse.vn',
      createdDate: new Date('2023-08-15'),
      lastUpdated: new Date('2026-01-29')
    },
    {
      id: 6,
      code: 'WH-CT-001',
      name: 'Kho Cần Thơ 1',
      address: '999 Trần Hưng Đạo',
      city: 'Cần Thơ',
      country: 'Việt Nam',
      capacity: 7000,
      currentOccupancy: 4500,
      status: 'ACTIVE',
      manager: 'Võ Thị F',
      phone: '0908765432',
      email: 'cantho1@warehouse.vn',
      createdDate: new Date('2023-09-20'),
      lastUpdated: new Date('2026-01-22')
    },
    {
      id: 7,
      code: 'WH-HCM-002',
      name: 'Kho TP.HCM 2',
      address: '111 Điện Biên Phủ',
      city: 'TP. Hồ Chí Minh',
      country: 'Việt Nam',
      capacity: 20000,
      currentOccupancy: 18000,
      status: 'ACTIVE',
      manager: 'Đặng Văn G',
      phone: '0902345678',
      email: 'hcm2@warehouse.vn',
      createdDate: new Date('2024-01-10'),
      lastUpdated: new Date('2026-01-30')
    },
    {
      id: 8,
      code: 'WH-BN-001',
      name: 'Kho Bắc Ninh 1',
      address: '222 Lý Thái Tổ',
      city: 'Bắc Ninh',
      country: 'Việt Nam',
      capacity: 11000,
      currentOccupancy: 2000,
      status: 'INACTIVE',
      manager: 'Bùi Thị H',
      phone: '0911234567',
      email: 'bacninh1@warehouse.vn',
      createdDate: new Date('2024-03-15'),
      lastUpdated: new Date('2026-01-18')
    }
  ];

  constructor() { }

  // Lấy tất cả warehouses
  getAllWarehouses(): Observable<Warehouse[]> {
    return of(this.mockWarehouses).pipe(delay(500)); // Simulate API delay
  }

  // Lấy warehouse theo ID
  getWarehouseById(id: number): Observable<Warehouse | undefined> {
    const warehouse = this.mockWarehouses.find(w => w.id === id);
    return of(warehouse).pipe(delay(300));
  }

  // Lấy thống kê warehouse
  getWarehouseStats(): Observable<WarehouseStats> {
    const totalWarehouses = this.mockWarehouses.length;
    const activeWarehouses = this.mockWarehouses.filter(w => w.status === 'ACTIVE').length;
    const totalCapacity = this.mockWarehouses.reduce((sum, w) => sum + w.capacity, 0);
    const totalOccupancy = this.mockWarehouses.reduce((sum, w) => sum + w.currentOccupancy, 0);
    const utilizationRate = (totalOccupancy / totalCapacity) * 100;

    const stats: WarehouseStats = {
      totalWarehouses,
      activeWarehouses,
      totalCapacity,
      totalOccupancy,
      utilizationRate: Math.round(utilizationRate * 100) / 100
    };

    return of(stats).pipe(delay(400));
  }

  // Tìm kiếm warehouse
  searchWarehouses(searchTerm: string): Observable<Warehouse[]> {
    const filtered = this.mockWarehouses.filter(w =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return of(filtered).pipe(delay(300));
  }

  // Lọc warehouse theo status
  filterByStatus(status: string): Observable<Warehouse[]> {
    if (status === 'ALL') {
      return this.getAllWarehouses();
    }
    const filtered = this.mockWarehouses.filter(w => w.status === status);
    return of(filtered).pipe(delay(300));
  }
}
