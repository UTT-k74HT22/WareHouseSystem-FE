import { Component, OnInit } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { PermissionService } from '../../service/PermissionService/permission.service';
import { RoleService } from '../../service/RoleService/role.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { PermissionResponse } from '../../dto/response/Permission/PermissionResponse';
import { RoleResponse } from '../../dto/response/Role/RoleResponse';
import { AccountResponse } from '../../dto/response/Account/AccountResponse';
import {
  ActionType,
  CreatePermissionRequest,
  UpdatePermissionRequest
} from '../../dto/request/Permission/PermissionRequest';
import {
  AssignPermissionsRequest,
  CreateRoleRequest,
  UpdateRoleRequest
} from '../../dto/request/Role/RoleRequest';

interface PermissionGroup {
  resource: string;
  permissions: PermissionResponse[];
}

interface ResourceOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-rbac',
  templateUrl: './rbac.component.html',
  styleUrls: ['./rbac.component.css']
})
export class RbacComponent implements OnInit {
  activeTab: 'permissions' | 'roles' = 'permissions';

  permissions: PermissionResponse[] = [];
  allPermissions: PermissionResponse[] = [];
  roles: RoleResponse[] = [];
  allRoles: RoleResponse[] = [];

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;

  searchKeyword = '';
  selectedResource = '';
  selectedAction: ActionType | '' = '';

  showCreatePermModal = false;
  showEditPermModal = false;
  showDeletePermConfirm = false;
  selectedPermission: PermissionResponse | null = null;
  permissionToDelete: PermissionResponse | null = null;

  showCreateRoleModal = false;
  showEditRoleModal = false;
  showDeleteRoleConfirm = false;
  selectedRole: RoleResponse | null = null;
  roleToDelete: RoleResponse | null = null;

  showAssignPermModal = false;
  allAvailablePermissions: PermissionResponse[] = [];
  permissionGroups: PermissionGroup[] = [];
  expandedPermissionGroups: Record<string, boolean> = {};
  selectedPermissionsForRole: string[] = [];
  initialPermissionsForRole: string[] = [];

  showViewUsersModal = false;
  usersOfRole: AccountResponse[] = [];
  roleUsersCurrentPage = 0;
  roleUsersTotalPages = 0;
  roleUsersTotalElements = 0;

  createPermForm: CreatePermissionRequest = this.initCreatePermForm();
  editPermForm: UpdatePermissionRequest = {};
  createRoleForm: CreateRoleRequest = this.initCreateRoleForm();
  editRoleForm: UpdateRoleRequest = {};

  ActionType = ActionType;
  actionOptions = Object.values(ActionType);
  resourceOptions: ResourceOption[] = [
    { value: 'PERMISSION', label: 'Permission' },
    { value: 'ROLE', label: 'Role' },
    { value: 'ROLE_PERMISSION', label: 'Role Permission' },
    { value: 'USER_ROLE', label: 'User Role' },
    { value: 'SYSTEM_DIAGNOSTIC', label: 'System Diagnostic' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'USER', label: 'User' },
    { value: 'EMPLOYEE', label: 'Employee' },
    { value: 'WAREHOUSE', label: 'Warehouse' },
    { value: 'LOCATION', label: 'Location' },
    { value: 'PRODUCT', label: 'Product' },
    { value: 'CATEGORY', label: 'Category' },
    { value: 'BUSINESS_PARTNER', label: 'Business Partner' },
    { value: 'UNIT_OF_MEASURE', label: 'Unit Of Measure' },
    { value: 'BATCH', label: 'Batch' },
    { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
    { value: 'SALES_ORDER', label: 'Sales Order' },
    { value: 'INBOUND_RECEIPT', label: 'Inbound Receipt' },
    { value: 'OUTBOUND_SHIPMENT', label: 'Outbound Shipment' },
    { value: 'INVENTORY', label: 'Inventory' },
    { value: 'STOCK_MOVEMENT', label: 'Stock Movement' },
    { value: 'STOCK_ADJUSTMENT', label: 'Stock Adjustment' },
    { value: 'STOCK_TRANSFER', label: 'Stock Transfer' },
    { value: 'STORAGE', label: 'Storage' }
  ];

  constructor(
    private permissionService: PermissionService,
    private roleService: RoleService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    if (this.activeTab === 'permissions') {
      this.loadPermissions();
      return;
    }

    this.loadRoles();
  }

  loadPermissions(): void {
    this.permissionService.getAll(
      0,
      200,
      this.selectedResource || undefined,
      this.selectedAction || undefined,
      this.searchKeyword || undefined
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.allPermissions = res.data.content;
          this.applyPermFilter();
        }
        this.loading = false;
      },
      error: () => {
        this.allPermissions = [];
        this.permissions = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
      }
    });
  }

  loadRoles(): void {
    this.roleService.getAll(0, 200, undefined, this.searchKeyword || undefined).subscribe({
      next: (res) => {
        if (res.success) {
          this.allRoles = res.data.content;
          this.applyRoleFilter();
        }
        this.loading = false;
      },
      error: () => {
        this.allRoles = [];
        this.roles = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadData();
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedResource = '';
    this.selectedAction = '';
    this.currentPage = 0;
    this.loadData();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;

    this.currentPage = page;

    if (this.activeTab === 'permissions') {
      this.applyPermFilter();
      return;
    }

    this.applyRoleFilter();
  }

  switchTab(tab: 'permissions' | 'roles'): void {
    this.activeTab = tab;
    this.currentPage = 0;
    this.searchKeyword = '';
    this.selectedResource = '';
    this.selectedAction = '';
    this.loadData();
  }

  openCreatePermModal(): void {
    this.createPermForm = this.initCreatePermForm();
    this.showCreatePermModal = true;
  }

  onCreatePermSubmit(): void {
    this.permissionService.create(this.createPermForm).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.toastr.success('Phân quyền', 'Tạo permission thành công!');
        this.showCreatePermModal = false;
        this.loadPermissions();
      }
    });
  }

  openEditPermModal(perm: PermissionResponse): void {
    this.setEditPermissionState(perm);

    this.permissionService.getById(perm.id).subscribe({
      next: (res) => {
        if (!res.success) {
          return;
        }

        this.setEditPermissionState(res.data);
      }
    });
  }

  onEditPermSubmit(): void {
    if (!this.selectedPermission) return;

    this.permissionService.update(this.selectedPermission.id, this.editPermForm).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.toastr.success('Phân quyền', 'Cập nhật permission thành công!');
        this.showEditPermModal = false;
        this.loadPermissions();
      }
    });
  }

  openDeletePermConfirm(perm: PermissionResponse): void {
    this.permissionToDelete = perm;
    this.showDeletePermConfirm = true;
  }

  onDeletePermConfirm(): void {
    if (!this.permissionToDelete) return;

    this.permissionService.delete(this.permissionToDelete.id).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.toastr.success('Phân quyền', 'Xóa permission thành công!');
        this.showDeletePermConfirm = false;
        this.loadPermissions();
      }
    });
  }

  openCreateRoleModal(): void {
    this.createRoleForm = this.initCreateRoleForm();
    this.showCreateRoleModal = true;
  }

  onCreateRoleSubmit(): void {
    this.roleService.create(this.createRoleForm).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.toastr.success('Phân quyền', 'Tạo role thành công!');
        this.showCreateRoleModal = false;
        this.loadRoles();
      }
    });
  }

  openEditRoleModal(role: RoleResponse): void {
    this.setEditRoleState(role);

    this.roleService.getById(role.id).subscribe({
      next: (res) => {
        if (!res.success) {
          return;
        }

        this.setEditRoleState(res.data);
      }
    });
  }

  onEditRoleSubmit(): void {
    if (!this.selectedRole) return;

    this.roleService.update(this.selectedRole.id, this.editRoleForm).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.toastr.success('Phân quyền', 'Cập nhật role thành công!');
        this.showEditRoleModal = false;
        this.loadRoles();
      }
    });
  }

  openDeleteRoleConfirm(role: RoleResponse): void {
    this.roleToDelete = role;
    this.showDeleteRoleConfirm = true;
  }

  onDeleteRoleConfirm(): void {
    if (!this.roleToDelete) return;

    this.roleService.delete(this.roleToDelete.id).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.toastr.success('Phân quyền', 'Xóa role thành công!');
        this.showDeleteRoleConfirm = false;
        this.loadRoles();
      }
    });
  }

  openAssignPermModal(role: RoleResponse): void {
    this.selectedRole = role;
    this.selectedPermissionsForRole = [];
    this.initialPermissionsForRole = [];

    forkJoin({
      allPermissions: this.permissionService.getAll(0, 200),
      assignedPermissions: this.roleService.getPermissions(role.id, 0, 200)
    }).subscribe({
      next: (res) => {
        if (!res.allPermissions.success) return;

        this.allAvailablePermissions = res.allPermissions.data.content;
        this.selectedPermissionsForRole = res.assignedPermissions.success
          ? res.assignedPermissions.data.content.map((permission) => permission.id)
          : [];
        this.initialPermissionsForRole = [...this.selectedPermissionsForRole];
        this.permissionGroups = this.buildPermissionGroups(this.allAvailablePermissions);
        this.initPermissionGroupExpansion();
        this.showAssignPermModal = true;
      },
      error: () => {
        this.allAvailablePermissions = [];
        this.permissionGroups = [];
        this.expandedPermissionGroups = {};
      }
    });
  }

  onAssignPermSubmit(): void {
    if (!this.selectedRole) return;

    const roleId = this.selectedRole.id;
    const initialPermissionSet = new Set(this.initialPermissionsForRole);
    const selectedPermissionSet = new Set(this.selectedPermissionsForRole);

    const permissionIdsToAdd = this.selectedPermissionsForRole.filter((permissionId) => !initialPermissionSet.has(permissionId));
    const permissionIdsToRemove = this.initialPermissionsForRole.filter((permissionId) => !selectedPermissionSet.has(permissionId));

    const operations: Observable<unknown>[] = permissionIdsToRemove.map((permissionId) =>
      this.roleService.removePermission(roleId, permissionId)
    );

    if (permissionIdsToAdd.length > 0) {
      const request: AssignPermissionsRequest = { permission_ids: permissionIdsToAdd };
      operations.push(this.roleService.assignPermissions(roleId, request));
    }

    if (operations.length === 0) {
      this.toastr.info('Phân quyền', 'Không có thay đổi permission nào.');
      this.showAssignPermModal = false;
      return;
    }

    forkJoin(operations).subscribe({
      next: () => {
        this.toastr.success('Phân quyền', 'Cập nhật permissions cho role thành công!');
        this.showAssignPermModal = false;
        this.loadRoles();
      }
    });
  }

  togglePermissionSelection(permId: string): void {
    const idx = this.selectedPermissionsForRole.indexOf(permId);
    if (idx >= 0) {
      this.selectedPermissionsForRole.splice(idx, 1);
      return;
    }

    this.selectedPermissionsForRole.push(permId);
  }

  isPermissionSelected(permId: string): boolean {
    return this.selectedPermissionsForRole.includes(permId);
  }

  togglePermissionGroup(resource: string): void {
    this.expandedPermissionGroups[resource] = !this.expandedPermissionGroups[resource];
  }

  isPermissionGroupExpanded(resource: string): boolean {
    return !!this.expandedPermissionGroups[resource];
  }

  isPermissionGroupSelected(group: PermissionGroup): boolean {
    return group.permissions.length > 0 && group.permissions.every((perm) => this.isPermissionSelected(perm.id));
  }

  isPermissionGroupPartial(group: PermissionGroup): boolean {
    const selectedCount = this.getSelectedPermissionsCount(group);
    return selectedCount > 0 && selectedCount < group.permissions.length;
  }

  getSelectedPermissionsCount(group: PermissionGroup): number {
    return group.permissions.filter((perm) => this.isPermissionSelected(perm.id)).length;
  }

  togglePermissionGroupSelection(group: PermissionGroup, checked: boolean): void {
    const selectedIds = new Set(this.selectedPermissionsForRole);

    group.permissions.forEach((perm) => {
      if (checked) {
        selectedIds.add(perm.id);
        return;
      }

      selectedIds.delete(perm.id);
    });

    this.selectedPermissionsForRole = Array.from(selectedIds);
  }

  formatPermissionGroupLabel(resource: string): string {
    return resource
      .split(/[_-]/)
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  getResourceLabel(resource: string): string {
    const matchingOption = this.resourceOptions.find((option) => option.value === resource);
    return matchingOption?.label ?? this.formatPermissionGroupLabel(resource);
  }

  openViewUsersModal(role: RoleResponse): void {
    this.selectedRole = role;
    this.roleUsersCurrentPage = 0;
    this.loadRoleUsers();
    this.showViewUsersModal = true;
  }

  loadRoleUsers(): void {
    if (!this.selectedRole) return;

    this.roleService.getUsers(this.selectedRole.id, this.roleUsersCurrentPage, 10).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.usersOfRole = res.data.content;
        this.roleUsersTotalElements = res.data.total_elements;
        this.roleUsersTotalPages = res.data.total_pages;
      },
      error: () => {
        this.usersOfRole = [];
      }
    });
  }

  onRoleUsersPageChange(page: number): void {
    if (page < 0 || page >= this.roleUsersTotalPages) return;

    this.roleUsersCurrentPage = page;
    this.loadRoleUsers();
  }

  closeAllModals(): void {
    this.showCreatePermModal = false;
    this.showEditPermModal = false;
    this.showDeletePermConfirm = false;
    this.showCreateRoleModal = false;
    this.showEditRoleModal = false;
    this.showDeleteRoleConfirm = false;
    this.showAssignPermModal = false;
    this.showViewUsersModal = false;

    this.permissionGroups = [];
    this.expandedPermissionGroups = {};
    this.initialPermissionsForRole = [];
    this.usersOfRole = [];

    this.selectedPermission = null;
    this.permissionToDelete = null;
    this.selectedRole = null;
    this.roleToDelete = null;
  }

  private applyPermFilter(): void {
    let filtered = [...this.allPermissions];
    const keyword = this.searchKeyword.trim().toLowerCase();

    if (keyword) {
      filtered = filtered.filter((permission) =>
        permission.name.toLowerCase().includes(keyword) ||
        permission.resource.toLowerCase().includes(keyword) ||
        permission.code.toLowerCase().includes(keyword)
      );
    }

    this.totalElements = filtered.length;
    this.totalPages = this.totalElements === 0 ? 0 : Math.ceil(this.totalElements / this.pageSize);

    const start = this.currentPage * this.pageSize;
    this.permissions = filtered.slice(start, start + this.pageSize);
  }

  private applyRoleFilter(): void {
    let filtered = [...this.allRoles];
    const keyword = this.searchKeyword.trim().toLowerCase();

    if (keyword) {
      filtered = filtered.filter((role) =>
        role.name.toLowerCase().includes(keyword) ||
        role.code.toLowerCase().includes(keyword) ||
        (role.description || '').toLowerCase().includes(keyword)
      );
    }

    this.totalElements = filtered.length;
    this.totalPages = this.totalElements === 0 ? 0 : Math.ceil(this.totalElements / this.pageSize);

    const start = this.currentPage * this.pageSize;
    this.roles = filtered.slice(start, start + this.pageSize);
  }

  private initCreatePermForm(): CreatePermissionRequest {
    return {
      name: '',
      resource: '',
      action: ActionType.READ
    };
  }

  private initCreateRoleForm(): CreateRoleRequest {
    return {
      name: '',
      description: '',
      is_default: false
    };
  }

  private setEditPermissionState(permission: PermissionResponse): void {
    this.selectedPermission = permission;
    this.editPermForm = {
      name: permission.name,
      description: permission.description ?? undefined
    };
    this.showEditPermModal = true;
  }

  private setEditRoleState(role: RoleResponse): void {
    this.selectedRole = role;
    this.editRoleForm = {
      name: role.name,
      description: role.description ?? undefined,
      is_default: role.is_default
    };
    this.showEditRoleModal = true;
  }

  private buildPermissionGroups(permissions: PermissionResponse[]): PermissionGroup[] {
    const groupedPermissions = permissions.reduce((groups, permission) => {
      if (!groups[permission.resource]) {
        groups[permission.resource] = [];
      }

      groups[permission.resource].push(permission);
      return groups;
    }, {} as Record<string, PermissionResponse[]>);

    return Object.entries(groupedPermissions)
      .map(([resource, groupPermissions]) => ({
        resource,
        permissions: [...groupPermissions].sort((left, right) => {
          const actionOrder = this.getPermissionActionOrder(left.action) - this.getPermissionActionOrder(right.action);
          if (actionOrder !== 0) {
            return actionOrder;
          }

          return left.name.localeCompare(right.name);
        })
      }))
      .sort((left, right) => left.resource.localeCompare(right.resource));
  }

  private initPermissionGroupExpansion(): void {
    this.expandedPermissionGroups = this.permissionGroups.reduce((state, group) => {
      state[group.resource] = group.permissions.some((perm) => this.isPermissionSelected(perm.id));
      return state;
    }, {} as Record<string, boolean>);
  }

  private getPermissionActionOrder(action: string): number {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 1;
      case 'READ':
        return 2;
      case 'WRITE':
        return 3;
      case 'UPDATE':
        return 4;
      case 'EXPORT':
        return 5;
      case 'DELETE':
        return 6;
      default:
        return 99;
    }
  }
}
