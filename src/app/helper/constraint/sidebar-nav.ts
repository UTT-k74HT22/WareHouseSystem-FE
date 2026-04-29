export interface SidebarNavItem {
  label: string;
  route: string;
  iconClass: string;
  requiredPermissions?: string[];
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
      { label: 'Kho hàng', route: '/warehouse', iconClass: 'fa-solid fa-warehouse', requiredPermissions: ['PERM_WAREHOUSE_READ'] },
      { label: 'Vị trí kho', route: '/location', iconClass: 'fa-solid fa-location-dot', requiredPermissions: ['PERM_LOCATION_READ'] },
      { label: 'Trợ lý AI', route: '/chatbot', iconClass: 'fa-solid fa-robot' }
    ]
  },
  {
    title: 'Danh mục',
    items: [
      { label: 'Sản phẩm', route: '/product', iconClass: 'fa-solid fa-box', requiredPermissions: ['PERM_PRODUCT_READ'] },
      { label: 'Danh mục SP', route: '/category', iconClass: 'fa-solid fa-layer-group', requiredPermissions: ['PERM_CATEGORY_READ'] },
      { label: 'Đơn vị tính', route: '/uom', iconClass: 'fa-solid fa-scale-balanced', requiredPermissions: ['PERM_UNIT_OF_MEASURE_READ'] },
      { label: 'Đối tác (NCC/KH)', route: '/business-partner', iconClass: 'fa-solid fa-handshake', requiredPermissions: ['PERM_BUSINESS_PARTNER_READ'] },
      { label: 'Lô hàng', route: '/batch', iconClass: 'fa-solid fa-tags', requiredPermissions: ['PERM_BATCH_READ'] }
    ]
  },
  {
    title: 'Vận hành',
    items: [
      { label: 'Đơn mua hàng', route: '/purchase-order', iconClass: 'fa-solid fa-cart-shopping', requiredPermissions: ['PERM_PURCHASE_ORDER_READ'] },
      { label: 'Đơn bán hàng', route: '/sales-order', iconClass: 'fa-solid fa-money-bill-wave', requiredPermissions: ['PERM_SALES_ORDER_READ'] },
      { label: 'Nhập kho', route: '/inbound', iconClass: 'fa-solid fa-boxes-packing', requiredPermissions: ['PERM_INBOUND_RECEIPT_READ'] },
      { label: 'Xuất kho', route: '/outbound', iconClass: 'fa-solid fa-truck-fast', requiredPermissions: ['PERM_OUTBOUND_SHIPMENT_READ'] }
    ]
  },
  {
    title: 'Nhân sự',
    items: [
      { label: 'Nhân viên', route: '/employee', iconClass: 'fa-solid fa-user-tie', requiredPermissions: ['PERM_EMPLOYEE_READ'] },
      { label: 'Người dùng', route: '/users', iconClass: 'fa-solid fa-users', requiredPermissions: ['PERM_USER_READ'] },
      { label: 'Phân quyền', route: '/rbac', iconClass: 'fa-solid fa-shield-halved', requiredPermissions: ['PERM_PERMISSION_READ', 'PERM_ROLE_READ'] }
    ]
  },
  {
    title: 'Kho hàng',
    items: [
      { label: 'Tồn kho', route: '/inventory', iconClass: 'fa-solid fa-chart-column', requiredPermissions: ['PERM_INVENTORY_READ'] },
      { label: 'Lịch sử giao dịch', route: '/stock-movements', iconClass: 'fa-solid fa-clock-rotate-left', requiredPermissions: ['PERM_STOCK_MOVEMENT_READ'] },
      { label: 'Điều chỉnh kho', route: '/stock-adjustments', iconClass: 'fa-solid fa-sliders', requiredPermissions: ['PERM_STOCK_ADJUSTMENT_READ'] },
      { label: 'Chuyển vị trí', route: '/stock-transfers', iconClass: 'fa-solid fa-right-left', requiredPermissions: ['PERM_STOCK_TRANSFER_READ'] }
    ]
  }
];
