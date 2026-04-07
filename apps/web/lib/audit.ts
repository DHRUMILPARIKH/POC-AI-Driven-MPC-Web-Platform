import { prisma } from "./db";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "ACKNOWLEDGE"
  | "EXPORT"
  | "SIMULATION_START";

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      metadata: (entry.metadata ?? {}) as Record<string, string>,
      createdAt: new Date(),
    },
  });
}
