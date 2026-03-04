import { Component } from '@angular/core';
import { ToastrService } from '../../../service/SystemService/toastr.service';

interface SettingToggle {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  selectedLanguage = 'vi';
  selectedTheme = 'light';

  notificationSettings: SettingToggle[] = [
    {
      key: 'email_notifications',
      label: 'Thông báo qua email',
      description: 'Nhận thông báo quan trọng qua email đã đăng ký',
      icon: 'fa-regular fa-envelope',
      enabled: true
    },
    {
      key: 'push_notifications',
      label: 'Thông báo đẩy',
      description: 'Nhận thông báo trực tiếp trên trình duyệt',
      icon: 'fa-regular fa-bell',
      enabled: true
    },
    {
      key: 'order_updates',
      label: 'Cập nhật đơn hàng',
      description: 'Thông báo khi có thay đổi trạng thái đơn hàng',
      icon: 'fa-solid fa-boxes-packing',
      enabled: true
    },
    {
      key: 'inventory_alerts',
      label: 'Cảnh báo tồn kho',
      description: 'Thông báo khi hàng tồn kho dưới mức tối thiểu',
      icon: 'fa-solid fa-triangle-exclamation',
      enabled: false
    }
  ];

  displaySettings: SettingToggle[] = [
    {
      key: 'compact_view',
      label: 'Chế độ thu gọn',
      description: 'Hiển thị nhiều nội dung hơn trên một trang',
      icon: 'fa-solid fa-compress',
      enabled: false
    },
    {
      key: 'show_tooltips',
      label: 'Hiển thị gợi ý',
      description: 'Hiển thị tooltip khi hover qua các nút và biểu tượng',
      icon: 'fa-regular fa-circle-question',
      enabled: true
    }
  ];

  constructor(private toastr: ToastrService) {}

  toggleSetting(setting: SettingToggle): void {
    setting.enabled = !setting.enabled;
  }

  saveSettings(): void {
    this.toastr.success('Thành công', 'Cài đặt đã được lưu');
  }

  resetSettings(): void {
    this.notificationSettings.forEach(s => s.enabled = true);
    this.displaySettings.forEach(s => {
      s.enabled = s.key === 'show_tooltips';
    });
    this.selectedLanguage = 'vi';
    this.selectedTheme = 'light';
    this.toastr.info('Thông báo', 'Đã khôi phục cài đặt mặc định');
  }
}
