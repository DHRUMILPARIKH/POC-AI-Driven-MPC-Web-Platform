export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 500;

export const TELEMETRY_SOURCES = [
  "PRESSURE_HEADER",
  "PRESSURE_LIQ_01",
  "POWER",
  "PRICE",
  "LIQUIFIER_FLOW",
  "LIQUIFIER_TEMP",
  "LIQUIFIER_PRESSURE",
] as const;

export const ALERT_SEVERITIES = ["INFO", "WARN", "DANGER"] as const;

export const USER_ROLES = ["ADMIN", "ENGINEER", "OPERATOR"] as const;

export const COMPRESSOR_STATUSES = ["ON", "OFF"] as const;
