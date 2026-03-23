import { TestBed } from '@angular/core/testing';
import { ToastrService } from './toastr.service';

describe('ToastrService', () => {
  let service: ToastrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success toast', (done) => {
    service.toastState.subscribe(toast => {
      expect(toast.type).toBe('success');
      expect(toast.title).toBe('Success');
      expect(toast.message).toBe('Test message');
      done();
    });
    service.success('Success', 'Test message');
  });

  it('should show error toast', (done) => {
    service.toastState.subscribe(toast => {
      expect(toast.type).toBe('error');
      expect(toast.title).toBe('Error');
      expect(toast.message).toBe('Test error');
      done();
    });
    service.error('Error', 'Test error');
  });

  it('should show warning toast', (done) => {
    service.toastState.subscribe(toast => {
      expect(toast.type).toBe('warning');
      expect(toast.title).toBe('Warning');
      expect(toast.message).toBe('Test warning');
      done();
    });
    service.warning('Warning', 'Test warning');
  });

  it('should show info toast', (done) => {
    service.toastState.subscribe(toast => {
      expect(toast.type).toBe('info');
      expect(toast.title).toBe('Info');
      expect(toast.message).toBe('Test info');
      done();
    });
    service.info('Info', 'Test info');
  });
});
