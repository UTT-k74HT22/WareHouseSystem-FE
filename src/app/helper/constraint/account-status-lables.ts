import { AccountStatus } from "../enums/AccountStatus";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  [AccountStatus.ACTIVE]: 'Hoạt động',
  [AccountStatus.INACTIVE]: 'Không hoạt động',
  [AccountStatus.SUSPENDED]: 'Tạm ngưng',
  [AccountStatus.DELETED]: 'Đã xóa'
}
