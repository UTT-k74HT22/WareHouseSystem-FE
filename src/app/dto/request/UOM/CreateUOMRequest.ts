import { UnitsOfMeasureType } from '../../../helper/enums/UnitsOfMeasureType';

export interface CreateUOMRequest {
  name: string;
  description?: string;
  type: UnitsOfMeasureType;
}
