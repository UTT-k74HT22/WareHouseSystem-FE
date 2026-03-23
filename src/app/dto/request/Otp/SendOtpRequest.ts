import { OtpType } from '../../../helper/enums/OtpType';

export interface SendOtpRequest {
  email: string;
  type?: OtpType;
}
