import { WareHouseStatus } from "../../../helper/enums/WareHouseStatus";
import { WareHouseType } from "../../../helper/enums/WareHouseType";

export interface CreateWarehouseRequest {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone: string;
  email: string;
  ware_house_type: WareHouseType;
  status: WareHouseStatus;
  capacity?: number;
  manager_id?: string;
}

export type UpdateWarehouseRequest = Partial<Omit<CreateWarehouseRequest, 'status'>> & Pick<
  CreateWarehouseRequest,
  'name' | 'address' | 'phone' | 'email' | 'ware_house_type'
> & {
  // chỉ dùng cho PATCH /{id}/status, PUT bỏ qua
  status?: WareHouseStatus;
};
