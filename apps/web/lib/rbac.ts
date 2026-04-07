export type Role = "ADMIN" | "ENGINEER" | "OPERATOR";

export type Action =
  | "view:operations"
  | "view:engineering"
  | "view:admin"
  | "edit:compressor"
  | "run:simulation"
  | "acknowledge:alert"
  | "manage:users"
  | "assign:roles"
  | "view:audit"
  | "export:data"
  | "modify:settings";

const PERMISSION_MATRIX: Record<Action, Set<Role>> = {
  "view:operations": new Set<Role>(["ADMIN", "ENGINEER", "OPERATOR"]),
  "view:engineering": new Set<Role>(["ADMIN", "ENGINEER"]),
  "view:admin": new Set<Role>(["ADMIN"]),
  "edit:compressor": new Set<Role>(["ADMIN", "ENGINEER"]),
  "run:simulation": new Set<Role>(["ADMIN", "ENGINEER"]),
  "acknowledge:alert": new Set<Role>(["ADMIN", "ENGINEER", "OPERATOR"]),
  "manage:users": new Set<Role>(["ADMIN"]),
  "assign:roles": new Set<Role>(["ADMIN"]),
  "view:audit": new Set<Role>(["ADMIN"]),
  "export:data": new Set<Role>(["ADMIN", "ENGINEER", "OPERATOR"]),
  "modify:settings": new Set<Role>(["ADMIN"]),
};

export function can(role: Role, action: Action): boolean {
  const allowedRoles = PERMISSION_MATRIX[action];
  return allowedRoles.has(role);
}

export function requirePermission(role: Role, action: Action): void {
  if (!can(role, action)) {
    throw new ForbiddenError(`Role '${role}' is not permitted to perform '${action}'`);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function getPermissionsForRole(role: Role): Action[] {
  return (Object.entries(PERMISSION_MATRIX) as [Action, Set<Role>][])
    .filter(([, roles]) => roles.has(role))
    .map(([action]) => action);
}

export const ALL_ACTIONS: Action[] = Object.keys(PERMISSION_MATRIX) as Action[];
export const ALL_ROLES: Role[] = ["ADMIN", "ENGINEER", "OPERATOR"];
