import { UnitsOfMeasureType } from '../../../helper/enums/UnitsOfMeasureType';

export interface UpdateUOMRequest {
  name?: string;
  description?: string;
  type?: UnitsOfMeasureType;
}
