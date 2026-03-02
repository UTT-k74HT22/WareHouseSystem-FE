import { EmployeeStatus } from '../enums/EmployeeStatus';
import { RoleType } from '../enums/RoleType';

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  [EmployeeStatus.ACTIVE]: 'Đang làm việc',
  [EmployeeStatus.ON_LEAVE]: 'Đang nghỉ phép',
  [EmployeeStatus.TERMINATED]: 'Đã nghỉ việc'
};

export const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  [RoleType.USER]: 'Nhân viên',
  [RoleType.ADMIN]: 'Quản trị viên',
  [RoleType.MANAGER]: 'Quản lý'
};
