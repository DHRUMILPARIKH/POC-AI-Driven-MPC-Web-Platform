import { z } from "zod";

// ─── User schemas ───────────────────────────────────────────────────

export const UserRoleSchema = z.enum(["ADMIN", "ENGINEER", "OPERATOR"]);
export const UserStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: UserRoleSchema,
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
});

// ─── Compressor schemas ─────────────────────────────────────────────

export const CompressorStatusSchema = z.enum(["ON", "OFF"]);

export const UpdateCompressorSchema = z.object({
  maxFlow: z.string().regex(/^\d+(\.\d+)?$/, "Must be a decimal number").optional(),
  minFlow: z.string().regex(/^\d+(\.\d+)?$/, "Must be a decimal number").optional(),
  startupPenalty: z.string().regex(/^\d+(\.\d+)?$/, "Must be a decimal number").optional(),
  runningStatus: CompressorStatusSchema.optional(),
  priceFactor: z.string().regex(/^\d+(\.\d+)?$/, "Must be a decimal number").optional(),
  minTakePerDay: z.string().regex(/^\d+(\.\d+)?$/, "Must be a decimal number").optional(),
  availability: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Must be a decimal number")
    .refine((v) => parseFloat(v) >= 0 && parseFloat(v) <= 100, "Must be 0-100")
    .optional(),
});

// ─── Telemetry schemas ──────────────────────────────────────────────

export const TelemetrySourceSchema = z.enum([
  "PRESSURE_HEADER",
  "PRESSURE_LIQ_01",
  "POWER",
  "PRICE",
  "LIQUIFIER_FLOW",
  "LIQUIFIER_TEMP",
  "LIQUIFIER_PRESSURE",
]);

export const TelemetryQuerySchema = z.object({
  source: TelemetrySourceSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(50),
});

// ─── Alert schemas ──────────────────────────────────────────────────

export const AlertSeveritySchema = z.enum(["INFO", "WARN", "DANGER"]);

export const AcknowledgeAlertSchema = z.object({
  alertId: z.string().cuid(),
});

// ─── Pagination schemas ─────────────────────────────────────────────

export const OffsetPaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
});

export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(50),
});
