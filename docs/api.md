# API Documentation — MPC Platform

Base URL: `/api/v1`

## Conventions

- **REST**, JSON, kebab-case URLs, plural nouns
- **Auth**: Every route except `/api/auth/*` requires a session. Returns `401` if missing, `403` if unauthorized
- **Validation**: Request bodies validated with Zod. Returns `400` with structured errors
- **Errors**: `{ error: { code, message, details? } }`
- **Pagination**: Cursor-based for telemetry, offset for everything else. Default limit 50, max 500
- **Timestamps**: ISO 8601 in UTC
- **Decimals**: Sent as strings to preserve precision

## Endpoints

*Documented as each endpoint is built in Phase 1C-1E.*

### Auth
- `GET/POST /api/auth/*` — NextAuth handlers (public)

### Telemetry (Phase 1C)
- `GET /api/v1/telemetry/pressure`
- `GET /api/v1/telemetry/power`
- `GET /api/v1/telemetry/price`
- `GET /api/v1/telemetry/liquifier`

### Alerts (Phase 1C)
- `GET /api/v1/alerts`
- `PATCH /api/v1/alerts/:id/acknowledge`

### Compressors (Phase 1D)
- `GET /api/v1/compressors`
- `GET /api/v1/compressors/:id`
- `PATCH /api/v1/compressors/:id`

### Demand (Phase 1D)
- `GET /api/v1/demand`

### Users (Phase 1E)
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`

### Audit (Phase 1E)
- `GET /api/v1/audit`
