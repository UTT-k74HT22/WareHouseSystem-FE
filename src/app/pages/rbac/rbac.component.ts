import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PermissionService } from '../../service/PermissionService/permission.service';
import { RoleService } from '../../service/RoleService/role.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { PermissionResponse } from '../../dto/response/Permission/PermissionResponse';
import { RoleResponse } from '../../dto/response/Role/RoleResponse';
import { CreatePermissionRequest, UpdatePermissionRequest, ActionType } from '../../dto/request/Permission/PermissionRequest';
import { CreateRoleRequest, UpdateRoleRequest, AssignPermissionsRequest } from '../../dto/request/Role/RoleRequest';

interface PermissionGroup {
  resource: string;
  permissions: PermissionResponse[];
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
  selectedAction = '';

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

  createPermForm: CreatePermissionRequest = this.initCreatePermForm();
  editPermForm: UpdatePermissionRequest = {};
  editPermAction: ActionType = ActionType.GET;

  createRoleForm: CreateRoleRequest = this.initCreateRoleForm();
  editRoleForm: UpdateRoleRequest = {};

  ActionType = ActionType;
  resources = [
    'auth', 'batch', 'business-partner', 'category', 'email', 'employee',
    'inventory', 'location', 'inbound-receipt', 'outbound-shipment',
    'product', 'purchase-order', 'sales-order', 'stock-adjustment',
    'stock-movement', 'stock-transfer', 'storage', 'units-of-measure',
    'user', 'warehouse'
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
    } else {
      this.loadRoles();
    }
  }

  loadPermissions(): void {
    this.permissionService.getAll(
      0, 200,
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
    this.applyPermFilter();
  }

  switchTab(tab: 'permissions' | 'roles'): void {
    this.activeTab = tab;
    this.currentPage = 0;
    this.searchKeyword = '';
    this.selectedResource = '';
    this.selectedAction = '';
    this.loadData();
  }

  private applyPermFilter(): void {
    let filtered = [...this.allPermissions];
    const keyword = this.searchKeyword.trim().toLowerCase();
    if (keyword) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.resource.toLowerCase().includes(keyword) ||
        p.code.toLowerCase().includes(keyword)
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
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(keyword) ||
        r.code.toLowerCase().includes(keyword) ||
        (r.description || '').toLowerCase().includes(keyword)
      );
    }
    this.totalElements = filtered.length;
    this.totalPages = this.totalElements === 0 ? 0 : Math.ceil(this.totalElements / this.pageSize);
    const start = this.currentPage * this.pageSize;
    this.roles = filtered.slice(start, start + this.pageSize);
  }

  private initCreatePermForm(): CreatePermissionRequest {
    return { name: '', resource: '', action: ActionType.GET };
  }

  private initCreateRoleForm(): CreateRoleRequest {
    return { name: '', description: '', is_default: false };
  }

  openCreatePermModal(): void {
    this.createPermForm = this.initCreatePermForm();
    this.showCreatePermModal = true;
  }

  onCreatePermSubmit(): void {
    this.permissionService.create(this.createPermForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo permission thành công!');
          this.showCreatePermModal = false;
          this.loadPermissions();
        }
      }
    });
  }

  openEditPermModal(perm: PermissionResponse): void {
    this.selectedPermission = perm;
    this.editPermForm = {
      name: perm.name,
      resource: perm.resource,
      action: perm.action as ActionType,
      description: perm.description ?? undefined
    };
    this.editPermAction = perm.action as ActionType;
    this.showEditPermModal = true;
  }

  onEditPermSubmit(): void {
    if (!this.selectedPermission) return;
    this.permissionService.update(this.selectedPermission.id, this.editPermForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật permission thành công!');
          this.showEditPermModal = false;
          this.loadPermissions();
        }
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
        if (res.success) {
          this.toastr.success('Xóa permission thành công!');
          this.showDeletePermConfirm = false;
          this.loadPermissions();
        }
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
        if (res.success) {
          this.toastr.success('Tạo role thành công!');
          this.showCreateRoleModal = false;
          this.loadRoles();
        }
      }
    });
  }

  openEditRoleModal(role: RoleResponse): void {
    this.selectedRole = role;
    this.editRoleForm = {
      name: role.name,
      description: role.description ?? undefined,
      is_default: role.is_default
    };
    this.showEditRoleModal = true;
  }

  onEditRoleSubmit(): void {
    if (!this.selectedRole) return;
    this.roleService.update(this.selectedRole.id, this.editRoleForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật role thành công!');
          this.showEditRoleModal = false;
          this.loadRoles();
        }
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
        if (res.success) {
          this.toastr.success('Xóa role thành công!');
          this.showDeleteRoleConfirm = false;
          this.loadRoles();
        }
      }
    });
  }

  openAssignPermModal(role: RoleResponse): void {
    this.selectedRole = role;
    this.selectedPermissionsForRole = [];
    forkJoin({
      allPermissions: this.permissionService.getAll(0, 200),
      assignedPermissions: this.roleService.getPermissions(role.id, 0, 200)
    }).subscribe({
      next: (res) => {
        if (res.allPermissions.success) {
          this.allAvailablePermissions = res.allPermissions.data.content;
          this.selectedPermissionsForRole = res.assignedPermissions.success
            ? res.assignedPermissions.data.content.map((permission) => permission.id)
            : [];
          this.permissionGroups = this.buildPermissionGroups(this.allAvailablePermissions);
          this.initPermissionGroupExpansion();
          this.showAssignPermModal = true;
        }
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
    const request: AssignPermissionsRequest = { permission_ids: this.selectedPermissionsForRole };
    this.roleService.assignPermissions(this.selectedRole.id, request).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Gán permissions thành công!');
          this.showAssignPermModal = false;
          this.loadRoles();
        }
      }
    });
  }

  togglePermissionSelection(permId: string): void {
    const idx = this.selectedPermissionsForRole.indexOf(permId);
    if (idx >= 0) {
      this.selectedPermissionsForRole.splice(idx, 1);
    } else {
      this.selectedPermissionsForRole.push(permId);
    }
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
      } else {
        selectedIds.delete(perm.id);
      }
    });

    this.selectedPermissionsForRole = Array.from(selectedIds);
  }

  formatPermissionGroupLabel(resource: string): string {
    return resource
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private buildPermissionGroups(permissions: PermissionResponse[]): PermissionGroup[] {
    const groupedPermissions = permissions.reduce((groups, permission) => {
      const resource = permission.resource;
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(permission);
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
      case 'GET':
        return 1;
      case 'POST':
        return 2;
      case 'PUT':
        return 3;
      case 'DELETE':
        return 4;
      default:
        return 99;
    }
  }

  closeAllModals(): void {
    this.showCreatePermModal = false;
    this.showEditPermModal = false;
    this.showDeletePermConfirm = false;
    this.showCreateRoleModal = false;
    this.showEditRoleModal = false;
    this.showDeleteRoleConfirm = false;
    this.showAssignPermModal = false;
    this.permissionGroups = [];
    this.expandedPermissionGroups = {};
    this.selectedPermission = null;
    this.permissionToDelete = null;
    this.selectedRole = null;
    this.roleToDelete = null;
  }
}
