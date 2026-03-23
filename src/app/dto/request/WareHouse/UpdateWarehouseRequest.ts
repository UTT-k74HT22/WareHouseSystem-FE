import { WareHouseType } from "../../../helper/enums/WareHouseType";

export interface UpdateWarehouseRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  ware_house_type: WareHouseType;
  manager_id?: string;
}
