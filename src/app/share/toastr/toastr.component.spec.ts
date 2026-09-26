import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastrComponent } from './toastr.component';

describe('ToastrComponent', () => {
  let component: ToastrComponent;
  let fixture: ComponentFixture<ToastrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToastrComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToastrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should replace the current toast when a new toast arrives', () => {
    component.showToast('error', 'Lỗi cũ', 'Thông báo cũ', 0);
    component.showToast('warning', 'Lỗi mới', 'Thông báo mới', 0);

    expect(component.toasts.length).toBe(1);
    expect(component.toasts[0].title).toBe('Lỗi mới');
    expect(component.toasts[0].message).toBe('Thông báo mới');
  });
});
