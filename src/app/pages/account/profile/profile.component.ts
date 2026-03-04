import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../service/AuthService/auth-service.service';
import { ToastrService } from '../../../service/SystemService/toastr.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  isEditing = false;
  isLoading = false;

  username = '';
  avatarInitial = 'A';
  roleDisplay = 'Warehouse Staff';
  email = '';
  joinDate = '01/01/2026';
  private initialProfileData: Record<string, string> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.isAuthenticated && state.username) {
          this.username = state.username;
          this.avatarInitial = state.username.charAt(0).toUpperCase();
          const roles = state.roles || [];
          if (roles.some(r => r.includes('ADMIN'))) {
            this.roleDisplay = 'Administrator';
          } else if (roles.some(r => r.includes('MANAGER'))) {
            this.roleDisplay = 'Warehouse Manager';
          } else {
            this.roleDisplay = 'Warehouse Staff';
          }

          this.initialProfileData = {
            firstName: state.username,
            lastName: 'User',
            email: `${state.username.toLowerCase()}@warehouse.com`,
            phone: '',
            department: 'Kho vận',
            position: this.roleDisplay
          };

          this.applyProfileData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10,11}$/)]],
      department: [{ value: '', disabled: true }],
      position: [{ value: '', disabled: true }]
    });
    this.setEditableState(false);
  }

  private applyProfileData(): void {
    this.profileForm.patchValue(this.initialProfileData);
    this.email = this.initialProfileData['email'];
  }

  private setEditableState(isEditing: boolean): void {
    const editableFields = ['firstName', 'lastName', 'email', 'phone'];
    editableFields.forEach(field => {
      const control = this.profileForm.get(field);
      if (!control) {
        return;
      }

      if (isEditing) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.setEditableState(this.isEditing);

    if (!this.isEditing && !this.isLoading) {
      this.applyProfileData();
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      const { department, position, ...updatedProfile } = this.profileForm.getRawValue();
      this.initialProfileData = {
        ...this.initialProfileData,
        ...updatedProfile
      };
      this.applyProfileData();
      this.isEditing = false;
      this.setEditableState(false);
      this.toastr.success('Thành công', 'Cập nhật thông tin cá nhân thành công');
    }, 1000);
  }

  get f() {
    return this.profileForm.controls;
  }
}
