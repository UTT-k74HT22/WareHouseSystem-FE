import { EmailType } from '../../../helper/enums/EmailType';
import { EmailStatus } from '../../../helper/enums/EmailStatus';

export interface EmailLogResponse {
  id: string;
  recipient: string;
  subject: string;
  email_type: EmailType;
  status: EmailStatus;
  retry_count: number;
  error_message: string | null;
  sent_at: string | null;
  has_attachment: boolean;
  priority: number;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  triggered_by_username: string;
}
