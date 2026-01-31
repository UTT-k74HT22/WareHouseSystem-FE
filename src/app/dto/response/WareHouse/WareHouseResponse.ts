import {WareHouseStatus} from "../../../helper/enums/WareHouseStatus";
import {WareHouseType} from "../../../helper/enums/WareHouseType";

export interface WareHouseResponse {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string
  status: WareHouseStatus;
  ware_house_type: WareHouseType;
  manager_id: string;
}
