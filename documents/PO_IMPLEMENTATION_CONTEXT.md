# Purchase Order & Purchase Order Line — FE Implementation Context
## Date: 2026-03-09
## Mục đích: Tài liệu context tổng hợp để implement màn PO & POL mà KHÔNG cần đọc lại toàn bộ dự án

---

## 📋 Mục lục
1. [Tổng quan hiện trạng](#1-tổng-quan-hiện-trạng)
2. [BE API Contract](#2-be-api-contract)
3. [Business Rules đã khóa](#3-business-rules-đã-khóa)
4. [FE Architecture & Patterns](#4-fe-architecture--patterns)
5. [Existing DTOs (FE)](#5-existing-dtos-fe)
6. [Existing Services (FE)](#6-existing-services-fe)
7. [Existing Component — PO (đã implement)](#7-existing-component--po-đã-implement)
8. [Shared UI System](#8-shared-ui-system)
9. [Dependent Services & DTOs](#9-dependent-services--dtos)
10. [Implementation Checklist — PO](#10-implementation-checklist--po)
11. [Implementation Checklist — POL](#11-implementation-checklist--pol)
12. [Error Handling Pattern](#12-error-handling-pattern)
13. [File Map — Cần tạo / sửa](#13-file-map--cần-tạo--sửa)

---

## 1. Tổng quan hiện trạng

### BE Status ✅
- **WHS-53**: PO CRUD — DONE (5 endpoints)
- **WHS-54**: PO Confirm — DONE (1 endpoint)
- **WHS-55**: PO Lines mutation — DONE (3 endpoints)

### FE Status 🔶
- PO component đã có **đầy đủ TS + HTML + CSS**
- PO service đã có
- POL service đã có
- DTOs request/response đã có
- **Cần review & polish** cho đồng bộ UI/UX và chuẩn nghiệp vụ

### Thứ tự implement khuyến nghị
1. **Phase 1**: Review & hoàn thiện PO (header) — list, create, detail, edit, delete, confirm
2. **Phase 2**: Review & hoàn thiện POL (lines) — add, edit, delete trong context PO detail

---

## 2. BE API Contract

### 2.1 Purchase Orders

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/purchase-orders` | Tạo PO (DRAFT) |
| `GET` | `/api/v1/purchase-orders` | List + filter + pagination |
| `GET` | `/api/v1/purchase-orders/{id}` | Lấy chi tiết PO |
| `PUT` | `/api/v1/purchase-orders/{id}` | Sửa PO (DRAFT only) |
| `DELETE` | `/api/v1/purchase-orders/{id}` | Xoá PO (DRAFT only) |
| `PUT` | `/api/v1/purchase-orders/{id}/confirm` | Xác nhận PO (DRAFT -> CONFIRMED) |

**Base URL**: `http://localhost:8080/api/v1/`

#### GET filter params:
```
purchaseOrderNumber, supplierId, warehouseId, status,
orderDateFrom, orderDateTo, expectedDeliveryDateFrom, expectedDeliveryDateTo,
sortBy, direction (ASC/DESC), page, size
```

#### Create Request:
```json
{
  "supplier_id": "uuid",
  "warehouse_id": "uuid",
  "order_date": "2026-03-07",
  "expected_delivery_date": "2026-03-10",   // optional, không được ở quá khứ
  "currency": "VND",                         // default VND
  "payment_terms": "NET 30",                 // optional
  "notes": "optional"
}
```

#### Update Request (DRAFT only):
```json
{
  "supplier_id": "uuid",
  "warehouse_id": "uuid",
  "order_date": "2026-03-07",
  "expected_delivery_date": "2026-03-10",
  "currency": "VND",
  "payment_terms": "NET 30",
  "notes": "optional"
}
```

#### Response:
```json
{
  "id": "uuid",
  "purchase_order_number": "PO-XXXXXX",
  "supplier_id": "uuid",
  "warehouse_id": "uuid",
  "status": "DRAFT|CONFIRMED|PARTIALLY_RECEIVED|COMPLETED|CANCELLED",
  "order_date": "2026-03-07",
  "expected_delivery_date": "2026-03-10",
  "sub_total": 0,
  "tax_amount": 0,
  "total_amount": 0,
  "currency": "VND",
  "payment_terms": "NET 30",
  "notes": "...",
  "confirmed_at": null,
  "confirmed_by": null,
  "created_at": "2026-03-07 10:00:00",
  "updated_at": "2026-03-07 10:00:00"
}
```

### 2.2 Purchase Order Lines

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/purchase-order-lines?purchaseOrderId=:id` | Lấy lines theo PO |
| `POST` | `/api/v1/purchase-order-lines` | Thêm line (DRAFT PO only) |
| `PUT` | `/api/v1/purchase-order-lines/{id}` | Sửa line (DRAFT PO only) |
| `DELETE` | `/api/v1/purchase-order-lines/{id}` | Xoá line (DRAFT PO only) |

#### Create Line Request:
```json
{
  "purchase_order_id": "uuid",
  "product_id": "uuid",
  "quantity_ordered": 10.00,
  "unit_price": 12.50,
  "notes": "optional (max 500 chars)"
}
```

#### Update Line Request:
```json
{
  "product_id": "uuid",          // optional, nếu đổi product
  "quantity_ordered": 20.00,
  "unit_price": 11.00,
  "notes": "optional"
}
```

#### Line Response:
```json
{
  "id": "uuid",
  "purchase_order_id": "uuid",
  "product_id": "uuid",
  "line_number": 1,
  "quantity_ordered": 20.00,
  "quantity_received": 0.00,
  "unit_price": 11.00,
  "line_total": 220.00,
  "notes": "...",
  "created_at": "2026-03-09 10:00:00",
  "updated_at": "2026-03-09 10:05:00"
}
```

### 2.3 Wrapper Response Format (tất cả API)
```typescript
interface ApiResponse<T> {
  success: boolean;
  error_code: string | null;
  message: string | null;
  data: T;
  field_errors: any;
  timestamp: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  is_first: boolean;
  is_last: boolean;
}
```

---

## 3. Business Rules đã khóa

### 3.1 PO Header Rules
- PO tạo ra luôn ở trạng thái `DRAFT`
- `purchaseOrderNumber` do BE auto-generate
- `subTotal`, `taxAmount`, `totalAmount` do BE tính — FE KHÔNG được tự tính/chỉnh
- Chỉ `DRAFT` mới được update/delete
- `expectedDeliveryDate` không được ở quá khứ
- `supplierId` và `warehouseId` phải tồn tại

### 3.2 PO Confirm Rules
- Chỉ `DRAFT` → `CONFIRMED`
- PO phải có **ít nhất 1 line** mới confirm được
- Khi confirm: status = CONFIRMED, set confirmedAt + confirmedBy
- BE sẽ recalculate subTotal từ tất cả lines

### 3.3 PO Line Rules
- Chỉ PO `DRAFT` mới cho create/update/delete line
- `quantity_ordered > 0`
- `unit_price >= 0`
- `quantity_received` do BE sở hữu (inbound receipt flow) — FE KHÔNG gửi
- `line_total` do BE tính (`quantity_ordered * unit_price`) — FE KHÔNG gửi
- `line_number` do BE auto-assign (max+1) — FE KHÔNG gửi
- **Một product_id chỉ xuất hiện 1 lần** trong cùng PO DRAFT
- Không resequence line_number sau khi xóa
- `notes` max 500 ký tự

### 3.4 State Machine (FE phải bám)
| PO Status | Edit Header | Line Mutation | Delete PO | Confirm | Create Receipt |
|-----------|-------------|---------------|-----------|---------|----------------|
| `DRAFT` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `CONFIRMED` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `PARTIALLY_RECEIVED` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `COMPLETED` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `CANCELLED` | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.5 Field Ownership
**Client gửi (header)**: supplier_id, warehouse_id, order_date, expected_delivery_date, currency, payment_terms, notes
**BE sở hữu (header)**: id, purchase_order_number, status, sub_total, tax_amount, total_amount, confirmed_at, confirmed_by, created_at, updated_at

**Client gửi (line)**: purchase_order_id, product_id, quantity_ordered, unit_price, notes
**BE sở hữu (line)**: id, line_number, quantity_received, line_total, created_at, updated_at

### 3.6 Error Codes quan trọng
- `PO_002`: PO không ở trạng thái DRAFT (race condition — tab khác đã confirm)
- `POL_005`: Product đã tồn tại trong PO (duplicate)
- `COM_004`: Entity not found
- `404`: Stale tab / entity bị xóa
- `400`: Validation lỗi
- `403`: Không đủ quyền

---

## 4. FE Architecture & Patterns

### 4.1 Tech Stack
- Angular (standalone NgModule, NOT standalone components)
- FormsModule + ReactiveFormsModule (dùng `[(ngModel)]` cho form đơn giản)
- ngx-toastr (custom wrapper qua `ToastrService`)
- Font Awesome 6 (icons)
- Global styles: `src/styles/whs-pages.css` + `src/styles/whs-components.css`
- Per-component CSS: chỉ override/extend specific styles

### 4.2 Project Structure Pattern
```
src/app/
├── dto/
│   ├── request/{Domain}/{DomainRequest}.ts
│   └── response/{Domain}/{DomainResponse}.ts
├── service/{DomainService}/{domain}.service.ts
├── pages/{page-name}/
│   ├── {page-name}.component.ts
│   ├── {page-name}.component.html
│   └── {page-name}.component.css
├── helper/enums/{EnumName}.ts
├── helper/constraint/sidebar-nav.ts
└── share/layout/...
```

### 4.3 Registration Pattern
1. Component → declare trong `app.module.ts` → `declarations[]`
2. Route → thêm trong `app-routing.module.ts` với `AuthGuard`
3. Service → `@Injectable({ providedIn: 'root' })` (auto-register)
4. Sidebar → thêm item vào `helper/constraint/sidebar-nav.ts`

### 4.4 Component Pattern (từ PO hiện tại)
```typescript
// Key conventions:
export class XxxComponent implements OnInit {
  // ── Data ──
  items: XxxResponse[] = [];
  
  // ── Pagination ──
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  loading = false;
  viewMode: 'grid' | 'list' = 'list';
  
  // ── Filters ──
  searchKeyword = '';
  selectedStatus: '' | SomeEnum = '';
  
  // ── Modal states ──
  showCreateModal = false;
  showDetailModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  
  // ── Selected entities ──
  selectedItem: XxxResponse | null = null;
  itemToDelete: XxxResponse | null = null;
  
  // ── Forms ──
  createForm: CreateXxxRequest = this.initCreateForm();
  editForm: UpdateXxxRequest = {};
  
  // ── Enums (for template) ──
  SomeEnum = SomeEnum;
}
```

### 4.5 HTML Template Pattern
```
page-container
├── page-hero (title + actions)
├── stats-grid (stat cards)
├── filter-section (search + select + buttons + view-toggle)
├── loading-state
├── table-container > data-table (list view)
├── entity-grid > entity-card (grid view)
├── pagination
└── modal-overlay > modal-box (create/edit/detail/delete modals)
```

### 4.6 Toastr Usage
```typescript
// Import
import { ToastrService } from '../../service/SystemService/toastr.service';

// Usage — first param is TITLE (not message)
this.toastr.success('Tạo đơn hàng thành công!');
this.toastr.error('Không tải được dữ liệu.');
this.toastr.warning('Vui lòng điền đầy đủ thông tin.');
this.toastr.info('API chưa sẵn sàng.');

// Error from API
this.toastr.error(error?.error?.message || 'Fallback message.');
```

### 4.7 API Service Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class XxxService {
  private readonly apiUrl = `${BaseURL.API_URL}xxx`;
  
  constructor(private http: HttpClient) {}
  
  getAll(page = 0, size = 10, filters?): Observable<ApiResponse<PageResponse<Xxx>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    // append filters...
    return this.http.get<ApiResponse<PageResponse<Xxx>>>(this.apiUrl, { params });
  }
  
  getById(id: string): Observable<ApiResponse<Xxx>> {
    return this.http.get<ApiResponse<Xxx>>(`${this.apiUrl}/${id}`);
  }
  
  create(request: CreateXxx): Observable<ApiResponse<Xxx>> {
    return this.http.post<ApiResponse<Xxx>>(this.apiUrl, request);
  }
  
  update(id: string, request: UpdateXxx): Observable<ApiResponse<Xxx>> {
    return this.http.put<ApiResponse<Xxx>>(`${this.apiUrl}/${id}`, request);
  }
  
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
```

---

## 5. Existing DTOs (FE)

### 5.1 PurchaseOrderRequest (đã có)
**File**: `src/app/dto/request/PurchaseOrder/PurchaseOrderRequest.ts`
```typescript
export interface CreatePurchaseOrderRequest {
  supplier_id: string;
  warehouse_id: string;
  order_date: string;
  expected_delivery_date?: string;
  currency: string;
  payment_terms?: string;
  notes?: string;
}

export interface UpdatePurchaseOrderRequest {
  supplier_id?: string;
  warehouse_id?: string;
  status?: OrderStatus;
  order_date?: string;
  expected_delivery_date?: string;
  currency?: string;
  payment_terms?: string;
  notes?: string;
}
```

### 5.2 PurchaseOrderResponse (đã có)
**File**: `src/app/dto/response/PurchaseOrder/PurchaseOrderResponse.ts`
```typescript
export interface PurchaseOrderResponse {
  id: string;
  purchase_order_number: string;
  supplier_id: string;
  supplier_name?: string;         // FE enriched
  warehouse_id: string;
  warehouse_name?: string;        // FE enriched
  status: OrderStatus;
  order_date: string;
  expected_delivery_date: string | null;
  sub_total: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_terms: string | null;
  notes: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
}
```

### 5.3 PurchaseOrderLineRequest (đã có)
**File**: `src/app/dto/request/PurchaseOrderLine/PurchaseOrderLineRequest.ts`
```typescript
export interface CreatePurchaseOrderLineRequest {
  purchase_order_id: string;
  product_id: string;
  quantity_ordered: number | null;
  unit_price: number | null;
  notes?: string;
}

export interface UpdatePurchaseOrderLineRequest {
  product_id?: string;
  quantity_ordered?: number;
  unit_price?: number;
  notes?: string;
}
```

### 5.4 PurchaseOrderLineResponse (đã có)
**File**: `src/app/dto/response/PurchaseOrderLine/PurchaseOrderLineResponse.ts`
```typescript
export interface PurchaseOrderLineResponse {
  id: string;
  purchase_order_id: string;
  product_id: string;
  line_number: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Enriched fields (FE-only)
  product_name?: string;
  product_sku?: string;
}
```

### 5.5 OrderStatus Enum (đã có)
**File**: `src/app/helper/enums/OrderStatus.ts`
```typescript
export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
```

---

## 6. Existing Services (FE)

### 6.1 PurchaseOrderService (đã có — đầy đủ)
**File**: `src/app/service/PurchaseOrderService/purchase-order.service.ts`
```
Methods: getAll(), getById(), create(), update(), delete(), confirm()
Filters: PurchaseOrderFilters interface
Base URL: ${BaseURL.API_URL}purchase-orders
```

### 6.2 PurchaseOrderLineService (đã có — đầy đủ)
**File**: `src/app/service/PurchaseOrderLineService/purchase-order-line.service.ts`
```
Methods: getByPurchaseOrderId(), create(), update(), delete()
Base URL: ${BaseURL.API_URL}purchase-order-lines
```

---

## 7. Existing Component — PO (đã implement)

### 7.1 File Map
```
src/app/pages/purchase-order/
├── purchase-order.component.ts    (623 lines)
├── purchase-order.component.html  (540 lines)
└── purchase-order.component.css   (186 lines)
```

### 7.2 Component Structure Summary
**TS**: Đã implement đầy đủ:
- Load data: `loadOrders()`, `loadSuppliers()`, `loadWarehouses()`, `loadProducts()`
- Search/Filter: `onSearch()`, `onResetFilter()`, `onPageChange()`
- PO CRUD: `openCreateModal()`, `onCreateSubmit()`, `openDetailModal()`, `openEditModal()`, `onEditSubmit()`, `openDeleteConfirm()`, `onDeleteConfirm()`
- PO Confirm: `openConfirmConfirm()`, `onConfirmOrder()`
- POL CRUD: `openAddLineModal()`, `onAddLineSubmit()`, `openEditLineModal()`, `onEditLineSubmit()`, `openDeleteLineConfirm()`, `onDeleteLineConfirm()`
- Helpers: `enrichOrder()`, `enrichLine()`, `getStatusLabel()`, `getStatusClass()`, `getAvailableProducts()`, `isDraft()`, `canCreateReceipt()`
- Modal management: `closeAllModals()`, `closeDetailModal()`, `closeSubModal()`

**HTML**: Đã implement đầy đủ:
- Hero header + Stats grid + Filter bar + View toggle
- Table (list) + Grid views
- Pagination
- 8 modals: Create PO, Detail PO (2 tabs: header + lines), Edit Header, Add Line, Edit Line, Confirm PO, Delete PO, Delete Line

**CSS**: Override cho detail-action-bar, detail-tabs, tab-count, detail-section, lines-header, summary-row, computed-value, btn-danger-outline, modal-xl

### 7.3 Dependencies (inject trong constructor)
```typescript
private poService: PurchaseOrderService
private polService: PurchaseOrderLineService
private bpService: BusinessPartnerService
private warehouseService: WarehouseService
private productService: ProductService
private toastr: ToastrService
```

### 7.4 Key UX Flows đã implement
1. **Tạo PO** → modal create → success → auto mở detail → focus tab lines
2. **Detail PO** → 2 tabs (header info + lines table) → action bar conditional on DRAFT
3. **Edit header** → sub-modal inside detail → lưu → refresh
4. **Add line** → sub-modal → product dropdown exclude duplicates → auto-calculate preview
5. **Edit line** → sub-modal → product dropdown exclude duplicates (except current)
6. **Delete line** → confirm modal → refresh lines + header
7. **Confirm PO** → confirm modal → disabled khi 0 lines → success → reload
8. **Delete PO** → confirm modal → DRAFT only
9. **Race condition**: nếu BE trả PO_002 (PO không còn DRAFT) → reload detail → chuyển read-only

---

## 8. Shared UI System

### 8.1 Global CSS (`src/styles/whs-pages.css` — 1019 lines)
Cung cấp TẤT CẢ class dùng trong page:
- `.page-container`, `.page-hero`, `.hero-left`, `.hero-accent`, `.hero-title`, `.hero-subtitle`, `.hero-actions`
- `.stats-grid`, `.stat-item`, `.stat-bar`, `.stat-body`, `.stat-label`, `.stat-value`
- `.stat-total`, `.stat-active`, `.stat-inactive`, `.stat-info`, `.stat-full`
- `.filter-section`, `.search-input`, `.filter-select`, `.view-toggle`, `.btn-view-toggle`
- `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-warning`
- `.table-container`, `.data-table`, `.cell-main`, `.cell-sub`, `.actions`, `.btn-icon`, `.btn-edit`, `.btn-delete`
- `.entity-grid`, `.entity-card`, `.entity-card__title/sub/meta/row/actions`
- `.badge`, `.badge-draft`, `.badge-confirmed`, `.badge-progress`, `.badge-completed`, `.badge-cancelled`
- `.pagination`, `.page-info`
- `.modal-overlay`, `.modal-box`, `.modal-sm`, `.modal-lg`, `.modal-header`, `.modal-header-danger`, `.modal-close`, `.modal-body`, `.modal-footer`
- `.form-row`, `.form-group`, `.form-control`, `.form-check`
- `.detail-grid`, `.detail-item`, `.detail-label`
- `.info-box`
- `.loading-state`
- `.empty-state`
- `.link`, `.required`, `.text-danger`, `.text-success`, `.text-muted`
- Responsive breakpoints: 1024px, 768px, 480px

### 8.2 PO-specific CSS (`purchase-order.component.css` — 186 lines)
Extends:
- `.detail-action-bar` — action buttons bar trong detail modal
- `.detail-tabs`, `.detail-tab`, `.tab-count` — tab navigation
- `.detail-section-title`, `.detail-notes`, `.detail-item--highlight`
- `.lines-header` — header cho lines section
- `.text-right`, `.text-warning`, `.text-muted`
- `.empty-lines-message`
- `.summary-row`
- `.computed-value`
- `.btn-danger-outline`, `.btn-sm`, `.ms-2`
- `.modal-xl` — max-width 960px
- `.stat-info` color variant

### 8.3 Font Awesome Icons dùng trong PO
```
fa-solid fa-cart-shopping     — PO icon
fa-solid fa-magnifying-glass  — Search
fa-solid fa-rotate-right      — Reset
fa-solid fa-grip              — Grid view
fa-solid fa-list              — List view
fa-regular fa-eye             — View detail
fa-solid fa-check             — Confirm (table)
fa-solid fa-check-double      — Confirm (detail)
fa-regular fa-trash-can       — Delete
fa-regular fa-pen-to-square   — Edit
fa-solid fa-plus              — Add
fa-regular fa-file-lines      — Header tab icon
fa-solid fa-list-ol           — Lines tab icon
fa-regular fa-lightbulb       — Info box icon
fa-solid fa-lock              — Locked info box icon
fa-regular fa-clipboard       — Empty lines icon
```

---

## 9. Dependent Services & DTOs

### 9.1 BusinessPartnerService
**File**: `src/app/service/BusinessPartnerService/business-partner.service.ts`
- `getAll()` → returns `ApiResponse<BusinessPartnerResponse[]>` (NOT paginated)
- Filter suppliers: `partner.status === 'ACTIVE' && (partner.type === 'SUPPLIER' || partner.type === 'BOTH')`

### 9.2 WarehouseService
**File**: `src/app/service/WarehouseService/warehouse.service.ts`
- `getList()` → returns `ApiResponse<WareHouseResponse[]>` (all, endpoint `/warehouse/all`)

### 9.3 ProductService
**File**: `src/app/service/ProductService/product.service.ts`
- `getAll(0, 200)` → returns `ApiResponse<PageResponse<ProductResponse>>`
- Filter active: `product.status === 'ACTIVE'`

### 9.4 Key Response Types

#### BusinessPartnerResponse
```typescript
{ id, code, name, type, status, contact_person, email, phone, address, ... }
// type: 'SUPPLIER' | 'CUSTOMER' | 'BOTH'
// status: 'ACTIVE' | 'INACTIVE'
```

#### WareHouseResponse
```typescript
{ id, name, code, address, phone, email, status, ware_house_type, manager_id }
```

#### ProductResponse
```typescript
{ id, sku, name, description, category_id, category_name, uom_id, uom_name, uom_code,
  cost_price, selling_price, status, ... }
// status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
```

---

## 10. Implementation Checklist — PO (Phase 1)

### Review Points
- [ ] Verify `CreatePurchaseOrderRequest` fields match BE contract
- [ ] Verify `UpdatePurchaseOrderRequest` — remove `status` field (FE không nên gửi)
- [ ] Verify filter params trong `PurchaseOrderService` match BE query params
- [ ] Stats grid: đang count từ current page data, nên dùng API riêng hoặc note rõ limitation
- [ ] `expectedDeliveryDate` validation: FE nên disable ngày quá khứ trong date picker
- [ ] Create flow: sau tạo → mở detail → focus tab lines ✅ (đã có)
- [ ] Confirm button: disable khi 0 lines ✅ (đã có)
- [ ] Race condition handling: PO_002 error → reload + lock ✅ (đã có)
- [ ] Loading states đầy đủ cho mọi API call
- [ ] Empty states đầy đủ

### Cần chú ý
- `toastr.success('title')` — param đầu là **title**, không phải message
- Error: dùng `error?.error?.message` pattern
- Supplier filter: chỉ lấy ACTIVE + (SUPPLIER | BOTH)
- Modal close: `$event.stopPropagation()` trên modal-box

---

## 11. Implementation Checklist — POL (Phase 2)

### Review Points
- [ ] Product dropdown: exclude products đã có trong PO (getAvailableProducts) ✅ (đã có)
- [ ] Line form: `quantity_ordered > 0`, `unit_price >= 0`
- [ ] Preview `line_total` trên form = `quantity_ordered * unit_price` (chỉ hiển thị, không gửi BE)
- [ ] After any line mutation → refresh both lines AND header (vì subtotal thay đổi)
- [ ] Edit line: allow change product (but check duplicate)
- [ ] Delete line: confirm modal → không resequence
- [ ] `notes` max 500 chars: thêm `maxlength="500"` trên textarea ✅ (đã có)
- [ ] Error POL_005 (duplicate product) → specific message ✅ (đã có)

### Refresh Pattern sau Line Mutation
```typescript
refreshAfterLineMutation(): void {
  if (this.selectedOrder) {
    this.loadOrderLines(this.selectedOrder.id);   // refresh lines table
    this.loadOrderDetail(this.selectedOrder.id);   // refresh header (subtotal may change)
  }
}
```

---

## 12. Error Handling Pattern

```typescript
// Standard error handling in subscribe
error: (error) => {
  // Specific error codes
  const code = error?.error?.error_code;
  if (code === 'PO_002') {
    this.toastr.error('Đơn hàng không còn ở trạng thái Nháp.');
    // Reload to reflect new state
    this.loadOrderDetail(orderId);
    this.showEditModal = false;
  } else if (code === 'POL_005') {
    this.toastr.error('Sản phẩm đã tồn tại trong đơn hàng.');
  } else {
    // Fallback
    this.toastr.error(error?.error?.message || 'Thao tác thất bại.');
  }
}
```

### Race Condition Pattern
Khi nhận `PO_002` (PO status changed) → close edit modal + reload detail + chuyển read-only.

---

## 13. File Map — Cần tạo / sửa

### Đã có (chỉ review/polish):
```
src/app/dto/request/PurchaseOrder/PurchaseOrderRequest.ts        ✅
src/app/dto/request/PurchaseOrderLine/PurchaseOrderLineRequest.ts ✅
src/app/dto/response/PurchaseOrder/PurchaseOrderResponse.ts      ✅
src/app/dto/response/PurchaseOrderLine/PurchaseOrderLineResponse.ts ✅
src/app/helper/enums/OrderStatus.ts                               ✅
src/app/service/PurchaseOrderService/purchase-order.service.ts   ✅
src/app/service/PurchaseOrderLineService/purchase-order-line.service.ts ✅
src/app/pages/purchase-order/purchase-order.component.ts         ✅
src/app/pages/purchase-order/purchase-order.component.html       ✅
src/app/pages/purchase-order/purchase-order.component.css        ✅
src/app/app-routing.module.ts (route đã có)                      ✅
src/app/app.module.ts (declaration đã có)                        ✅
src/app/helper/constraint/sidebar-nav.ts (link đã có)            ✅
```

### KHÔNG cần tạo mới — tất cả files đã tồn tại

---

## 14. Sequencing cho FE Developer

### Phase 1: PO Header
1. Đọc section 2.1, 3.1, 3.4, 5.1-5.2, 6.1
2. Review `purchase-order.component.ts` phần load + create + edit + delete + confirm
3. Review HTML modals: create, edit header, detail header tab, delete confirm, confirm confirm
4. Kiểm tra CSS: shared classes từ `whs-pages.css`, overrides từ component CSS
5. Test flow: list → create → detail → edit → add lines → confirm → read-only

### Phase 2: POL (Lines)
1. Đọc section 2.2, 3.3, 5.3-5.4, 6.2
2. Review `purchase-order.component.ts` phần line management
3. Review HTML: detail lines tab, add line modal, edit line modal, delete line confirm
4. Kiểm tra: product duplicate prevention, line_total preview, refresh pattern
5. Test flow: add line → edit line → delete line → confirm PO → lines locked

---

## 15. Quick Reference — Status Labels & Classes

```typescript
const statusLabels = {
  DRAFT: 'Nháp',
  CONFIRMED: 'Đã xác nhận',
  PARTIALLY_RECEIVED: 'Nhận một phần',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ'
};

const statusClasses = {
  DRAFT: 'badge-draft',           // gray
  CONFIRMED: 'badge-confirmed',   // blue
  PARTIALLY_RECEIVED: 'badge-progress', // blue
  IN_PROGRESS: 'badge-progress',  // blue
  COMPLETED: 'badge-completed',   // green
  CANCELLED: 'badge-cancelled'    // red
};
```

---

## 16. BaseURL & Environment

```typescript
// src/environments/BaseURL.ts
export class BaseURL {
  public static readonly API_URL: string = 'http://localhost:8080/api/v1/';
}

// Usage in services:
private readonly apiUrl = `${BaseURL.API_URL}purchase-orders`;
// → http://localhost:8080/api/v1/purchase-orders
```

---

*Document này đủ để implement/review PO + POL trên FE mà không cần đọc lại toàn bộ source code.*

