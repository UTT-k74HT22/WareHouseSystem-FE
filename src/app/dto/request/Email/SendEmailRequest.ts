import { EmailType } from '../../../helper/enums/EmailType';

export interface SendEmailRequest {
  recipient: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  email_type: EmailType;
  template_variables?: { [key: string]: any };
  template_name?: string;
  priority?: number;
  async?: boolean;
  attachment_path?: string;
  scheduled_at?: string;
}
