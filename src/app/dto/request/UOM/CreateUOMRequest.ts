import { UnitsOfMeasureType } from '../../../helper/enums/UnitsOfMeasureType';

export interface CreateUOMRequest {
  code: string;
  name: string;
  description?: string;
  type: UnitsOfMeasureType;
}
