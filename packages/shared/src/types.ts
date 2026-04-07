export type UserRole = "ADMIN" | "ENGINEER" | "OPERATOR";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type CompressorStatus = "ON" | "OFF";
export type AlertSeverity = "INFO" | "WARN" | "DANGER";
export type SimulationStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type TelemetrySource =
  | "PRESSURE_HEADER"
  | "PRESSURE_LIQ_01"
  | "POWER"
  | "PRICE"
  | "LIQUIFIER_FLOW"
  | "LIQUIFIER_TEMP"
  | "LIQUIFIER_PRESSURE";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page?: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}
