import { describe, it, expect } from "vitest";
import {
  can,
  requirePermission,
  ForbiddenError,
  getPermissionsForRole,
  ALL_ACTIONS,
  ALL_ROLES,
  type Role,
  type Action,
} from "@/lib/rbac";

// Full permission matrix from README — every cell tested
const EXPECTED_MATRIX: Record<Action, Record<Role, boolean>> = {
  "view:operations": { ADMIN: true, ENGINEER: true, OPERATOR: true },
  "view:engineering": { ADMIN: true, ENGINEER: true, OPERATOR: false },
  "view:admin": { ADMIN: true, ENGINEER: false, OPERATOR: false },
  "edit:compressor": { ADMIN: true, ENGINEER: true, OPERATOR: false },
  "run:simulation": { ADMIN: true, ENGINEER: true, OPERATOR: false },
  "acknowledge:alert": { ADMIN: true, ENGINEER: true, OPERATOR: true },
  "manage:users": { ADMIN: true, ENGINEER: false, OPERATOR: false },
  "assign:roles": { ADMIN: true, ENGINEER: false, OPERATOR: false },
  "view:audit": { ADMIN: true, ENGINEER: false, OPERATOR: false },
  "export:data": { ADMIN: true, ENGINEER: true, OPERATOR: true },
  "modify:settings": { ADMIN: true, ENGINEER: false, OPERATOR: false },
};

describe("RBAC — can()", () => {
  for (const action of ALL_ACTIONS) {
    for (const role of ALL_ROLES) {
      const expected = EXPECTED_MATRIX[action][role];
      it(`${role} ${expected ? "CAN" : "CANNOT"} ${action}`, () => {
        expect(can(role, action)).toBe(expected);
      });
    }
  }
});

describe("RBAC — requirePermission()", () => {
  it("does not throw for allowed actions", () => {
    expect(() => requirePermission("ADMIN", "view:admin")).not.toThrow();
  });

  it("throws ForbiddenError for disallowed actions", () => {
    expect(() => requirePermission("OPERATOR", "view:admin")).toThrow(ForbiddenError);
  });
});

describe("RBAC — getPermissionsForRole()", () => {
  it("returns all permissions for ADMIN", () => {
    const perms = getPermissionsForRole("ADMIN");
    expect(perms).toEqual(expect.arrayContaining(ALL_ACTIONS));
    expect(perms.length).toBe(ALL_ACTIONS.length);
  });

  it("returns correct subset for OPERATOR", () => {
    const perms = getPermissionsForRole("OPERATOR");
    expect(perms).toContain("view:operations");
    expect(perms).toContain("acknowledge:alert");
    expect(perms).toContain("export:data");
    expect(perms).not.toContain("view:admin");
    expect(perms).not.toContain("edit:compressor");
  });
});
