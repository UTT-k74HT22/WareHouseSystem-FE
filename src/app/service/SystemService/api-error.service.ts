import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../../dto/response/ApiResponse';
import { FieldError } from '../../dto/response/FieldError';

export interface NormalizedApiError {
  status: number;
  code: string;
  title: string;
  message: string;
  fieldErrors: FieldError[];
  retryAfter?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly statusMessages: Record<number, { title: string; message: string }> = {
    0: { title: 'Không thể kết nối', message: 'Không thể kết nối đến máy chủ. Kiểm tra mạng rồi thử lại.' },
    400: { title: 'Dữ liệu không hợp lệ', message: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.' },
    401: { title: 'Xác thực thất bại', message: 'Thông tin xác thực không hợp lệ hoặc phiên đăng nhập đã hết hạn.' },
    403: { title: 'Không có quyền', message: 'Bạn không có quyền thực hiện thao tác này.' },
    404: { title: 'Không tìm thấy dữ liệu', message: 'Dữ liệu yêu cầu không tồn tại hoặc đã bị xóa.' },
    405: { title: 'Thao tác không được hỗ trợ', message: 'Phương thức yêu cầu không được hỗ trợ.' },
    409: { title: 'Dữ liệu bị xung đột', message: 'Dữ liệu đã thay đổi hoặc trùng với dữ liệu hiện có.' },
    413: { title: 'Dữ liệu quá lớn', message: 'Tệp hoặc yêu cầu vượt quá dung lượng cho phép.' },
    415: { title: 'Định dạng không được hỗ trợ', message: 'Định dạng dữ liệu hoặc tệp không được hỗ trợ.' },
    422: { title: 'Không thể xử lý dữ liệu', message: 'Thông tin hợp lệ về định dạng nhưng không thể xử lý.' },
    429: { title: 'Thao tác quá nhanh', message: 'Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.' },
    500: { title: 'Lỗi hệ thống', message: 'Hệ thống gặp sự cố. Vui lòng thử lại sau.' },
    502: { title: 'Dịch vụ tạm gián đoạn', message: 'Máy chủ trung gian nhận phản hồi không hợp lệ.' },
    503: { title: 'Dịch vụ chưa sẵn sàng', message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.' },
    504: { title: 'Máy chủ phản hồi chậm', message: 'Máy chủ phản hồi quá thời gian. Vui lòng thử lại.' }
  };

  normalize(error: unknown, fallback?: string): NormalizedApiError {
    const httpError = error instanceof HttpErrorResponse ? error : null;
    const status = httpError?.status ?? 0;
    const body = this.readBody(httpError?.error);
    const fieldErrors = Array.isArray(body.field_errors) ? body.field_errors : [];
    const statusFallback = this.statusMessages[status] ?? {
      title: 'Không thể thực hiện yêu cầu',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại.'
    };
    const fieldMessage = fieldErrors.map(item => item.message).filter(Boolean).join('; ');
    const backendMessage = this.isSafeVietnameseMessage(body.message) ? body.message!.trim() : '';
    const retryMessage = status === 429 && body.retry_after
      ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${body.retry_after} giây.`
      : '';

    return {
      status,
      code: body.error_code || body.errorCode || `HTTP_${status}`,
      title: statusFallback.title,
      message: fieldMessage || retryMessage || backendMessage || fallback || statusFallback.message,
      fieldErrors,
      retryAfter: body.retry_after
    };
  }

  localize(error: HttpErrorResponse): HttpErrorResponse {
    const normalized = this.normalize(error);
    const originalBody = this.readBody(error.error);
    return new HttpErrorResponse({
      error: {
        ...originalBody,
        success: false,
        error_code: normalized.code,
        message: normalized.message,
        field_errors: normalized.fieldErrors.length ? normalized.fieldErrors : null
      },
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url ?? undefined
    });
  }

  private readBody(payload: unknown): ApiErrorBody {
    if (payload && typeof payload === 'object' && !(payload instanceof Blob)) {
      return payload as ApiErrorBody;
    }
    return {};
  }

  private isSafeVietnameseMessage(message?: string | null): boolean {
    if (!message?.trim()) {
      return false;
    }
    return /[À-ỹ]/.test(message) || !/[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(message);
  }
}
