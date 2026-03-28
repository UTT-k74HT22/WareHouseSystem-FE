import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { Subject, forkJoin, interval, of } from 'rxjs';
import { catchError, map, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AuthState } from '../../dto/response/Auth/AuthState';
import {
  DashboardActivityResponse,
  DashboardAlertResponse,
  DashboardJobResponse,
  DashboardOverviewResponse,
  DashboardResponse,
  DashboardWarehouseCapacityResponse
} from '../../dto/response/Dashboard/DashboardResponse';
import { WareHouseResponse } from '../../dto/response/WareHouse/WareHouseResponse';
import { AuthService } from '../../service/AuthService/auth-service.service';
import { BackgroundJobService } from '../../service/BackgroundJobService/background-job.service';
import { DashboardService } from '../../service/DashboardService/dashboard.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { WarehouseService } from '../../service/WarehouseService/warehouse.service';

Chart.register(...registerables);

const REFRESH_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ─── Auth ────────────────────────────────────────────────────────────────
  authState: AuthState | null = null;
  username = '';
  roles: string[] = [];

  // ─── UI state ────────────────────────────────────────────────────────────
  loading = true;
  generatedAt = '';
  refreshCountdown = REFRESH_INTERVAL_MS / 1000;

  today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ─── Warehouse filter ────────────────────────────────────────────────────
  warehouses: WareHouseResponse[] = [];
  selectedWarehouseId: string | undefined = undefined;

  // ─── Trend range toggle ──────────────────────────────────────────────────
  readonly trendRangeOptions = [7, 14, 30] as const;
  selectedDays: 7 | 14 | 30 = 7;

  // ─── Data ────────────────────────────────────────────────────────────────
  overview: DashboardOverviewResponse | null = null;
  alerts: DashboardAlertResponse[] = [];
  activities: DashboardActivityResponse[] = [];
  recentJobs: DashboardJobResponse[] = [];

  kpi = {
    availableQuantity: 0,
    pendingInbound: 0,
    pendingOutbound: 0,
    runningJobs: 0,
    lowStockSkuCount: 0,
    expiringBatchCount: 0,
    nearCapacityWarehouseCount: 0,
    failedJobsToday: 0
  };

  secondaryStats = {
    totalOnHand: 0,
    totalReserved: 0,
    totalQuarantine: 0,
    activeWarehouses: 0
  };

  // ─── Charts ──────────────────────────────────────────────────────────────
  lineChartType = 'line' as const;
  lineChartData: ChartData<'line'> = this.buildLineChartData([], [], []);
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12 }, usePointStyle: true, pointStyleWidth: 10, padding: 16 }
      },
      tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        position: 'left',
        title: { display: true, text: 'Số lượt', font: { size: 11 } },
        ticks: { font: { size: 11 }, precision: 0 },
        grid: { color: 'rgba(0,0,0,0.05)' },
        min: 0
      }
    }
  };

  doughnutType = 'doughnut' as const;
  doughnutData: ChartData<'doughnut'> = this.buildDoughnutData([0, 0, 0, 0]);
  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 12 }, usePointStyle: true, pointStyleWidth: 10, padding: 14 }
      },
      tooltip: { backgroundColor: '#1f2937', padding: 10, cornerRadius: 8 }
    }
  };

  barChartType = 'bar' as const;
  barChartData: ChartData<'bar'> = this.buildBarChartData([], [], []);
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const cap = this._capacities[ctx.dataIndex];
            const parsedX = typeof ctx.parsed?.x === 'number' ? ctx.parsed.x : 0;
            if (cap) {
              return ` ${parsedX.toFixed(1)}% · ${cap.occupied_locations}/${cap.total_locations} vị trí`;
            }
            return ` ${parsedX.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        max: 100, min: 0,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { callback: (v) => v + '%', font: { size: 11 } }
      },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };

  // keep a reference for tooltip callback
  private _capacities: DashboardWarehouseCapacityResponse[] = [];
  private readonly destroy$ = new Subject<void>();
  private readonly manualRefresh$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private backgroundJobService: BackgroundJobService,
    private warehouseService: WarehouseService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.authState = state;
        this.username = state.username || 'Guest';
        this.roles = state.roles;
      });

    this.loadWarehouses();
    this.startPolling();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Public actions ──────────────────────────────────────────────────────

  onWarehouseChange(): void {
    this.manualRefresh$.next();
  }

  onDaysChange(days: 7 | 14 | 30): void {
    this.selectedDays = days;
    this.manualRefresh$.next();
  }

  navigateTo(path: string, queryParams?: Record<string, string>): void {
    this.router.navigate([path], queryParams ? { queryParams } : {});
  }

  hasHighSeverityAlerts(): boolean {
    return this.alerts.some((alert) => alert.severity === 'HIGH');
  }

  isAdmin(): boolean { return this.roles.includes('ADMIN'); }
  isManager(): boolean { return this.roles.includes('MANAGER'); }

  // ─── Chart builders (immutable pattern for change detection) ────────────

  private buildLineChartData(
    labels: string[],
    inbound: number[],
    outbound: number[]
  ): ChartData<'line'> {
    return {
      labels: [...labels],
      datasets: [
        {
          label: 'Lượt nhập kho',
          data: [...inbound],
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79,70,229,0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointBackgroundColor: '#4f46e5',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Lượt xuất kho',
          data: [...outbound],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.06)',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }

  private buildDoughnutData(values: number[]): ChartData<'doughnut'> {
    return {
      labels: ['PO mở', 'SO mở', 'Phiếu nhập chờ', 'Phiếu xuất chờ'],
      datasets: [{
        data: [...values],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#2563eb', '#d97706', '#dc2626'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  private buildBarChartData(
    labels: string[],
    data: number[],
    colors: string[]
  ): ChartData<'bar'> {
    return {
      labels: [...labels],
      datasets: [{
        label: 'Vị trí đã dùng (%)',
        data: [...data],
        backgroundColor: [...colors],
        borderRadius: 6,
        borderSkipped: false
      }]
    };
  }

  // ─── Data loading ─────────────────────────────────────────────────────────

  private loadWarehouses(): void {
    this.warehouseService.getList()
      .pipe(catchError(() => of({ success: false, data: [] as WareHouseResponse[] })))
      .subscribe((res) => {
        this.warehouses = res.success ? (res.data as WareHouseResponse[]) : [];
      });
  }

  private startPolling(): void {
    // merge timer + manual triggers
    const trigger$ = interval(REFRESH_INTERVAL_MS).pipe(
      startWith(0),
      takeUntil(this.destroy$)
    );

    trigger$.pipe(
      switchMap(() => this.fetchSnapshot()),
      takeUntil(this.destroy$)
    ).subscribe();

    this.manualRefresh$.pipe(
      tap(() => { this.loading = true; }),
      switchMap(() => this.fetchSnapshot()),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private fetchSnapshot() {
    return forkJoin({
      snapshot: this.dashboardService.getSnapshot(
        this.selectedDays, 8, 5, this.selectedWarehouseId
      ),
      jobs: this.backgroundJobService.getMyJobs(0, 5).pipe(
        map((res) => res.success ? res.data.content : []),
        catchError(() => of([]))
      )
    }).pipe(
      tap(({ snapshot, jobs }) => {
        this.applySnapshot(snapshot.data, jobs as DashboardJobResponse[]);
        this.loading = false;
        this.refreshCountdown = REFRESH_INTERVAL_MS / 1000;
      }),
      catchError((err) => {
        this.loading = false;
        this.toastr.error(err?.error?.message || 'Không tải được dữ liệu dashboard.');
        return of(null);
      })
    );
  }

  private startCountdown(): void {
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshCountdown = Math.max(0, this.refreshCountdown - 1);
    });
  }

  private applySnapshot(snapshot: DashboardResponse, jobs: DashboardJobResponse[]): void {
    this.overview = snapshot.overview;
    this.alerts = snapshot.alerts || [];
    this.activities = snapshot.recent_activities || [];
    this.recentJobs = jobs.length > 0 ? jobs : (snapshot.recent_jobs || []);
    this.generatedAt = new Date(snapshot.generated_at).toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const ov = snapshot.overview;

    // ── KPI ──────────────────────────────────────────────────────────────
    this.kpi = {
      availableQuantity: Number(ov?.total_available_quantity ?? 0),
      pendingInbound:    Number(ov?.pending_inbound_receipts ?? 0),
      pendingOutbound:   Number(ov?.pending_outbound_shipments ?? 0),
      runningJobs:       Number(ov?.running_jobs ?? 0),
      lowStockSkuCount:          Number(ov?.low_stock_sku_count ?? 0),
      expiringBatchCount:        Number(ov?.expiring_batch_count ?? 0),
      nearCapacityWarehouseCount:Number(ov?.near_capacity_warehouse_count ?? 0),
      failedJobsToday:           Number(ov?.failed_jobs_today ?? 0)
    };

    // ── Secondary stats ──────────────────────────────────────────────────
    this.secondaryStats = {
      totalOnHand:      Number(ov?.total_on_hand_quantity ?? 0),
      totalReserved:    Number(ov?.total_reserved_quantity ?? 0),
      totalQuarantine:  Number(ov?.total_on_hand_quantity ?? 0) - Number(ov?.total_available_quantity ?? 0) - Number(ov?.total_reserved_quantity ?? 0),
      activeWarehouses: Number(ov?.active_warehouse_count ?? 0)
    };

    // ── Line chart (new reference for change detection) ──────────────────
    const trend = snapshot.trend || [];
    this.lineChartData = this.buildLineChartData(
      trend.map((p) => p.label),
      trend.map((p) => Number(p.inbound_count ?? 0)),
      trend.map((p) => Number(p.outbound_count ?? 0))
    );

    // ── Doughnut chart ───────────────────────────────────────────────────
    this.doughnutData = this.buildDoughnutData([
      Number(ov?.open_purchase_orders ?? 0),
      Number(ov?.open_sales_orders ?? 0),
      Number(ov?.pending_inbound_receipts ?? 0),
      Number(ov?.pending_outbound_shipments ?? 0)
    ]);

    // ── Bar chart ────────────────────────────────────────────────────────
    const capacities = snapshot.warehouse_capacities || [];
    this._capacities = capacities;
    this.barChartData = this.buildBarChartData(
      capacities.map((c) => c.warehouse_name),
      capacities.map((c) => Number(c.utilization_percent ?? 0)),
      capacities.map((c) => this.getCapacityColor(Number(c.utilization_percent ?? 0)))
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private getCapacityColor(pct: number): string {
    if (pct >= 80) return '#ef4444';
    if (pct >= 50) return '#f59e0b';
    return '#10b981';
  }

  getAlertIcon(code: string, severity: string): string {
    const iconMap: Record<string, string> = {
      LOW_STOCK:         'fa-solid fa-box-open',
      EXPIRING_BATCH:    'fa-solid fa-clock-rotate-left',
      WAREHOUSE_CAPACITY:'fa-solid fa-warehouse',
      FAILED_JOBS:       'fa-solid fa-circle-xmark'
    };
    return iconMap[code] ?? (severity === 'HIGH' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info');
  }

  getAlertRoute(code: string): string | null {
    const routeMap: Record<string, string> = {
      LOW_STOCK:         '/inventory',
      EXPIRING_BATCH:    '/batch',
      WAREHOUSE_CAPACITY:'/warehouse',
      FAILED_JOBS:       '/job-tracker'
    };
    return routeMap[code] ?? null;
  }

  getActivityType(activity: DashboardActivityResponse): string {
    if (activity.movement_type === 'INBOUND')  return 'in';
    if (activity.movement_type === 'OUTBOUND') return 'out';
    if (activity.movement_type === 'TRANSFER_IN' || activity.movement_type === 'TRANSFER_OUT') return 'tr';
    return 'adj';
  }

  getActivityIcon(activity: DashboardActivityResponse): string {
    const iconMap: Record<string, string> = {
      in:  'fa-solid fa-arrow-down',
      out: 'fa-solid fa-arrow-up',
      adj: 'fa-solid fa-sliders',
      tr:  'fa-solid fa-right-left'
    };
    return iconMap[this.getActivityType(activity)];
  }

  getActivityQuantity(activity: DashboardActivityResponse): string {
    const qty = Number(activity.quantity_change ?? 0);
    return `${qty >= 0 ? '+' : ''}${qty.toLocaleString('vi-VN')}`;
  }

  isPositiveActivity(activity: DashboardActivityResponse): boolean {
    return Number(activity.quantity_change ?? 0) >= 0;
  }

  getActivityTime(activity: DashboardActivityResponse): string {
    return new Date(activity.movement_date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  getActivityDescription(activity: DashboardActivityResponse): string {
    const productLabel = [activity.product_sku, activity.product_name].filter(Boolean).join(' · ');
    const ref = activity.reference_number ? ` · ${activity.reference_number}` : '';
    return `${activity.warehouse_name} / ${activity.location_name} · ${productLabel}${ref}`;
  }

  getJobStatusClass(job: DashboardJobResponse): string {
    if (job.status === 'COMPLETED') return 'job-success';
    if (job.status === 'FAILED' || job.status === 'CANCELLED') return 'job-error';
    return 'job-running';
  }

  getJobStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      COMPLETED:      'Hoàn tất',
      FAILED:         'Lỗi',
      CANCELLED:      'Đã huỷ',
      PENDING:        'Chờ xử lý',
      VALIDATING:     'Đang kiểm tra',
      PROCESSING:     'Đang xử lý',
      GENERATING_FILE:'Tạo file',
      UPLOADING:      'Đang upload'
    };
    return labelMap[status] ?? status;
  }

  isDoughnutEmpty(): boolean {
    return this.doughnutData.datasets[0].data.every((v) => Number(v) === 0);
  }
}
