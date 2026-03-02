import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { AuthState } from '../../dto/response/Auth/AuthState';
import { ChartConfiguration, ChartData, Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  authState: AuthState | null = null;
  username = '';
  roles: string[] = [];

  today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── KPI ──────────────────────────────────────────────────────
  kpi = { totalOrders: 286, revenue: '142.6', pendingOrders: 23, completedToday: 17 };

  // ── LINE CHART: Revenue & order volume trend ─────────────────
  lineChartType = 'line' as const;
  lineChartData: ChartData<'line'> = {
    labels: ['T9/25', 'T10/25', 'T11/25', 'T12/25', 'T1/26', 'T2/26'],
    datasets: [
      {
        label: 'Doanh thu (triệu ₫)',
        data: [98, 125, 112, 148, 132, 142],
        borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.08)',
        fill: true, tension: 0.4, borderWidth: 2.5,
        pointBackgroundColor: '#4f46e5', pointRadius: 4, pointHoverRadius: 6
      },
      {
        label: 'Số đơn nhập kho',
        data: [42, 65, 48, 71, 55, 63],
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)',
        fill: false, tension: 0.4, borderWidth: 2,
        pointBackgroundColor: '#10b981', pointRadius: 4, pointHoverRadius: 6,
        yAxisID: 'y1'
      },
      {
        label: 'Số đơn xuất kho',
        data: [35, 58, 52, 64, 48, 56],
        borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)',
        fill: false, tension: 0.4, borderWidth: 2,
        pointBackgroundColor: '#f59e0b', pointRadius: 4, pointHoverRadius: 6,
        yAxisID: 'y1'
      }
    ]
  };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 }, usePointStyle: true, pointStyleWidth: 10, padding: 16 } },
      tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        position: 'left',
        title: { display: true, text: 'Doanh thu (triệu ₫)', font: { size: 11 } },
        ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' }
      },
      y1: {
        position: 'right',
        title: { display: true, text: 'Số đơn', font: { size: 11 } },
        ticks: { font: { size: 11 } }, grid: { drawOnChartArea: false }
      }
    }
  };

  // ── DOUGHNUT CHART: Order status ─────────────────────────────
  doughnutType = 'doughnut' as const;
  doughnutData: ChartData<'doughnut'> = {
    labels: ['Hoàn thành', 'Đang xử lý', 'Chờ xác nhận', 'Đã huỷ'],
    datasets: [{
      data: [128, 86, 43, 29],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      hoverBackgroundColor: ['#059669', '#2563eb', '#d97706', '#dc2626'],
      borderWidth: 2, borderColor: '#ffffff'
    }]
  };
  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 12 }, usePointStyle: true, pointStyleWidth: 10, padding: 14 } },
      tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 }
    }
  };

  // ── BAR CHART: Warehouse utilization ─────────────────────────
  barChartType = 'bar' as const;
  barChartData: ChartData<'bar'> = {
    labels: ['Kho Hà Nội', 'Kho TP.HCM', 'Kho Đà Nẵng', 'Kho Hải Phòng', 'Kho Cần Thơ'],
    datasets: [{
      label: 'Mức sử dụng (%)',
      data: [82, 65, 48, 73, 35],
      backgroundColor: ['#ef4444', '#4f46e5', '#10b981', '#f59e0b', '#10b981'],
      borderRadius: 6, borderSkipped: false
    }]
  };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937', padding: 10, cornerRadius: 8,
        callbacks: { label: (ctx) => ` ${ctx.parsed.x}% công suất` }
      }
    },
    scales: {
      x: { max: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: (v) => v + '%', font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };

  // ── ACTIVITY FEED ─────────────────────────────────────────────
  activities = [
    { time: '10:32', type: 'in',  desc: 'Nhập kho từ NCC Minh Hoàng',  qty: '+120 kg',   up: true  },
    { time: '09:15', type: 'out', desc: 'Xuất kho cho KH Viettel',     qty: '-45 thùng', up: false },
    { time: '08:45', type: 'adj', desc: 'Điều chỉnh tồn kho SP-042',   qty: '+5 cái',    up: true  },
    { time: '08:00', type: 'tr',  desc: 'Chuyển kho HN → TPHCM',       qty: '200 pcs',   up: true  },
    { time: '07:30', type: 'in',  desc: 'Nhập kho đơn PO-2026-0118',   qty: '+88 pcs',   up: true  }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
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

  isAdmin():   boolean { return this.roles.includes('ADMIN'); }
  isManager(): boolean { return this.roles.includes('MANAGER'); }
}
