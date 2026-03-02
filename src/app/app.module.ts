import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgChartsModule } from 'ng2-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './authenticate/login/login.component';
import { RegisterComponent } from './authenticate/register/register.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ToastrModule } from 'ngx-toastr';
import { ToastrComponent } from './share/toastr/toastr.component';
import { JwtInterceptor } from './security/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './security/interceptors/error.interceptor';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SidebarComponent } from './share/layout/sidebar/sidebar.component';
import { HeaderComponent } from './share/layout/header/header.component';
import { FooterComponent } from './share/layout/footer/footer.component';
import { WarehouseComponent } from './pages/warehouse/warehouse.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { LocationComponent } from './pages/location/location/location.component';
// ── Master Data ──────────────────────────────────────────────
import { ProductComponent } from './pages/product/product.component';
import { CategoryComponent } from './pages/category/category.component';
import { BusinessPartnerComponent } from './pages/business-partner/business-partner.component';
import { UomComponent } from './pages/uom/uom.component';
import { BatchComponent } from './pages/batch/batch.component';
// ── Operations ───────────────────────────────────────────────
import { PurchaseOrderComponent } from './pages/purchase-order/purchase-order.component';
import { SalesOrderComponent } from './pages/sales-order/sales-order.component';
import { InboundComponent } from './pages/inbound/inbound.component';
import { OutboundComponent } from './pages/outbound/outbound.component';
// ── Stock & Inventory ────────────────────────────────────────
import { InventoryComponent } from './pages/inventory/inventory.component';
import { StockMovementsComponent, StockAdjustmentsComponent, StockTransfersComponent } from './pages/stock/stock.component';
// ── Employee ─────────────────────────────────────────────────
import { EmployeeComponent } from './pages/employee/employee.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ToastrComponent,
    DashboardComponent,
    SidebarComponent,
    HeaderComponent,
    FooterComponent,
    WarehouseComponent,
    NotFoundComponent,
    LocationComponent,
    // ── Master Data ──────────────────────────────────────────
    ProductComponent,
    CategoryComponent,
    BusinessPartnerComponent,
    UomComponent,
    BatchComponent,
    // ── Operations ───────────────────────────────────────────
    PurchaseOrderComponent,
    SalesOrderComponent,
    InboundComponent,
    OutboundComponent,
    // ── Stock & Inventory ────────────────────────────────────
    InventoryComponent,
    StockMovementsComponent,
    StockAdjustmentsComponent,
    StockTransfersComponent,
    // ── Employee ─────────────────────────────────────────────
    EmployeeComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    NgChartsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
      newestOnTop: true,
      tapToDismiss: true,
      maxOpened: 5,
      autoDismiss: true
    }),
  ],
  providers: [
    // Đăng ký JWT Interceptor - Thêm token vào headers
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    // Đăng ký Error Interceptor - Xử lý lỗi HTTP
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
