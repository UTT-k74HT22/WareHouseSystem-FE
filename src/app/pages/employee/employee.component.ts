import { Component, OnInit } from '@angular/core';
import { EmployeeResponse } from '../../dto/response/Employee/EmployeeResponse';
import { EmployeeService } from '../../service/EmployeeService/employee.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { EmployeeStatus } from '../../helper/enums/EmployeeStatus';
import { RoleType } from '../../helper/enums/RoleType';
import { CreateEmployeeRequest } from '../../dto/request/Employee/CreateEmployeeRequest';
import { UpdateEmployeeRequest } from '../../dto/request/Employee/UpdateEmployeeRequest';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { EMPLOYEE_STATUS_LABELS, ROLE_TYPE_LABELS } from '../../helper/constraint/employee-labels';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent implements OnInit {

  employees: EmployeeResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  selectedEmployee: EmployeeResponse | null = null;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Filter properties
  searchTerm = '';
  selectedStatus: '' | EmployeeStatus = '';
  selectedWarehouse = '';

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  employeeToDelete: EmployeeResponse | null = null;
  employeeToEdit: EmployeeResponse | null = null;

  // Form models
  createForm: CreateEmployeeRequest = this.initCreateForm();
  editForm: UpdateEmployeeRequest = this.initEditForm();

  // Enums for templates
  EmployeeStatus = EmployeeStatus;
  RoleType = RoleType;

  constructor(
    private employeeService: EmployeeService,
    private warehouseService: WarehouseService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadWarehouses();
  }

  private initCreateForm(): CreateEmployeeRequest {
    return {
      username: '',
      password: '',
      role: RoleType.USER,
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      department: '',
      position: '',
      hire_date: ''
    };
  }

  private initEditForm(): UpdateEmployeeRequest {
    return {
      department: '',
      position: '',
      hire_date: '',
      termination_date: '',
      salary_grade: '',
      warehouse_id: ''
    };
  }

  loadEmployees(): void {
    this.loading = true;
    const keyword = this.searchTerm.trim() || undefined;
    const status = this.selectedStatus || undefined;
    const warehouseId = this.selectedWarehouse || undefined;

    this.employeeService.getAll(this.currentPage, this.pageSize, keyword, status, warehouseId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.employees = response.data.content;
          this.totalElements = response.data.total_elements;
          this.totalPages = response.data.total_pages;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
        this.toastr.error('Lỗi tải dữ liệu', error.error?.message || 'Có lỗi khi tải danh sách nhân viên');
        this.loading = false;
      }
    });
  }

  private loadWarehouses(): void {
    this.warehouseService.getList().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.warehouses = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching warehouses:', error);
      }
    });
  }

  // Search & filter
  onSearch(): void {
    this.currentPage = 0;
    this.loadEmployees();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadEmployees();
  }

  // Statistics
  getActiveCount(): number {
    return this.employees.filter(e => e.status === EmployeeStatus.ACTIVE).length;
  }

  getOnLeaveCount(): number {
    return this.employees.filter(e => e.status === EmployeeStatus.ON_LEAVE).length;
  }

  getTerminatedCount(): number {
    return this.employees.filter(e => e.status === EmployeeStatus.TERMINATED).length;
  }

  // Label helpers
  getStatusLabel(status: EmployeeStatus | string | undefined): string {
    if (!status) return 'Không xác định';
    return EMPLOYEE_STATUS_LABELS[status as EmployeeStatus] ?? 'Không xác định';
  }

  getRoleLabel(role: RoleType | string | undefined): string {
    if (!role) return 'Không xác định';
    return ROLE_TYPE_LABELS[role as RoleType] ?? 'Không xác định';
  }

  getFullName(emp: EmployeeResponse): string {
    return `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'N/A';
  }

  getWarehouseName(warehouseId: string | undefined): string {
    if (!warehouseId) return 'Chưa gán';
    const wh = this.warehouses.find(w => w.id === warehouseId);
    return wh ? wh.name : warehouseId;
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  }

  // CRUD - Create
  openCreateModal(): void {
    this.createForm = this.initCreateForm();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = this.initCreateForm();
  }

  submitCreate(): void {
    if (!this.validateCreateForm()) return;

    this.loading = true;
    this.employeeService.create(this.createForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Tạo nhân viên mới thành công!');
          this.closeCreateModal();
          this.loadEmployees();
        } else {
          this.toastr.error('Lỗi', response.message || 'Có lỗi khi tạo nhân viên');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error creating employee:', error);
        const msg = error.error?.message || 'Có lỗi khi tạo nhân viên';
        this.toastr.error('Lỗi', msg);
        this.loading = false;
      }
    });
  }

  // CRUD - Edit
  openEditModal(employee: EmployeeResponse): void {
    this.employeeToEdit = employee;
    this.editForm = {
      department: employee.department || '',
      position: employee.position || '',
      hire_date: employee.hire_date || '',
      termination_date: employee.termination_date || '',
      salary_grade: employee.salary_grade || '',
      warehouse_id: employee.warehouse_id || ''
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.employeeToEdit = null;
    this.editForm = this.initEditForm();
  }

  submitEdit(): void {
    if (!this.employeeToEdit) return;

    this.loading = true;
    this.employeeService.update(this.employeeToEdit.id, this.editForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Cập nhật nhân viên thành công!');
          this.closeEditModal();
          this.loadEmployees();
        } else {
          this.toastr.error('Lỗi', response.message || 'Có lỗi khi cập nhật nhân viên');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error updating employee:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi cập nhật nhân viên');
        this.loading = false;
      }
    });
  }

  // CRUD - Delete (soft delete)
  openDeleteConfirm(employee: EmployeeResponse): void {
    this.employeeToDelete = employee;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.employeeToDelete = null;
  }

  confirmDelete(): void {
    if (!this.employeeToDelete) return;

    this.loading = true;
    this.employeeService.delete(this.employeeToDelete.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Thành công', 'Cho nhân viên nghỉ việc thành công!');
          this.closeDeleteConfirm();
          this.loadEmployees();
        } else {
          this.toastr.error('Lỗi', response.message || 'Có lỗi khi xử lý');
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error deleting employee:', error);
        this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi xử lý');
        this.loading = false;
      }
    });
  }

  // Detail view
  viewDetails(employee: EmployeeResponse): void {
    this.selectedEmployee = employee;
  }

  closeDetails(): void {
    this.selectedEmployee = null;
  }

  // Validation
  private validateCreateForm(): boolean {
    if (!this.createForm.username.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập tên đăng nhập');
      return false;
    }
    if (!this.createForm.password.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập mật khẩu');
      return false;
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(this.createForm.password)) {
      this.toastr.warning('Mật khẩu không hợp lệ', 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      return false;
    }
    if (!this.createForm.first_name.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập họ');
      return false;
    }
    if (!this.createForm.last_name.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập tên');
      return false;
    }
    if (!this.createForm.email.trim()) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng nhập email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.createForm.email)) {
      this.toastr.warning('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email');
      return false;
    }
    if (this.createForm.phone_number && !/^\d{10,15}$/.test(this.createForm.phone_number)) {
      this.toastr.warning('SĐT không hợp lệ', 'Số điện thoại phải từ 10-15 chữ số');
      return false;
    }
    return true;
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEmployees();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadEmployees();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadEmployees();
    }
  }

  // Helper methods for enum options
  getStatusOptions(): EmployeeStatus[] {
    return Object.values(EmployeeStatus);
  }

  getRoleOptions(): RoleType[] {
    return Object.values(RoleType);
  }
}
