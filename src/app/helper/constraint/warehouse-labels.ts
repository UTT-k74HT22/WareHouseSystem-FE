import { WareHouseStatus } from '../enums/WareHouseStatus';
import { WareHouseType } from '../enums/WareHouseType';

export const WAREHOUSE_STATUS_LABELS: Record<WareHouseStatus, string> = {
  [WareHouseStatus.ACTIVE]: 'Đang hoạt động',
  [WareHouseStatus.INACTIVE]: 'Ngừng hoạt động',
  [WareHouseStatus.UNDER_MAINTENANCE]: 'Đang bảo trì'
};

export const WAREHOUSE_TYPE_LABELS: Record<WareHouseType, string> = {
  [WareHouseType.MAIN]: 'Kho chính',
  [WareHouseType.SATELLITE]: 'Kho vệ tinh',
  [WareHouseType.TRANSIT]: 'Kho trung chuyển',
  [WareHouseType.RETURN]: 'Kho hoàn trả'
};
