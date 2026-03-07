import { UnitsOfMeasureType } from '../../../helper/enums/UnitsOfMeasureType';

export interface UnitsOfMeasureResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: UnitsOfMeasureType;
}
