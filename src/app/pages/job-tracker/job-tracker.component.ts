import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { BackgroundJobSummaryResponse } from '../../dto/response/BackgroundJob/BackgroundJobSummaryResponse';
import { BackgroundJobService } from '../../service/BackgroundJobService/background-job.service';
import { ToastrService } from '../../service/SystemService/toastr.service';

@Component({
  selector: 'app-job-tracker',
  templateUrl: './job-tracker.component.html',
  styleUrls: ['./job-tracker.component.css']
})
export class JobTrackerComponent implements OnInit, OnDestroy {
  jobs: BackgroundJobSummaryResponse[] = [];
  loading = true;
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  downloadingJobId: string | null = null;
  actingJobId: string | null = null;

  // Server-side filter state (BE: BackgroundJobFilterRequest)
  filterJobCode = '';
  filterBusinessType = '';
  filterStatus = '';
  filterJobType = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly backgroundJobService: BackgroundJobService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(page: number): void {
    if (page < 0 || (this.totalPages > 0 && page >= this.totalPages)) {
      return;
    }

    this.page = page;
    this.loadJobs();
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadJobs();
  }

  clearFilter(): void {
    this.filterJobCode = '';
    this.filterBusinessType = '';
    this.filterStatus = '';
    this.filterJobType = '';
    this.page = 0;
    this.loadJobs();
  }

  private buildFilter(): { jobTypes?: string[]; statuses?: string[]; businessType?: string; jobCode?: string } {
    return {
      jobTypes: this.filterJobType ? [this.filterJobType] : [],
      statuses: this.filterStatus ? [this.filterStatus] : [],
      businessType: this.filterBusinessType?.trim() || undefined,
      jobCode: this.filterJobCode?.trim() || undefined
    };
  }

  refresh(): void {
    this.loadJobs();
  }

  getRowNumber(index: number): number {
    return this.page * this.size + index + 1;
  }

  getActionLabel(job: BackgroundJobSummaryResponse): string {
    return `${job.job_type} · ${job.business_type}`;
  }

  getStatusClass(job: BackgroundJobSummaryResponse): string {
    if (job.status === 'COMPLETED') {
      return 'badge-completed';
    }
    if (job.status === 'FAILED' || job.status === 'CANCELLED') {
      return 'badge-cancelled';
    }
    return 'badge-progress';
  }

  formatDateTime(value: string | null): string {
    if (!value) {
      return '--';
    }

    return new Date(value).toLocaleString('vi-VN', {
      hour12: false
    });
  }

  getFileLabel(job: BackgroundJobSummaryResponse): string {
    return job.result_file_name || '--';
  }

  canDownload(job: BackgroundJobSummaryResponse): boolean {
    return job.status === 'COMPLETED' && !!job.result_file_name;
  }

  canRetry(job: BackgroundJobSummaryResponse): boolean {
    return job.status === 'FAILED' || job.status === 'CANCELLED';
  }

  canCancel(job: BackgroundJobSummaryResponse): boolean {
    return job.status === 'PENDING' || job.status === 'VALIDATING'
      || job.status === 'PROCESSING' || job.status === 'GENERATING_FILE';
  }

  retry(job: BackgroundJobSummaryResponse): void {
    if (!this.canRetry(job) || this.actingJobId) {
      return;
    }
    this.actingJobId = job.id;
    this.backgroundJobService.retryJob(job.id).subscribe({
      next: () => {
        this.actingJobId = null;
        this.toastr.success('Đã gửi yêu cầu chạy lại job.');
        this.loadJobs();
      },
      error: (error) => {
        this.actingJobId = null;
        this.toastr.error(error?.error?.message || 'Chạy lại job thất bại.');
      }
    });
  }

  cancel(job: BackgroundJobSummaryResponse): void {
    if (!this.canCancel(job) || this.actingJobId) {
      return;
    }
    this.actingJobId = job.id;
    this.backgroundJobService.cancelJob(job.id).subscribe({
      next: () => {
        this.actingJobId = null;
        this.toastr.success('Đã hủy job.');
        this.loadJobs();
      },
      error: (error) => {
        this.actingJobId = null;
        this.toastr.error(error?.error?.message || 'Hủy job thất bại.');
      }
    });
  }

  download(job: BackgroundJobSummaryResponse): void {
    if (!this.canDownload(job)) {
      return;
    }

    this.downloadingJobId = job.id;
    this.backgroundJobService.getJobDownload(job.id).subscribe({
      next: (response) => {
        this.downloadingJobId = null;
        const downloadUrl = response.data.download_url;
        if (downloadUrl) {
          window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        } else {
          this.toastr.error('Không lấy được đường dẫn tải file.');
        }
      },
      error: (error) => {
        this.downloadingJobId = null;
        this.toastr.error(error?.error?.message || 'Tải file thất bại.');
      }
    });
  }

  private startPolling(): void {
    interval(15000).pipe(
      startWith(0),
      switchMap(() => this.backgroundJobService.getMyJobs(this.page, this.size, this.buildFilter())),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.jobs = response.data.content;
        this.page = response.data.page;
        this.size = response.data.size;
        this.totalPages = response.data.total_pages;
        this.totalElements = response.data.total_elements;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách tiến trình.');
      }
    });
  }

  private loadJobs(): void {
    this.loading = true;
    this.backgroundJobService.getMyJobs(this.page, this.size, this.buildFilter()).subscribe({
      next: (response) => {
        this.jobs = response.data.content;
        this.page = response.data.page;
        this.size = response.data.size;
        this.totalPages = response.data.total_pages;
        this.totalElements = response.data.total_elements;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error(error?.error?.message || 'Không tải được danh sách tiến trình.');
      }
    });
  }
}
