export interface PaginationOptions<T = any> {
  page?: number;
  limit?: number;
  sortBy?: keyof T | string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}
