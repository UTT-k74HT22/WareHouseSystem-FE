import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
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
  users: AccountResponse[] = [];
  loading = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  searchKeyword = '';
  selectedStatus = '';

  showAssignRoleModal = false;
  showDeleteAllRolesConfirm = false;
  selectedUser: AccountResponse | null = null;
  allRolesList: RoleResponse[] = [];
  selectedRolesForUser: string[] = [];

  removingRoles = false;

  statuses = ['ACTIVE', 'INACTIVE', 'LOCKED'];

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
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  openAssignRoleModal(user: AccountResponse): void {
    this.selectedUser = user;
    this.selectedRolesForUser = [];
    forkJoin({
      allRoles: this.roleService.getAll(0, 200),
      userRoles: this.userRoleService.getUserRoles(user.account_id, 0, 200)
    }).subscribe({
      next: (res) => {
        if (res.allRoles.success) {
          this.allRolesList = res.allRoles.data.content;
          this.selectedRolesForUser = res.userRoles.success
            ? res.userRoles.data.content.map((role) => role.id)
            : [];
          this.showAssignRoleModal = true;
        }
      },
      error: () => {
        this.allRolesList = [];
      }
    });
  }

  onAssignRoleSubmit(): void {
    if (!this.selectedUser) return;
    const request: AssignRolesRequest = { role_ids: this.selectedRolesForUser };
    this.userRoleService.assignRolesToUser(this.selectedUser.account_id, request).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Quản lý user', 'Cập nhật roles thành công!');
          this.showAssignRoleModal = false;
          this.loadUsers();
        }
      }
    });
  }

  onRemoveAllRoles(): void {
    if (!this.selectedUser) return;
    this.showDeleteAllRolesConfirm = true;
  }

  confirmRemoveAllRoles(): void {
    if (!this.selectedUser) return;
    this.removingRoles = true;
    this.userRoleService.removeAllRolesFromUser(this.selectedUser.account_id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Quản lý user', 'Đã xóa tất cả roles!');
          this.showDeleteAllRolesConfirm = false;
          this.showAssignRoleModal = false;
          this.removingRoles = false;
          this.loadUsers();
        }
      },
      error: () => {
        this.removingRoles = false;
      }
    });
  }

  cancelRemoveAllRoles(): void {
    this.showDeleteAllRolesConfirm = false;
  }

  toggleRoleSelection(roleId: string): void {
    const idx = this.selectedRolesForUser.indexOf(roleId);
    if (idx >= 0) {
      this.selectedRolesForUser.splice(idx, 1);
    } else {
      this.selectedRolesForUser.push(roleId);
    }
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRolesForUser.includes(roleId);
  }

  closeModal(): void {
    this.showAssignRoleModal = false;
    this.showDeleteAllRolesConfirm = false;
    this.selectedUser = null;
    this.allRolesList = [];
  }

  getStatusLabel(status: any): string {
    const statusStr = String(status);
    switch (statusStr) {
      case 'ACTIVE': return 'Hoạt động';
      case 'INACTIVE': return 'Không hoạt động';
      case 'LOCKED': return 'Bị khóa';
      default: return statusStr;
    }
  }

  getStatusClass(status: any): string {
    const statusStr = String(status);
    switch (statusStr) {
      case 'ACTIVE': return 'badge-active';
      case 'INACTIVE': return 'badge-inactive';
      case 'LOCKED': return 'badge-locked';
      default: return 'badge-inactive';
    }
  }
}
