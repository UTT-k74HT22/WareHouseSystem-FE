import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  features = [
    {
      icon: 'fa-solid fa-boxes-stacked',
      title: 'Quản lý tồn kho',
      description: 'Theo dõi tồn kho theo thời gian thực với độ chính xác cao, hỗ trợ nhiều đơn vị tính và lô hàng.'
    },
    {
      icon: 'fa-solid fa-warehouse',
      title: 'Quản lý kho hàng',
      description: 'Tổ chức và giám sát nhiều kho hàng, vị trí lưu trữ, quản lý công suất và luồng hàng hóa.'
    },
    {
      icon: 'fa-solid fa-file-contract',
      title: 'Quản lý đơn hàng',
      description: 'Xử lý đơn mua hàng và đơn bán hàng, tự động hóa quy trình tạo và theo dõi đơn hàng.'
    },
    {
      icon: 'fa-solid fa-chart-line',
      title: 'Báo cáo & Phân tích',
      description: 'Trực quan hóa dữ liệu kho với các biểu đồ và báo cáo chi tiết, hỗ trợ ra quyết định nhanh chóng.'
    },
    {
      icon: 'fa-solid fa-truck-fast',
      title: 'Quản lý vận chuyển',
      description: 'Liên kết với các đơn vị vận chuyển, theo dõi trạng thái giao hàng và quản lý lộ trình vận chuyển.'
    },
    {
      icon: 'fa-solid fa-shield-halved',
      title: 'Bảo mật & Phân quyền',
      description: 'Hệ thống phân quyền đa cấp, kiểm soát truy cập theo vai trò, đảm bảo an toàn dữ liệu.'
    }
  ];

  stats = [
    { value: '10,000+', label: 'Đơn hàng/ngày', icon: 'fa-solid fa-truck-fast' },
    { value: '99.9%', label: 'Độ chính xác', icon: 'fa-solid fa-check-double' },
    { value: '500+', label: 'Doanh nghiệp', icon: 'fa-solid fa-building' },
    { value: '24/7', label: 'Hỗ trợ', icon: 'fa-solid fa-headset' }
  ];

  futureModules = [
    {
      icon: 'fa-solid fa-users',
      title: 'HRM - Quản lý nhân sự',
      description: 'Quản lý hồ sơ nhân viên, chấm công, tính lương, đánh giá hiệu suất và tuyển dụng.'
    },
    {
      icon: 'fa-solid fa-handshake',
      title: 'CRM - Quản lý khách hàng',
      description: 'Quản lý quan hệ khách hàng, theo dõi tương tác, quản lý cơ hội bán hàng và dịch vụ sau bán.'
    },
    {
      icon: 'fa-solid fa-money-bill-transfer',
      title: 'ERP - Kế toán tài chính',
      description: 'Tích hợp kế toán tổng hợp, quản lý dòng tiền, lập báo cáo tài chính và quản lý ngân sách.'
    },
    {
      icon: 'fa-solid fa-industry',
      title: 'MES - Quản lý sản xuất',
      description: 'Lập kế hoạch sản xuất, theo dõi tiến độ, quản lý công xưởng và tối ưu hóa quy trình sản xuất.'
    },
    {
      icon: 'fa-solid fa-project-diagram',
      title: 'Dự án & Task',
      description: 'Quản lý dự án, phân công công việc, theo dõi tiến độ và cộng tác làm việc nhóm hiệu quả.'
    },
    {
      icon: 'fa-solid fa-headset',
      title: 'Helpdesk - Hỗ trợ',
      description: 'Hệ thống ticket hỗ trợ khách hàng nội bộ, quản lý sự cố và theo dõi giải quyết yêu cầu.'
    }
  ];

  testimonials = [
    {
      avatar: 'NV',
      name: 'Nguyễn Văn An',
      role: 'Giám đốc Logistics',
      company: 'Công ty TNHH TM&DV Vận Tải An Phát',
      content: 'WMS giúp chúng tôi giảm 40% thời gian xử lý đơn hàng và tăng độ chính xác lên 99.7%. Hệ thống rất dễ sử dụng và đội ngũ hỗ trợ rất chuyên nghiệp.',
      rating: 5
    },
    {
      avatar: 'TH',
      name: 'Trần Thị Hương',
      role: 'Quản lý Kho hàng',
      company: 'Nhà sách Minh Trí',
      content: 'Từ khi sử dụng WMS, việc quản lý hàng nghìn đầu sách trở nên đơn giản hơn bao giờ hết. Chúng tôi có thể theo dõi tồn kho và xuất nhập kho chỉ trong vài cú click.',
      rating: 5
    },
    {
      avatar: 'LH',
      name: 'Lê Hoàng Nam',
      role: 'CEO',
      company: 'Startup Công nghệ LogiTech',
      content: 'Giải pháp WMS linh hoạt, có thể tùy chỉnh theo nhu cầu riêng của doanh nghiệp. API mạnh mẽ giúp tích hợp dễ dàng với hệ thống hiện có.',
      rating: 5
    }
  ];

  partners = [
    { name: 'Viettel', logo: 'fa-solid fa-tower-cell' },
    { name: 'VNPost', logo: 'fa-solid fa-envelope' },
    { name: 'GHTK', logo: 'fa-solid fa-truck' },
    { name: 'GHN', logo: 'fa-solid fa-truck-fast' },
    { name: 'Ninja Van', logo: 'fa-solid fa-box' }
  ];

  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
