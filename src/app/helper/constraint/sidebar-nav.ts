export interface SidebarNavItem {
  label: string;
  route: string;
  iconClass: string;
}

export interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}

export const SIDEBAR_NAV_SECTIONS: SidebarNavSection[] = [
  {
    title: 'Tổng quan',
    items: [
      { label: 'Dashboard', route: '/dashboard', iconClass: 'fa-solid fa-chart-pie' },
      { label: 'Theo dõi tiến trình', route: '/job-tracker', iconClass: 'fa-solid fa-list-check' },
      { label: 'Kho hàng', route: '/warehouse', iconClass: 'fa-solid fa-warehouse' },
      { label: 'Vị trí kho', route: '/location', iconClass: 'fa-solid fa-location-dot' },
      { label: 'Trợ lý AI', route: '/chatbot', iconClass: 'fa-solid fa-robot' }
    ]
  },
  {
    title: 'Danh mục',
    items: [
      { label: 'Sản phẩm', route: '/product', iconClass: 'fa-solid fa-box' },
      { label: 'Danh mục SP', route: '/category', iconClass: 'fa-solid fa-layer-group' },
      { label: 'Đơn vị tính', route: '/uom', iconClass: 'fa-solid fa-scale-balanced' },
      { label: 'Đối tác (NCC/KH)', route: '/business-partner', iconClass: 'fa-solid fa-handshake' },
      { label: 'Lô hàng', route: '/batch', iconClass: 'fa-solid fa-tags' }
    ]
  },
  {
    title: 'Vận hành',
    items: [
      { label: 'Đơn mua hàng', route: '/purchase-order', iconClass: 'fa-solid fa-cart-shopping' },
      { label: 'Đơn bán hàng', route: '/sales-order', iconClass: 'fa-solid fa-money-bill-wave' },
      { label: 'Nhập kho', route: '/inbound', iconClass: 'fa-solid fa-boxes-packing' },
      { label: 'Xuất kho', route: '/outbound', iconClass: 'fa-solid fa-truck-fast' }
    ]
  },
  {
    title: 'Nhân sự',
    items: [
      { label: 'Nhân viên', route: '/employee', iconClass: 'fa-solid fa-user-tie' },
      { label: 'Người dùng', route: '/users', iconClass: 'fa-solid fa-users' },
      { label: 'Phân quyền', route: '/rbac', iconClass: 'fa-solid fa-shield-halved' }
    ]
  },
  {
    title: 'Kho hàng',
    items: [
      { label: 'Tồn kho', route: '/inventory', iconClass: 'fa-solid fa-chart-column' },
      { label: 'Lịch sử giao dịch', route: '/stock-movements', iconClass: 'fa-solid fa-clock-rotate-left' },
      { label: 'Điều chỉnh kho', route: '/stock-adjustments', iconClass: 'fa-solid fa-sliders' },
      { label: 'Chuyển vị trí', route: '/stock-transfers', iconClass: 'fa-solid fa-right-left' }
    ]
  }
];
