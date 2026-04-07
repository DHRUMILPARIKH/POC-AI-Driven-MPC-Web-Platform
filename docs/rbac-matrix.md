# RBAC Permission Matrix

Source of truth: `apps/web/lib/rbac.ts`

| Permission | Admin | Engineer | Operator |
|---|:---:|:---:|:---:|
| View Operations dashboard | ✅ | ✅ | ✅ |
| View Engineering dashboard | ✅ | ✅ | ❌ |
| View Admin dashboard | ✅ | ❌ | ❌ |
| Edit compressor config | ✅ | ✅ | ❌ |
| Run simulations | ✅ | ✅ | ❌ |
| Acknowledge alerts | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| Assign roles | ✅ | ❌ | ❌ |
| View audit log | ✅ | ❌ | ❌ |
| Export data (CSV/JSON) | ✅ | ✅ | ✅ |
| Modify system settings | ✅ | ❌ | ❌ |

## Enforcement Layers

1. **Middleware** — blocks routes (`/admin/*` requires ADMIN)
2. **API routes** — call `requirePermission()` before any DB access
3. **UI** — hides controls the user can't use (never trusts UI alone)
