import { Component, OnInit } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { PermissionService } from '../../service/PermissionService/permission.service';
import { RoleService } from '../../service/RoleService/role.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { AuthService } from '../../service/AuthService/auth-service.service';
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
  resourceOptions: ResourceOption[] = [];
  readonly permissionReadPermissions = ['PERM_PERMISSION_READ'];
  readonly permissionCreatePermissions = ['PERM_PERMISSION_CREATE'];
  readonly permissionUpdatePermissions = ['PERM_PERMISSION_UPDATE'];
  readonly permissionDeletePermissions = ['PERM_PERMISSION_DELETE'];
  readonly roleReadPermissions = ['PERM_ROLE_READ'];
  readonly roleCreatePermissions = ['PERM_ROLE_CREATE'];
  readonly roleUpdatePermissions = ['PERM_ROLE_UPDATE'];
  readonly roleDeletePermissions = ['PERM_ROLE_DELETE'];
  readonly rolePermissionReadPermissions = ['PERM_ROLE_PERMISSION_READ'];
  readonly rolePermissionManagePermissions = ['PERM_ROLE_PERMISSION_CREATE', 'PERM_ROLE_PERMISSION_DELETE'];

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private roleService: RoleService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.syncAccessibleTab();
    this.loadPermissionResources();
    this.loadData();
  }

  loadData(): void {
    this.syncAccessibleTab();
    this.loading = true;

    if (this.activeTab === 'permissions') {
      this.loadPermissions();
      return;
    }

    this.loadRoles();
  }

  loadPermissions(): void {
    if (!this.canReadPermissions()) {
      this.loading = false;
      if (this.canReadRoles()) {
        this.activeTab = 'roles';
        this.loadRoles();
      }
      return;
    }

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
          this.syncResourceOptionsFromPermissions(this.allPermissions);
          this.applyPermFilter();
        }
        this.loading = false;
      },
      error: (error) => {
        this.allPermissions = [];
        this.permissions = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;

        if (error?.status === 403 && this.canReadRoles()) {
          this.toastr.warning('Phân quyền', 'Tài khoản hiện không có quyền đọc danh sách permission. Đã chuyển sang tab vai trò.');
          this.activeTab = 'roles';
          this.loadRoles();
          return;
        }

        this.toastr.error('Phân quyền', error?.error?.message || 'Không tải được danh sách permission.');
      }
    });
  }

  loadRoles(): void {
    if (!this.canReadRoles()) {
      this.loading = false;
      if (this.canReadPermissions()) {
        this.activeTab = 'permissions';
        this.loadPermissions();
      }
      return;
    }

    this.roleService.getAll(0, 200, undefined, this.searchKeyword || undefined).subscribe({
      next: (res) => {
        if (res.success) {
          this.allRoles = res.data.content;
          this.applyRoleFilter();
        }
        this.loading = false;
      },
      error: (error) => {
        this.allRoles = [];
        this.roles = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toastr.error('Phân quyền', error?.error?.message || 'Không tải được danh sách role.');
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
    if (!this.canAccessTab(tab)) {
      this.showPermissionDeniedToast();
      return;
    }

    this.activeTab = tab;
    this.currentPage = 0;
    this.searchKeyword = '';
    this.selectedResource = '';
    this.selectedAction = '';
    this.loadData();
  }

  openCreatePermModal(): void {
    if (!this.canCreatePermission()) {
      this.showPermissionDeniedToast();
      return;
    }

    this.loadPermissionResources();
    this.createPermForm = this.initCreatePermForm();
    this.showCreatePermModal = true;
  }

  onCreatePermSubmit(): void {
    this.permissionService.create(this.createPermForm).subscribe({
      next: (res) => {
        if (!res.success) return;

        this.toastr.success('Phân quyền', 'Tạo permission thành công!');
        this.showCreatePermModal = false;
        this.loadPermissionResources(true);
        this.loadPermissions();
      }
    });
  }

  openEditPermModal(perm: PermissionResponse): void {
    if (!this.canUpdatePermission()) {
      this.showPermissionDeniedToast();
      return;
    }

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
    if (!this.canDeletePermission()) {
      this.showPermissionDeniedToast();
      return;
    }

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
        this.loadPermissionResources(true);
        this.loadPermissions();
      }
    });
  }

  openCreateRoleModal(): void {
    if (!this.canCreateRole()) {
      this.showPermissionDeniedToast();
      return;
    }

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
    if (!this.canUpdateRole()) {
      this.showPermissionDeniedToast();
      return;
    }

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
    if (!this.canDeleteRole()) {
      this.showPermissionDeniedToast();
      return;
    }

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
    if (!this.canManageRolePermissions()) {
      this.showPermissionDeniedToast();
      return;
    }

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

  formatPermissionGroupLabel(resource: string | null | undefined): string {
    const normalizedResource = this.normalizeResourceValue(resource);
    if (!normalizedResource) {
      return 'Unknown Resource';
    }

    return normalizedResource
      .split(/[_-]/)
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  getResourceLabel(resource: string | null | undefined): string {
    const normalizedResource = this.normalizeResourceValue(resource);
    if (!normalizedResource) {
      return 'Unknown Resource';
    }

    const matchingOption = this.resourceOptions.find((option) => option.value === normalizedResource);
    return matchingOption?.label ?? this.formatPermissionGroupLabel(resource);
  }

  getPermissionActionLabel(action: string | null | undefined): string {
    const normalizedAction = action?.trim();
    return normalizedAction || 'UNKNOWN';
  }

  getPermissionActionBadgeClass(action: string | null | undefined): string {
    return `badge-action-${this.getPermissionActionLabel(action).toLowerCase()}`;
  }

  private loadPermissionResources(force = false): void {
    if (!force && this.resourceOptions.length > 0) {
      return;
    }

    this.permissionService.getResources().subscribe({
      next: (res) => {
        if (!res.success) {
          return;
        }

        this.resourceOptions = this.toResourceOptions(res.data ?? []);
      },
      error: () => {
        this.syncResourceOptionsFromPermissions(this.allPermissions);
      }
    });
  }

  openViewUsersModal(role: RoleResponse): void {
    if (!this.canReadRoles()) {
      this.showPermissionDeniedToast();
      return;
    }

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
        (permission.name || '').toLowerCase().includes(keyword) ||
        (permission.resource || '').toLowerCase().includes(keyword) ||
        (permission.code || '').toLowerCase().includes(keyword)
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
      const resource = this.normalizeResourceValue(permission.resource) || 'UNKNOWN_RESOURCE';
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

          return (left.name || '').localeCompare(right.name || '');
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

  private getPermissionActionOrder(action: string | null | undefined): number {
    switch ((action || '').toUpperCase()) {
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

  private syncResourceOptionsFromPermissions(permissions: PermissionResponse[]): void {
    if (this.resourceOptions.length > 0 || permissions.length === 0) {
      return;
    }

    const distinctResources = Array.from(
      new Set(
        permissions
          .map((permission) => this.normalizeResourceValue(permission.resource))
          .filter((resource): resource is string => !!resource)
      )
    );
    this.resourceOptions = this.toResourceOptions(distinctResources);
  }

  private toResourceOptions(resources: Array<string | null | undefined>): ResourceOption[] {
    const normalizedResources = Array.from(
      new Set(
        resources
          .map((resource) => this.normalizeResourceValue(resource))
          .filter((resource): resource is string => !!resource)
      )
    );

    return normalizedResources
      .sort((left, right) => left.localeCompare(right))
      .map((resource) => ({
        value: resource,
        label: this.formatPermissionGroupLabel(resource)
      }));
  }

  private normalizeResourceValue(resource: string | null | undefined): string | null {
    const normalizedResource = resource?.trim();
    return normalizedResource ? normalizedResource : null;
  }

  private canAccessTab(tab: 'permissions' | 'roles'): boolean {
    return tab === 'permissions' ? this.canReadPermissions() : this.canReadRoles();
  }

  private canReadPermissions(): boolean {
    return this.authService.hasAnyPermission(this.permissionReadPermissions);
  }

  private canCreatePermission(): boolean {
    return this.authService.hasAnyPermission(this.permissionCreatePermissions);
  }

  private canUpdatePermission(): boolean {
    return this.authService.hasAnyPermission(this.permissionUpdatePermissions);
  }

  private canDeletePermission(): boolean {
    return this.authService.hasAnyPermission(this.permissionDeletePermissions);
  }

  private canReadRoles(): boolean {
    return this.authService.hasAnyPermission(this.roleReadPermissions);
  }

  private canCreateRole(): boolean {
    return this.authService.hasAnyPermission(this.roleCreatePermissions);
  }

  private canUpdateRole(): boolean {
    return this.authService.hasAnyPermission(this.roleUpdatePermissions);
  }

  private canDeleteRole(): boolean {
    return this.authService.hasAnyPermission(this.roleDeletePermissions);
  }

  private canManageRolePermissions(): boolean {
    return this.authService.hasAnyPermission(this.rolePermissionReadPermissions)
      && this.authService.hasAnyPermission(this.rolePermissionManagePermissions);
  }

  private syncAccessibleTab(): void {
    if (this.canAccessTab(this.activeTab)) {
      return;
    }

    if (this.canReadPermissions()) {
      this.activeTab = 'permissions';
      return;
    }

    if (this.canReadRoles()) {
      this.activeTab = 'roles';
    }
  }

  private showPermissionDeniedToast(): void {
    this.toastr.error('Phân quyền', 'Bạn không có quyền thực hiện thao tác này.');
  }
}
