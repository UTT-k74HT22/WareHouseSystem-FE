import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './authenticate/login/login.component';
import { RegisterComponent } from './authenticate/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WarehouseComponent } from './pages/warehouse/warehouse.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AuthGuard } from './security/guards/auth.guard';
import { GuestGuard } from './security/guards/guest.guard';
import {LocationComponent} from "./pages/location/location/location.component";

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Routes cho user chưa đăng nhập - sử dụng GuestGuard
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

  // Routes yêu cầu đăng nhập - sử dụng AuthGuard
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
    path: 'warehouse',
    component: WarehouseComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quản lý kho',
      subtitle: 'Danh sách và thông tin các kho hàng'
    }
  },
  {
    path: 'location',
    component: LocationComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Quản lý vị trí',
      subtitle: 'Danh sách và thông tin các vị trí trong kho'
    }
  },

  // TODO: Thêm routes khác với role-based protection
  // Ví dụ:
  // {
  //   path: 'admin',
  //   component: AdminComponent,
  //   canActivate: [AuthGuard],
  //   data: { roles: ['ADMIN'] } // Yêu cầu role ADMIN
  // },

  // 404 Page - Not Found
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
