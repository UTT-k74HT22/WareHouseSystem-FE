import { LocationStatus } from '../enums/LocationStatus';
import { LocationType } from '../enums/LocationType';

export const LOCATION_STATUS_LABELS: Record<LocationStatus, string> = {
  [LocationStatus.ACTIVE]: 'Đang hoạt động',
  [LocationStatus.INACTIVE]: 'Ngừng hoạt động',
  [LocationStatus.FULL]: 'Đã đầy',
  [LocationStatus.MAINTENANCE]: 'Đang bảo trì'
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  [LocationType.STORAGE]: 'Kho lưu trữ',
  [LocationType.PICKING]: 'Khu vực lấy hàng',
  [LocationType.PACKING]: 'Khu vực đóng gói',
  [LocationType.STAGING]: 'Khu vực tập kết',
  [LocationType.RETURN]: 'Khu vực hoàn trả'
};
