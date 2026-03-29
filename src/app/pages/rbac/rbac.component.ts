import { Component, OnInit } from '@angular/core';
import { PermissionService } from '../../service/PermissionService/permission.service';
import { RoleService } from '../../service/RoleService/role.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { PermissionResponse } from '../../dto/response/Permission/PermissionResponse';
import { RoleResponse } from '../../dto/response/Role/RoleResponse';
import { CreatePermissionRequest, UpdatePermissionRequest, ActionType } from '../../dto/request/Permission/PermissionRequest';
import { CreateRoleRequest, UpdateRoleRequest, AssignPermissionsRequest } from '../../dto/request/Role/RoleRequest';

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
    return { name: '', description: '' };
  }

  openCreatePermModal(): void {
    this.createPermForm = this.initCreatePermForm();
    this.showCreatePermModal = true;
  }

  onCreatePermSubmit(): void {
    this.permissionService.create(this.createPermForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Phân quyền', 'Tạo permission thành công!');
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
          this.toastr.success('Phân quyền', 'Cập nhật permission thành công!');
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
          this.toastr.success('Phân quyền', 'Xóa permission thành công!');
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
          this.toastr.success('Phân quyền', 'Tạo role thành công!');
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
          this.toastr.success('Phân quyền', 'Cập nhật role thành công!');
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
          this.toastr.success('Phân quyền', 'Xóa role thành công!');
          this.showDeleteRoleConfirm = false;
          this.loadRoles();
        }
      }
    });
  }

  openAssignPermModal(role: RoleResponse): void {
    this.selectedRole = role;
    this.selectedPermissionsForRole = role.permissions?.map(p => p.id) || [];
    this.permissionService.getAll(0, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.allAvailablePermissions = res.data.content;
          this.showAssignPermModal = true;
        }
      }
    });
  }

  onAssignPermSubmit(): void {
    if (!this.selectedRole) return;
    const request: AssignPermissionsRequest = { permission_ids: this.selectedPermissionsForRole };
    this.roleService.assignPermissions(this.selectedRole.id, request).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Phân quyền', 'Gán permissions thành công!');
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

  closeAllModals(): void {
    this.showCreatePermModal = false;
    this.showEditPermModal = false;
    this.showDeletePermConfirm = false;
    this.showCreateRoleModal = false;
    this.showEditRoleModal = false;
    this.showDeleteRoleConfirm = false;
    this.showAssignPermModal = false;
    this.selectedPermission = null;
    this.permissionToDelete = null;
    this.selectedRole = null;
    this.roleToDelete = null;
  }
}
