import { OtpType } from '../../../helper/enums/OtpType';

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  type: OtpType;
}
