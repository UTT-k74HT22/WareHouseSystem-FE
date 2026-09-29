import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AccountService } from '../../service/Account/account.service';
import { UserRoleService } from '../../service/UserRoleService/user-role.service';
import { RoleService } from '../../service/RoleService/role.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { AccountResponse } from '../../dto/response/Account/AccountResponse';
import { RoleResponse } from '../../dto/response/Role/RoleResponse';
import { AssignRolesRequest } from '../../dto/request/Role/RoleRequest';
import { ResetUserPasswordRequest, UpdateUserRequest } from '../../dto/request/User/UserRequest';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  readonly userRoleReadPermissions = ['PERM_USER_ROLE_READ'];
  readonly userRoleManagePermissions = ['PERM_USER_ROLE_CREATE', 'PERM_USER_ROLE_DELETE'];
  readonly userUpdatePermissions = ['PERM_USER_UPDATE'];

  users: AccountResponse[] = [];
  loading = false;
  savingEdit = false;
  savingPassword = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  searchKeyword = '';
  selectedStatus = '';

  showEditModal = false;
  editUser: AccountResponse | null = null;
  editForm = this.createEmptyEditForm();
  rolesEditable = false;
  allRolesList: RoleResponse[] = [];
  selectedRolesForUser: string[] = [];
  initialRolesForUser: string[] = [];

  showDetailModal = false;
  detailUser: AccountResponse | null = null;
  detailRoles: RoleResponse[] = [];
  detailLoading = false;

  showResetPasswordModal = false;
  resetPasswordUser: AccountResponse | null = null;
  newPassword = '';
  confirmPassword = '';

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
      error: (error) => {
        this.users = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toastr.error('Quản lý user', error?.error?.message || 'Không tải được danh sách user.');
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

  openEditModal(user: AccountResponse): void {
    this.editUser = user;
    this.editForm = {
      username: user.username,
      email: user.email ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      status: String(user.status)
    };
    this.selectedRolesForUser = [];
    this.initialRolesForUser = [];
    this.allRolesList = [];
    this.rolesEditable = false;
    this.showEditModal = true;
    this.loadRoleSelection(user.account_id);
  }

  closeEditModal(): void {
    if (this.savingEdit) {
      return;
    }
    this.showEditModal = false;
    this.editUser = null;
    this.editForm = this.createEmptyEditForm();
    this.allRolesList = [];
    this.selectedRolesForUser = [];
    this.initialRolesForUser = [];
    this.rolesEditable = false;
  }

  openDetailModal(user: AccountResponse): void {
    this.detailUser = user;
    this.detailRoles = [];
    this.detailLoading = true;
    this.showDetailModal = true;

    this.userRoleService.getUserRoles(user.account_id, 0, 200).subscribe({
      next: (res) => {
        this.detailRoles = res.success ? res.data.content : [];
        this.detailLoading = false;
      },
      error: (error) => {
        this.detailRoles = [];
        this.detailLoading = false;
        this.toastr.warning('Quản lý user', error?.error?.message || 'Không tải được roles của user.');
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.detailUser = null;
    this.detailRoles = [];
    this.detailLoading = false;
  }

  private createEmptyEditForm(): { username: string; email: string; first_name: string; last_name: string; status: string } {
    return { username: '', email: '', first_name: '', last_name: '', status: '' };
  }

  private loadRoleSelection(userId: string): void {
    forkJoin({
      allRoles: this.roleService.getAll(0, 200),
      userRoles: this.userRoleService.getUserRoles(userId, 0, 200)
    }).subscribe({
      next: (res) => {
        if (!res.allRoles.success) {
          this.toastr.error('Quản lý user', 'Không tải được danh sách roles.');
          return;
        }
        this.allRolesList = res.allRoles.data.content;
        this.selectedRolesForUser = res.userRoles.success
          ? res.userRoles.data.content.map((role) => role.id)
          : [];
        this.initialRolesForUser = [...this.selectedRolesForUser];
        this.rolesEditable = true;
      },
      error: (err) => {
        this.allRolesList = [];
        this.rolesEditable = false;
        this.toastr.error('Quản lý user', err?.error?.message || 'Không tải được thông tin roles. Kiểm tra quyền PERM_ROLE_READ và PERM_USER_ROLE_READ.');
      }
    });
  }

  onEditSubmit(): void {
    if (!this.editUser || this.savingEdit) {
      return;
    }

    const username = this.editForm.username.trim();
    if (username.length < 3 || username.length > 50) {
      this.toastr.warning('Quản lý user', 'Tên đăng nhập phải từ 3 đến 50 ký tự.');
      return;
    }
    const email = this.editForm.email.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 100) {
        this.toastr.warning('Quản lý user', 'Email không hợp lệ.');
        return;
      }
    }
    if (this.editForm.first_name.trim().length > 50 || this.editForm.last_name.trim().length > 50) {
      this.toastr.warning('Quản lý user', 'Họ và tên không được vượt quá 50 ký tự.');
      return;
    }

    const request: UpdateUserRequest = {
      username,
      email: email || null,
      first_name: this.editForm.first_name.trim() || null,
      last_name: this.editForm.last_name.trim() || null,
      status: this.editForm.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    };

    const infoChanged =
      username !== (this.editUser.username || '') ||
      email !== (this.editUser.email || '') ||
      this.editForm.first_name.trim() !== (this.editUser.first_name || '') ||
      this.editForm.last_name.trim() !== (this.editUser.last_name || '');
    const statusChanged = !!this.editForm.status && this.editForm.status !== String(this.editUser.status);
    if (!infoChanged && !statusChanged && !this.hasRoleChanges()) {
      this.toastr.info('Quản lý user', 'Không có thay đổi nào.');
      this.closeEditModal();
      return;
    }

    this.savingEdit = true;
    this.accountService.update(this.editUser.account_id, request).subscribe({
      next: () => {
        this.persistRoleChanges(this.editUser!.account_id, () => {
          this.toastr.success('Quản lý user', 'Cập nhật user thành công!');
          this.showEditModal = false;
          this.editUser = null;
          this.savingEdit = false;
          this.loadUsers();
        });
      },
      error: (error) => {
        this.savingEdit = false;
        this.toastr.error('Quản lý user', error?.error?.message || 'Cập nhật user thất bại.');
      }
    });
  }

  private hasRoleChanges(): boolean {
    if (!this.rolesEditable) {
      return false;
    }
    const initialRoleSet = new Set(this.initialRolesForUser);
    const selectedRoleSet = new Set(this.selectedRolesForUser);
    const removed = this.initialRolesForUser.some((roleId) => !selectedRoleSet.has(roleId));
    const added = this.selectedRolesForUser.some((roleId) => !initialRoleSet.has(roleId));
    return removed || added;
  }

  private persistRoleChanges(userId: string, onDone: () => void): void {
    if (!this.rolesEditable) {
      onDone();
      return;
    }

    if (this.selectedRolesForUser.length === 0) {
      this.savingEdit = false;
      this.toastr.warning('Quản lý user', 'Mỗi user phải có ít nhất một role.');
      return;
    }

    if (!this.hasRoleChanges()) {
      onDone();
      return;
    }

    // BE POST đã sync/replace toàn bộ: chỉ cần 1 call, tránh dở dang giữa DELETE và POST
    const request: AssignRolesRequest = { role_ids: this.selectedRolesForUser };
    this.userRoleService.assignRolesToUser(userId, request).subscribe({
      next: () => onDone(),
      error: (error) => {
        this.savingEdit = false;
        this.toastr.error('Quản lý user', error?.error?.message || 'Cập nhật roles thất bại.');
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

  openResetPasswordModal(user: AccountResponse): void {
    this.resetPasswordUser = user;
    this.newPassword = '';
    this.confirmPassword = '';
    this.showResetPasswordModal = true;
  }

  closeResetPasswordModal(): void {
    if (this.savingPassword) {
      return;
    }
    this.showResetPasswordModal = false;
    this.resetPasswordUser = null;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  onResetPasswordSubmit(): void {
    if (!this.resetPasswordUser || this.savingPassword) {
      return;
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(this.newPassword)) {
      this.toastr.warning('Quản lý user', 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toastr.warning('Quản lý user', 'Mật khẩu nhập lại không khớp.');
      return;
    }

    const request: ResetUserPasswordRequest = { new_password: this.newPassword };
    this.savingPassword = true;
    this.accountService.resetPassword(this.resetPasswordUser.account_id, request).subscribe({
      next: () => {
        this.toastr.success('Quản lý user', 'Đã đặt lại mật khẩu cho tài khoản.');
        this.showResetPasswordModal = false;
        this.resetPasswordUser = null;
        this.newPassword = '';
        this.confirmPassword = '';
        this.savingPassword = false;
      },
      error: (error) => {
        this.savingPassword = false;
        this.toastr.error('Quản lý user', error?.error?.message || 'Đặt lại mật khẩu thất bại.');
      }
    });
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
