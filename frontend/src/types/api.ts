export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DateRange {
  from: string;
  to: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
