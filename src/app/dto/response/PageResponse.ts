export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  is_first: boolean;
  is_last: boolean;
}
