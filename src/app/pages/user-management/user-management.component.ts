import { Component, OnInit } from '@angular/core';
import { forkJoin, of, switchMap } from 'rxjs';
import { AccountService } from '../../service/Account/account.service';
import { UserRoleService } from '../../service/UserRoleService/user-role.service';
import { RoleService } from '../../service/RoleService/role.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { AccountResponse } from '../../dto/response/Account/AccountResponse';
import { RoleResponse } from '../../dto/response/Role/RoleResponse';
import { AssignRolesRequest } from '../../dto/request/Role/RoleRequest';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  readonly userRoleReadPermissions = ['PERM_USER_ROLE_READ'];
  readonly userRoleManagePermissions = ['PERM_USER_ROLE_CREATE', 'PERM_USER_ROLE_DELETE'];

  users: AccountResponse[] = [];
  loading = false;
  savingRoles = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  searchKeyword = '';
  selectedStatus = '';

  showAssignRoleModal = false;
  selectedUser: AccountResponse | null = null;
  allRolesList: RoleResponse[] = [];
  selectedRolesForUser: string[] = [];
  initialRolesForUser: string[] = [];

  statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'];

  constructor(
    private accountService: AccountService,
    private userRoleService: UserRoleService,
    private roleService: RoleService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const search = this.searchKeyword.trim() || undefined;
    const status = this.selectedStatus || undefined;

    this.accountService.getAll(this.currentPage, this.pageSize, search, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.users = res.data.content;
          this.totalElements = res.data.total_elements;
          this.totalPages = res.data.total_pages;
        }
        this.loading = false;
      },
      error: () => {
        this.users = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  onStatusChange(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.loadUsers();
  }

  openAssignRoleModal(user: AccountResponse): void {
    this.selectedUser = user;
    this.selectedRolesForUser = [];
    this.initialRolesForUser = [];

    forkJoin({
      allRoles: this.roleService.getAll(0, 200),
      userRoles: this.userRoleService.getUserRoles(user.account_id, 0, 200)
    }).subscribe({
      next: (res) => {
        if (!res.allRoles.success) {
          return;
        }

        this.allRolesList = res.allRoles.data.content;
        this.selectedRolesForUser = res.userRoles.success
          ? res.userRoles.data.content.map((role) => role.id)
          : [];
        this.initialRolesForUser = [...this.selectedRolesForUser];
        this.showAssignRoleModal = true;
      },
      error: () => {
        this.allRolesList = [];
      }
    });
  }

  onAssignRoleSubmit(): void {
    if (!this.selectedUser || this.savingRoles) {
      return;
    }

    if (this.selectedRolesForUser.length === 0) {
      this.toastr.warning('Quan ly user', 'Moi user phai co it nhat mot role.');
      return;
    }

    const userId = this.selectedUser.account_id;
    const initialRoleSet = new Set(this.initialRolesForUser);
    const selectedRoleSet = new Set(this.selectedRolesForUser);

    const roleIdsToRemove = this.initialRolesForUser.filter((roleId) => !selectedRoleSet.has(roleId));
    const hasAddedRoles = this.selectedRolesForUser.some((roleId) => !initialRoleSet.has(roleId));

    if (roleIdsToRemove.length === 0 && !hasAddedRoles) {
      this.toastr.info('Quản lý user', 'Không có thay đổi role nào.');
      this.showAssignRoleModal = false;
      return;
    }

    this.savingRoles = true;

    const removeOperation = roleIdsToRemove.length > 0
      ? forkJoin(roleIdsToRemove.map((roleId) => this.userRoleService.removeRoleFromUser(userId, roleId)))
      : of([]);

    removeOperation.pipe(
      switchMap(() => {
        if (!hasAddedRoles) {
          return of(null);
        }

        const request: AssignRolesRequest = { role_ids: this.selectedRolesForUser };
        return this.userRoleService.assignRolesToUser(userId, request);
      })
    ).subscribe({
      next: () => {
        this.toastr.success('Quản lý user', 'Cập nhật roles thành công!');
        this.showAssignRoleModal = false;
        this.savingRoles = false;
        this.loadUsers();
      },
      error: () => {
        this.savingRoles = false;
      }
    });
  }

  toggleRoleSelection(roleId: string): void {
    const idx = this.selectedRolesForUser.indexOf(roleId);
    if (idx >= 0) {
      if (this.selectedRolesForUser.length === 1) {
        this.toastr.warning('Quản lý user', 'Mỗi user phải có ít nhất một role.');
        return;
      }

      this.selectedRolesForUser.splice(idx, 1);
      return;
    }

    this.selectedRolesForUser.push(roleId);
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRolesForUser.includes(roleId);
  }

  closeModal(): void {
    if (this.savingRoles) {
      return;
    }

    this.showAssignRoleModal = false;
    this.selectedUser = null;
    this.allRolesList = [];
    this.selectedRolesForUser = [];
    this.initialRolesForUser = [];
  }

  getStatusLabel(status: unknown): string {
    const statusStr = String(status);
    switch (statusStr) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'INACTIVE':
        return 'Không hoạt động';
      case 'SUSPENDED':
        return 'Tạm ngưng';
      case 'DELETED':
        return 'Đã xóa';
      default:
        return statusStr;
    }
  }

  getStatusClass(status: unknown): string {
    const statusStr = String(status);
    switch (statusStr) {
      case 'ACTIVE':
        return 'badge-active';
      case 'INACTIVE':
        return 'badge-inactive';
      case 'SUSPENDED':
        return 'badge-locked';
      case 'DELETED':
        return 'badge-inactive';
      default:
        return 'badge-inactive';
    }
  }
}
