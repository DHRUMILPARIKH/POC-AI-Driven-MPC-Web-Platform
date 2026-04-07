# Architecture — MPC Platform

## Overview

Next.js 14 (App Router) monorepo with PostgreSQL, serving three role-based dashboards for industrial hydrogen station MPC operations.

## Phase 2 Readiness

### Real Telemetry Ingestion
- Separate worker service reads from RevPi PLC / MariaDB and writes to `TelemetryReading` table
- Web app already reads from this table — no API changes needed
- Consider TimescaleDB hypertable for `TelemetryReading` when row count exceeds ~10M

### ML Model Integration
- `/api/v1/demand` and `/api/v1/models` are the seams
- Phase 1 returns mock data; Phase 2 calls an inference service (Python + scikit-learn pipeline)
- Interface contract stays the same

### Real-time Updates
- Use Server-Sent Events (or WebSockets via a separate service) for live telemetry
- React Query already supports SSE-style invalidation via `queryClient.invalidateQueries()`

### Multi-site Support
- Schema already has `siteId` on Compressor, TelemetryReading, DemandForecast
- Add site switcher to TopBar
- RBAC needs site-scoped extension: `canForSite(user, site, action)`

### Custom Roles
- Migrate from enum to `Role` + `Permission` tables
- The `can()` function abstraction means UI/API code doesn't change
- Migration path: create tables, backfill from enum, update `can()` to read from DB

### Scenario Simulation
- `SimulationRun` table exists with `inputSnapshot` and `results` JSON fields
- Build a worker that picks up `PENDING` rows, runs optimization, writes results
- Web app polls or uses SSE for status updates
