import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { AuthState } from '../../dto/response/Auth/AuthState';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  authState: AuthState | null = null;
  username: string = '';
  roles: string[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Lấy thông tin user từ AuthService
    this.authService.authState$.subscribe(state => {
      this.authState = state;
      this.username = state.username || 'Guest';
      this.roles = state.roles;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.roles.includes('ADMIN');
  }

  isManager(): boolean {
    return this.roles.includes('MANAGER');
  }
}
