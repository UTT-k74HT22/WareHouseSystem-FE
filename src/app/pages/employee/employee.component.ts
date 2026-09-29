import { Component, OnInit } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { EmployeeResponse } from '../../dto/response/Employee/EmployeeResponse';
import { EmployeeService } from '../../service/EmployeeService/employee.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';
import { RoleService } from '../../service/RoleService/role.service';
import { UserRoleService } from '../../service/UserRoleService/user-role.service';
import { AssignRolesRequest } from '../../dto/request/Role/RoleRequest';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { RoleResponse } from '../../dto/response/Role/RoleResponse';
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
  readonly createPermissions = ['PERM_EMPLOYEE_CREATE'];
  readonly updatePermissions = ['PERM_EMPLOYEE_UPDATE'];
  readonly deletePermissions = ['PERM_EMPLOYEE_DELETE'];

  employees: EmployeeResponse[] = [];
  warehouses: WareHouseResponse[] = [];
  availableRoles: RoleResponse[] = [];
  rolesLoading = false;
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
  editStatus: EmployeeStatus = EmployeeStatus.ACTIVE;
  editRoles: string[] = [];
  initialEditRoles: string[] = [];
  editRolesLoading = false;

  // Enums for templates
  EmployeeStatus = EmployeeStatus;
  RoleType = RoleType;

  constructor(
    private employeeService: EmployeeService,
    private warehouseService: WarehouseService,
    private roleService: RoleService,
    private userRoleService: UserRoleService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadWarehouses();
    this.loadRoles();
    this.loadStats();
  }

  private initCreateForm(): CreateEmployeeRequest {
    return {
      username: '',
      password: '',
      roles: [],
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
    this.loadStats();
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

  private loadRoles(): void {
    this.rolesLoading = true;
    this.roleService.getAll(0, 200).pipe(
      map((response) => response.success ? response.data.content : []),
      catchError(() => of([] as RoleResponse[]))
    ).subscribe((roles) => {
      this.rolesLoading = false;
      this.availableRoles = roles;
      this.applyDefaultRole();
    });
  }

  private applyDefaultRole(): void {
    if (this.createForm.roles.length > 0) {
      const options = new Set(this.getRoleOptions());
      this.createForm.roles = this.createForm.roles.filter((role) => options.has(role));
      if (this.createForm.roles.length > 0) {
        return;
      }
    }
    const options = this.getRoleOptions();
    if (options.length === 0) {
      return;
    }
    const defaultRole = this.availableRoles.find((role) => role.is_default)?.name
      || (options.includes(RoleType.USER) ? RoleType.USER : options[0]);
    this.createForm.roles = [defaultRole];
  }

  toggleRoleSelection(roleName: string): void {
    const idx = this.createForm.roles.indexOf(roleName);
    if (idx >= 0) {
      this.createForm.roles.splice(idx, 1);
      return;
    }
    this.createForm.roles.push(roleName);
  }

  isRoleSelected(roleName: string): boolean {
    return this.createForm.roles.includes(roleName);
  }

  toggleEditRoleSelection(roleName: string): void {
    const idx = this.editRoles.indexOf(roleName);
    if (idx >= 0) {
      if (this.editRoles.length === 1) {
        this.toastr.warning('Cập nhật nhân viên', 'Mỗi tài khoản phải có ít nhất một vai trò.');
        return;
      }
      this.editRoles.splice(idx, 1);
      return;
    }
    this.editRoles.push(roleName);
  }

  isEditRoleSelected(roleName: string): boolean {
    return this.editRoles.includes(roleName);
  }

  private loadEditRoles(accountId: string | undefined): void {
    this.editRoles = [];
    this.initialEditRoles = [];
    if (!accountId) {
      return;
    }
    this.editRolesLoading = true;
    this.userRoleService.getUserRoles(accountId, 0, 200).pipe(
      map((response) => response.success ? response.data.content : []),
      catchError(() => of([] as RoleResponse[]))
    ).subscribe((roles) => {
      this.editRolesLoading = false;
      const names = roles.map((role) => role.name).filter((name) => !!name);
      this.editRoles = [...names];
      this.initialEditRoles = [...names];
    });
  }

  private persistEditRolesIfChanged(onDone: () => void): void {
    const initial = new Set(this.initialEditRoles);
    const current = new Set(this.editRoles);
    const removed = this.initialEditRoles.filter((role) => !current.has(role));
    const added = this.editRoles.some((role) => !initial.has(role));
    if (removed.length === 0 && !added) {
      onDone();
      return;
    }
    const accountId = this.employeeToEdit?.account_id;
    if (!accountId) {
      onDone();
      return;
    }
    const roleIds = this.availableRoles
      .filter((role) => current.has(role.name))
      .map((role) => role.id);
    if (roleIds.length !== this.editRoles.length) {
      this.loading = false;
      this.toastr.error('Cập nhật nhân viên', 'Không tải được danh sách vai trò nên không thể lưu thay đổi vai trò.');
      return;
    }
    const request: AssignRolesRequest = { role_ids: roleIds };
    this.userRoleService.assignRolesToUser(accountId, request).subscribe({
      next: () => onDone(),
      error: (error) => {
        console.error('Error updating user roles:', error);
        this.loading = false;
        this.toastr.error('Cập nhật nhân viên', error?.error?.message || 'Cập nhật vai trò thất bại.');
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

  // Statistics (global counts from /employees/stats)
  statsActive = 0;
  statsOnLeave = 0;
  statsTerminated = 0;

  private loadStats(): void {
    this.employeeService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.statsActive = response.data['active'] ?? 0;
          this.statsOnLeave = response.data['on_leave'] ?? 0;
          this.statsTerminated = response.data['terminated'] ?? 0;
        }
      },
      error: () => { /* giữ số cũ khi lỗi */ }
    });
  }

  getActiveCount(): number {
    return this.statsActive;
  }

  getOnLeaveCount(): number {
    return this.statsOnLeave;
  }

  getTerminatedCount(): number {
    return this.statsTerminated;
  }

  // Label helpers
  getStatusLabel(status: EmployeeStatus | string | undefined): string {
    if (!status) return 'Không xác định';
    return EMPLOYEE_STATUS_LABELS[status as EmployeeStatus] ?? 'Không xác định';
  }

  getRoleLabel(role: RoleType | string | undefined): string {
    if (!role) return 'Không xác định';
    const dynamicRole = this.availableRoles.find((entry) => entry.name === role);
    if (dynamicRole) {
      return dynamicRole.name;
    }
    return ROLE_TYPE_LABELS[role as RoleType] ?? String(role);
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
    this.applyDefaultRole();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = this.initCreateForm();
  }

  submitCreate(): void {
    if (!this.validateCreateForm()) return;

    this.loading = true;
    const payload = {
      ...this.createForm,
      username: this.createForm.username.trim(),
      first_name: this.createForm.first_name.trim(),
      last_name: this.createForm.last_name.trim(),
      email: this.createForm.email.trim()
    };
    this.employeeService.create(payload).subscribe({
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
    this.editStatus = employee.status;
    this.showEditModal = true;
    this.loadEditRoles(employee.account_id);
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.employeeToEdit = null;
    this.editForm = this.initEditForm();
    this.editStatus = EmployeeStatus.ACTIVE;
    this.editRoles = [];
    this.initialEditRoles = [];
    this.editRolesLoading = false;
  }

  submitEdit(): void {
    if (!this.employeeToEdit) return;
    if (!this.validateEditForm()) return;

    const payload = {
      ...this.editForm,
      department: this.editForm.department?.trim() || undefined,
      position: this.editForm.position?.trim() || undefined
    };
    this.loading = true;
    this.employeeService.update(this.employeeToEdit.id, payload).subscribe({
      next: (response) => {
        if (!response.success) {
          this.toastr.error('Lỗi', response.message || 'Có lỗi khi cập nhật nhân viên');
          this.loading = false;
          return;
        }
        const edited = this.employeeToEdit!;
        if (this.editStatus && this.editStatus !== edited.status) {
          this.employeeService.changeStatus(edited.id, { status: this.editStatus }).subscribe({
            next: (statusRes) => {
              if (statusRes.success) {
                this.persistEditRolesIfChanged(() => {
                  this.toastr.success('Thành công', 'Cập nhật nhân viên thành công!');
                  this.closeEditModal();
                  this.loadEmployees();
                });
              } else {
                this.toastr.error('Lỗi', statusRes.message || 'Có lỗi khi đổi trạng thái.');
                this.loading = false;
              }
            },
            error: (error) => {
              this.toastr.error('Lỗi', error.error?.message || 'Có lỗi khi đổi trạng thái.');
              this.loading = false;
            }
          });
          return;
        }
        this.persistEditRolesIfChanged(() => {
          this.toastr.success('Thành công', 'Cập nhật nhân viên thành công!');
          this.closeEditModal();
          this.loadEmployees();
        });
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
    if (this.createForm.username.trim().length > 50
      || this.createForm.first_name.trim().length > 50
      || this.createForm.last_name.trim().length > 50) {
      this.toastr.warning('Quá dài', 'Tên đăng nhập, họ và tên không được vượt quá 50 ký tự');
      return false;
    }
    if (this.createForm.email.trim().length > 100) {
      this.toastr.warning('Quá dài', 'Email không được vượt quá 100 ký tự');
      return false;
    }
    if ((this.createForm.department?.length || 0) > 100 || (this.createForm.position?.length || 0) > 100) {
      this.toastr.warning('Quá dài', 'Phòng ban và chức vụ không được vượt quá 100 ký tự');
      return false;
    }
    if (this.createForm.roles.length === 0) {
      this.toastr.warning('Thiếu thông tin', 'Vui lòng chọn ít nhất một vai trò');
      return false;
    }
    return true;
  }

  private validateEditForm(): boolean {
    if ((this.editForm.department?.length || 0) > 100 || (this.editForm.position?.length || 0) > 100) {
      this.toastr.warning('Quá dài', 'Phòng ban và chức vụ không được vượt quá 100 ký tự');
      return false;
    }
    if ((this.editForm.salary_grade?.length || 0) > 20) {
      this.toastr.warning('Quá dài', 'Bậc lương không được vượt quá 20 ký tự');
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

  getRoleOptions(): string[] {
    if (this.availableRoles.length > 0) {
      return this.availableRoles.map((role) => role.name);
    }
    return Object.values(RoleType);
  }
}
