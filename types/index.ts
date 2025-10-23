/**
 * Global type definitions for the application
 * Add shared types, interfaces, and type utilities here
 */

// Example: API Response wrapper type
export type ApiResponse<T> = {
  data: T;
  error?: string;
  success: boolean;
};

// Example: Pagination metadata
export type PaginationMeta = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};

// Example: Paginated response
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: PaginationMeta;
};
