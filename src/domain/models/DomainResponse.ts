// Basic domain response wrapper for domain layer (useful for consistent typing)
export interface DomainResponse<T = any> {
  data: T;
  status?: number;
  message?: string;
}
