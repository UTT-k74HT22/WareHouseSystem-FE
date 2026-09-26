import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorService } from './api-error.service';

describe('ApiErrorService', () => {
  let service: ApiErrorService;

  beforeEach(() => {
    service = new ApiErrorService();
  });

  [
    [0, 'Không thể kết nối đến máy chủ. Kiểm tra mạng rồi thử lại.'],
    [400, 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.'],
    [401, 'Thông tin xác thực không hợp lệ hoặc phiên đăng nhập đã hết hạn.'],
    [403, 'Bạn không có quyền thực hiện thao tác này.'],
    [404, 'Dữ liệu yêu cầu không tồn tại hoặc đã bị xóa.'],
    [405, 'Phương thức yêu cầu không được hỗ trợ.'],
    [409, 'Dữ liệu đã thay đổi hoặc trùng với dữ liệu hiện có.'],
    [413, 'Tệp hoặc yêu cầu vượt quá dung lượng cho phép.'],
    [415, 'Định dạng dữ liệu hoặc tệp không được hỗ trợ.'],
    [422, 'Thông tin hợp lệ về định dạng nhưng không thể xử lý.'],
    [500, 'Hệ thống gặp sự cố. Vui lòng thử lại sau.'],
    [503, 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.']
  ].forEach(([status, message]) => {
    it(`should map HTTP ${status} to Vietnamese`, () => {
      const error = new HttpErrorResponse({ status: status as number, error: null });
      expect(service.normalize(error).message).toBe(message as string);
    });
  });

  it('should prioritize Vietnamese backend message', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { error_code: 'PROD_002', message: 'SKU sản phẩm đã tồn tại' }
    });
    const normalized = service.normalize(error);
    expect(normalized.code).toBe('PROD_002');
    expect(normalized.message).toBe('SKU sản phẩm đã tồn tại');
  });

  it('should replace English backend message with status fallback', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: { message: 'Internal server error' }
    });
    expect(service.normalize(error).message).toBe('Hệ thống gặp sự cố. Vui lòng thử lại sau.');
  });

  it('should join field error messages', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error_code: 'COM_001',
        field_errors: [
          { field: 'name', message: 'Tên là bắt buộc', rejected_value: null },
          { field: 'email', message: 'Email không đúng định dạng', rejected_value: 'bad' }
        ]
      }
    });
    expect(service.normalize(error).message).toBe('Tên là bắt buộc; Email không đúng định dạng');
  });

  it('should include retry delay for rate limit errors', () => {
    const error = new HttpErrorResponse({
      status: 429,
      error: { error_code: 'RATE_001', retry_after: 30 }
    });
    expect(service.normalize(error).message).toBe('Bạn thao tác quá nhanh. Vui lòng thử lại sau 30 giây.');
  });
});
