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
      return 'status-success';
    }
    if (job.status === 'FAILED' || job.status === 'CANCELLED') {
      return 'status-error';
    }
    return 'status-running';
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
      switchMap(() => this.backgroundJobService.getMyJobs(this.page, this.size)),
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
    this.backgroundJobService.getMyJobs(this.page, this.size).subscribe({
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
