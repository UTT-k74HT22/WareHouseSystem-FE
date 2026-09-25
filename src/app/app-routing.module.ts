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
      subtitle: 'Tong quan hoat dong kho hom nay'
    }
  },
  {
    path: 'job-tracker',
    component: JobTrackerComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Theo doi tien trinh',
      subtitle: 'Tien trinh export, import va background jobs'
    }
  },
  {
    path: 'chatbot',
    component: ChatBotComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Tro ly AI',
      subtitle: 'Tro ly ao ho tro van hanh kho hang'
    }
  },
  {
    path: 'warehouse',
    component: WarehouseComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quan ly kho',
      subtitle: 'Danh sach va thong tin cac kho hang',
      permissions: routePermissions.warehouse
    }
  },
  {
    path: 'location',
    component: LocationComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quan ly vi tri',
      subtitle: 'Danh sach va thong tin cac vi tri trong kho',
      permissions: routePermissions.location
    }
  },
  {
    path: 'product',
    component: ProductComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'San pham',
      subtitle: 'Danh muc san pham',
      permissions: routePermissions.product
    }
  },
  {
    path: 'category',
    component: CategoryComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Danh muc',
      subtitle: 'Quan ly danh muc san pham',
      permissions: routePermissions.category
    }
  },
  {
    path: 'business-partner',
    component: BusinessPartnerComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Doi tac',
      subtitle: 'Nha cung cap va khach hang',
      permissions: routePermissions.businessPartner
    }
  },
  {
    path: 'uom',
    component: UomComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Don vi tinh',
      subtitle: 'Don vi do luong',
      permissions: routePermissions.unitOfMeasure
    }
  },
  {
    path: 'batch',
    component: BatchComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Lo hang',
      subtitle: 'Quan ly lo hang va han su dung',
      permissions: routePermissions.batch
    }
  },
  {
    path: 'purchase-order',
    component: PurchaseOrderComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Don mua hang',
      subtitle: 'Quan ly don dat hang nha cung cap',
      permissions: routePermissions.purchaseOrder
    }
  },
  {
    path: 'sales-order',
    component: SalesOrderComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Don ban hang',
      subtitle: 'Quan ly don ban hang khach hang',
      permissions: routePermissions.salesOrder
    }
  },
  {
    path: 'inbound',
    component: InboundComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Nhap kho',
      subtitle: 'Phieu nhap kho tu nha cung cap',
      permissions: routePermissions.inboundReceipt
    }
  },
  {
    path: 'outbound',
    component: OutboundComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Xuat kho',
      subtitle: 'Phieu xuat kho giao khach hang',
      permissions: routePermissions.outboundShipment
    }
  },
  {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Ton kho',
      subtitle: 'Theo doi ton kho theo vi tri',
      permissions: routePermissions.inventory
    }
  },
  {
    path: 'stock-movements',
    component: StockMovementsComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Lich su kho',
      subtitle: 'Toan bo giao dich kho',
      permissions: routePermissions.stockMovement
    }
  },
  {
    path: 'stock-adjustments',
    component: StockAdjustmentsComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Dieu chinh kho',
      subtitle: 'Phieu dieu chinh ton kho',
      permissions: routePermissions.stockAdjustment
    }
  },
  {
    path: 'stock-transfers',
    component: StockTransfersComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Chuyen kho',
      subtitle: 'Chuyen hang giua cac vi tri',
      permissions: routePermissions.stockTransfer
    }
  },
  {
    path: 'employee',
    component: EmployeeComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Nhan vien',
      subtitle: 'Quan ly thong tin nhan vien',
      permissions: routePermissions.employee
    }
  },
  {
    path: 'rbac',
    component: RbacComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Phan quyen',
      subtitle: 'Quan ly quyen va vai tro',
      permissions: routePermissions.rbac
    }
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quan ly nguoi dung',
      subtitle: 'Quan ly tai khoan va phan quyen',
      permissions: routePermissions.user
    }
  },
  {
    path: 'account/profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Thong tin ca nhan',
      subtitle: 'Quan ly ho so tai khoan'
    }
  },
  {
    path: 'account/change-password',
    component: ChangePasswordComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Doi mat khau',
      subtitle: 'Cap nhat mat khau tai khoan'
    }
  },
  {
    path: 'account/settings',
    component: SettingsComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Cai dat',
      subtitle: 'Tuy chinh trai nghiem su dung'
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
