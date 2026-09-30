import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './authenticate/landing/landing.component';
import { LoginComponent } from './authenticate/login/login.component';
import { RegisterComponent } from './authenticate/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WarehouseComponent } from './pages/warehouse/warehouse.component';
import { LocationComponent } from './pages/location/location/location.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ProductComponent } from './pages/product/product.component';
import { CategoryComponent } from './pages/category/category.component';
import { BusinessPartnerComponent } from './pages/business-partner/business-partner.component';
import { UomComponent } from './pages/uom/uom.component';
import { BatchComponent } from './pages/batch/batch.component';
import { PurchaseOrderComponent } from './pages/purchase-order/purchase-order.component';
import { SalesOrderComponent } from './pages/sales-order/sales-order.component';
import { InboundComponent } from './pages/inbound/inbound.component';
import { OutboundComponent } from './pages/outbound/outbound.component';
import { StockAdjustmentsComponent, StockMovementsComponent, StockTransfersComponent } from './pages/stock/stock.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { ProfileComponent } from './pages/account/profile/profile.component';
import { ChangePasswordComponent } from './pages/account/change-password/change-password.component';
import { ForgotPasswordComponent } from './pages/account/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/account/reset-password/reset-password.component';
import { SettingsComponent } from './pages/account/settings/settings.component';
import { VerifyOtpComponent } from './pages/account/verify-otp/verify-otp.component';
import { AuthGuard } from './security/guards/auth.guard';
import { GuestGuard } from './security/guards/guest.guard';
import { RbacComponent } from './pages/rbac/rbac.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { JobTrackerComponent } from './pages/job-tracker/job-tracker.component';
import { ChatBotComponent } from './pages/chatbot/chatbot.component';

const routePermissions = {
  warehouse: ['PERM_WAREHOUSE_READ'],
  location: ['PERM_LOCATION_READ'],
  product: ['PERM_PRODUCT_READ'],
  category: ['PERM_CATEGORY_READ'],
  businessPartner: ['PERM_BUSINESS_PARTNER_READ'],
  unitOfMeasure: ['PERM_UNIT_OF_MEASURE_READ'],
  batch: ['PERM_BATCH_READ'],
  purchaseOrder: ['PERM_PURCHASE_ORDER_READ'],
  salesOrder: ['PERM_SALES_ORDER_READ'],
  inboundReceipt: ['PERM_INBOUND_RECEIPT_READ'],
  outboundShipment: ['PERM_OUTBOUND_SHIPMENT_READ'],
  inventory: ['PERM_INVENTORY_READ'],
  stockMovement: ['PERM_STOCK_MOVEMENT_READ'],
  stockAdjustment: ['PERM_STOCK_ADJUSTMENT_READ'],
  stockTransfer: ['PERM_STOCK_TRANSFER_READ'],
  employee: ['PERM_EMPLOYEE_READ'],
  rbac: ['PERM_PERMISSION_READ', 'PERM_ROLE_READ'],
  user: ['PERM_USER_READ']
};

const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'home',
    component: LandingComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'verify-otp',
    component: VerifyOtpComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Dashboard',
      subtitle: 'Tổng quan hoạt động kho hôm nay'
    }
  },
  {
    path: 'job-tracker',
    component: JobTrackerComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Theo dõi tiến trình',
      subtitle: 'Tiến trình xuất, nhập và tác vụ nền'
    }
  },
  {
    path: 'chatbot',
    component: ChatBotComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Trợ lý AI',
      subtitle: 'Trợ lý ảo hỗ trợ vận hành kho hàng'
    }
  },
  {
    path: 'warehouse',
    component: WarehouseComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quản lý kho',
      subtitle: 'Danh sách và thông tin các kho hàng',
      permissions: routePermissions.warehouse
    }
  },
  {
    path: 'location',
    component: LocationComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quản lý vị trí',
      subtitle: 'Danh sách và thông tin các vị trí trong kho',
      permissions: routePermissions.location
    }
  },
  {
    path: 'product',
    component: ProductComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Sản phẩm',
      subtitle: 'Danh mục sản phẩm',
      permissions: routePermissions.product
    }
  },
  {
    path: 'category',
    component: CategoryComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Danh mục',
      subtitle: 'Quản lý danh mục sản phẩm',
      permissions: routePermissions.category
    }
  },
  {
    path: 'business-partner',
    component: BusinessPartnerComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Đối tác',
      subtitle: 'Nhà cung cấp và khách hàng',
      permissions: routePermissions.businessPartner
    }
  },
  {
    path: 'uom',
    component: UomComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Đơn vị tính',
      subtitle: 'Đơn vị đo lường',
      permissions: routePermissions.unitOfMeasure
    }
  },
  {
    path: 'batch',
    component: BatchComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Lô hàng',
      subtitle: 'Quản lý lô hàng và hạn sử dụng',
      permissions: routePermissions.batch
    }
  },
  {
    path: 'purchase-order',
    component: PurchaseOrderComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Đơn nhập hàng',
      subtitle: 'Quản lý đơn đặt hàng nhà cung cấp',
      permissions: routePermissions.purchaseOrder
    }
  },
  {
    path: 'sales-order',
    component: SalesOrderComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Đơn xuất hàng',
      subtitle: 'Quản lý đơn xuất hàng khách hàng',
      permissions: routePermissions.salesOrder
    }
  },
  {
    path: 'inbound',
    component: InboundComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Nhập kho',
      subtitle: 'Phiếu nhập kho từ nhà cung cấp',
      permissions: routePermissions.inboundReceipt
    }
  },
  {
    path: 'outbound',
    component: OutboundComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Xuất kho',
      subtitle: 'Phiếu xuất kho giao khách hàng',
      permissions: routePermissions.outboundShipment
    }
  },
  {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Tồn kho',
      subtitle: 'Theo dõi tồn kho theo vị trí',
      permissions: routePermissions.inventory
    }
  },
  {
    path: 'stock-movements',
    component: StockMovementsComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Lịch sử kho',
      subtitle: 'Toàn bộ giao dịch kho',
      permissions: routePermissions.stockMovement
    }
  },
  {
    path: 'stock-adjustments',
    component: StockAdjustmentsComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Điều chỉnh kho',
      subtitle: 'Phiếu điều chỉnh tồn kho',
      permissions: routePermissions.stockAdjustment
    }
  },
  {
    path: 'stock-transfers',
    component: StockTransfersComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Chuyển kho',
      subtitle: 'Chuyển hàng giữa các vị trí',
      permissions: routePermissions.stockTransfer
    }
  },
  {
    path: 'employee',
    component: EmployeeComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Nhân viên',
      subtitle: 'Quản lý thông tin nhân viên',
      permissions: routePermissions.employee
    }
  },
  {
    path: 'rbac',
    component: RbacComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Phân quyền',
      subtitle: 'Quản lý quyền và vai trò',
      permissions: routePermissions.rbac
    }
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quản lý người dùng',
      subtitle: 'Quản lý tài khoản và phân quyền',
      permissions: routePermissions.user
    }
  },
  {
    path: 'account/profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Thông tin cá nhân',
      subtitle: 'Quản lý hồ sơ tài khoản'
    }
  },
  {
    path: 'account/change-password',
    component: ChangePasswordComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Đổi mật khẩu',
      subtitle: 'Cập nhật mật khẩu tài khoản'
    }
  },
  {
    path: 'account/settings',
    component: SettingsComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Cài đặt',
      subtitle: 'Tùy chỉnh trải nghiệm sử dụng'
    }
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
