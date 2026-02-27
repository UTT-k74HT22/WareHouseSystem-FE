import { Component, OnInit } from '@angular/core';
import { UnitsOfMeasureResponse } from '../../dto/response/UOM/UnitsOfMeasureResponse';
import { UOMService } from '../../service/UOMService/uom.service';
import { ToastrService } from '../../service/SystemService/toastr.service';
import { CreateUOMRequest } from '../../dto/request/UOM/CreateUOMRequest';
import { UpdateUOMRequest } from '../../dto/request/UOM/UpdateUOMRequest';
import { MOCK_UOMS } from '../../helper/mock/mock-data';

@Component({
  selector: 'app-uom',
  templateUrl: './uom.component.html',
  styleUrls: ['./uom.component.css']
})
export class UomComponent implements OnInit {
  uomList: UnitsOfMeasureResponse[] = [];
  filteredList: UnitsOfMeasureResponse[] = [];
  loading = false;
  searchKeyword = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  selectedUOM: UnitsOfMeasureResponse | null = null;
  uomToDelete: UnitsOfMeasureResponse | null = null;

  createForm: CreateUOMRequest = { code: '', name: '' };
  editForm: UpdateUOMRequest = {};

  constructor(
    private uomService: UOMService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadUOMs();
  }

  loadUOMs(): void {
    this.loading = true;
    this.uomService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.uomList = res.data;
          this.applyFilter();
        }
        this.loading = false;
      },
      error: () => {
        this.uomList = MOCK_UOMS;
        this.applyFilter();
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.filteredList = this.uomList.filter(u =>
      !this.searchKeyword ||
      u.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
      u.code.toLowerCase().includes(this.searchKeyword.toLowerCase())
    );
  }

  onSearch(): void { this.applyFilter(); }
  onResetFilter(): void { this.searchKeyword = ''; this.applyFilter(); }

  openCreateModal(): void {
    this.createForm = { code: '', name: '' };
    this.showCreateModal = true;
  }

  onCreateSubmit(): void {
    this.uomService.create(this.createForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Tạo đơn vị tính thành công!');
          this.showCreateModal = false;
          this.loadUOMs();
        }
      }
    });
  }

  openEditModal(uom: UnitsOfMeasureResponse): void {
    this.selectedUOM = uom;
    this.editForm = { name: uom.name, description: uom.description ?? undefined };
    this.showEditModal = true;
  }

  onEditSubmit(): void {
    if (!this.selectedUOM) return;
    this.uomService.update(this.selectedUOM.id, this.editForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Cập nhật đơn vị tính thành công!');
          this.showEditModal = false;
          this.loadUOMs();
        }
      }
    });
  }

  openDeleteConfirm(uom: UnitsOfMeasureResponse): void {
    this.uomToDelete = uom;
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    if (!this.uomToDelete) return;
    this.uomService.delete(this.uomToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success('Xoá đơn vị tính thành công!');
          this.showDeleteConfirm = false;
          this.loadUOMs();
        }
      }
    });
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.selectedUOM = null;
    this.uomToDelete = null;
  }
}
