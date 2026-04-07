# AI-Driven MPC Web Platform

> Production implementation brief for Claude Code.
> POC is complete (`mpc-platform.jsx`). This document is the contract for the full build.

---

## 0. How to use this document

You are **Claude Code**. You are building the production version of an AI-driven Model Predictive Control (MPC) platform for industrial hydrogen station operations. A clickable React POC already exists and validates the UI direction — your job is to turn it into a real, deployable, tested system.

**Read this entire document before writing any code.** Then propose a build plan and confirm before scaffolding. Do not skip steps. Do not invent requirements. When in doubt, ask.

**Source of truth order** when requirements conflict:
1. This README
2. The original product vision document (`/docs/product-vision.md`)
3. The POC file (`mpc-platform.jsx`) — for visual/UX reference only, not architectural
4. Your own judgment (last resort, and flag it)

---

## 1. Product summary

A web platform for engineering and operations teams at industrial gas / hydrogen facilities to **monitor**, **simulate**, and **optimize** system performance using AI-driven Model Predictive Control. Three user roles (Admin, Engineer, Operator) get different workspaces. Phase 1 uses simulated data; the architecture must be ready to plug into real PLC/MariaDB telemetry and ML models in Phase 2.

**Core value:** AI-driven optimization and predictive insights for operational excellence.

---

## 2. Tech stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** + TypeScript | Server components for data-heavy dashboards, API routes co-located, single deployment unit |
| Language | **TypeScript (strict)** | Non-negotiable. Industrial control = correctness matters |
| UI | **shadcn/ui + Tailwind CSS** | Themeable, accessible, well-documented component vocabulary |
| Charts | **Recharts** | Proven in POC, sufficient for Phase 1 |
| State (client) | **Zustand** | For edit-buffer state (unsaved config changes, optimistic UI) |
| State (server) | **TanStack Query (React Query)** | Caching, refetching, optimistic updates |
| Auth | **NextAuth.js v5** with Azure AD provider | Implements the Microsoft login requirement directly |
| Database | **PostgreSQL 16** | Relational fits RBAC + config; JSONB for flexible telemetry payloads |
| ORM | **Prisma** | Type-safe queries, migrations, end-to-end types |
| Validation | **Zod** | Runtime validation at API boundaries; share schemas client/server |
| Testing | **Vitest** (unit) + **Playwright** (E2E) + **MSW** (API mocking) | Covers the spec's testing requirements |
| Linting | **ESLint + Prettier** + **TypeScript strict** | |
| Package manager | **pnpm** | Faster, stricter than npm |
| Deployment target | **Docker + Docker Compose** for now | Cloud-agnostic. Can later move to Vercel/Azure |

**Do not substitute** these without asking. If you hit a blocker (e.g. NextAuth v5 issue), raise it before swapping.

---

## 3. Project structure

Scaffold exactly this layout:

```
mpc-platform/
├── apps/
│   └── web/                          # Next.js app
│       ├── app/
│       │   ├── (auth)/
│       │   │   └── login/page.tsx
│       │   ├── (app)/
│       │   │   ├── layout.tsx        # post-login shell (TopBar)
│       │   │   ├── workspaces/page.tsx
│       │   │   ├── operations/page.tsx
│       │   │   ├── engineering/page.tsx
│       │   │   └── admin/
│       │   │       ├── users/page.tsx
│       │   │       ├── roles/page.tsx
│       │   │       └── audit/page.tsx
│       │   ├── api/
│       │   │   ├── auth/[...nextauth]/route.ts
│       │   │   ├── compressors/route.ts
│       │   │   ├── compressors/[id]/route.ts
│       │   │   ├── telemetry/
│       │   │   │   ├── pressure/route.ts
│       │   │   │   ├── power/route.ts
│       │   │   │   ├── price/route.ts
│       │   │   │   └── liquifier/route.ts
│       │   │   ├── demand/route.ts
│       │   │   ├── alerts/route.ts
│       │   │   ├── users/route.ts
│       │   │   ├── users/[id]/route.ts
│       │   │   └── audit/route.ts
│       │   └── layout.tsx            # root layout, theme provider
│       ├── components/
│       │   ├── ui/                   # shadcn primitives
│       │   ├── charts/               # Recharts wrappers
│       │   ├── tables/               # DataTable, EditableTable
│       │   ├── layout/               # TopBar, Sidebar, Panel, PanelHeader
│       │   └── domain/               # CompressorConfigTable, AlertsList, etc
│       ├── lib/
│       │   ├── auth.ts               # NextAuth config
│       │   ├── db.ts                 # Prisma client singleton
│       │   ├── rbac.ts               # permission helpers + matrix
│       │   ├── audit.ts              # audit log writer
│       │   └── utils.ts
│       ├── stores/                   # Zustand stores
│       ├── hooks/                    # React Query hooks
│       ├── types/                    # shared TS types
│       ├── tests/
│       │   ├── unit/
│       │   └── e2e/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts
│       │   └── migrations/
│       └── public/
├── packages/
│   └── shared/                       # shared Zod schemas, types, constants
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml            # web + postgres
├── docs/
│   ├── product-vision.md             # original spec
│   ├── architecture.md               # you write this in step 1
│   ├── api.md                        # auto-generated or hand-written
│   └── rbac-matrix.md
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

A monorepo (`apps/` + `packages/`) is overkill for one app today, but cheap to set up now and saves a migration when you add a worker service for ML inference in Phase 2.

---

## 4. Data model (Prisma schema requirements)

Implement these tables. Field names are suggestions — make them idiomatic Prisma.

### `User`
- `id` (cuid)
- `email` (unique)
- `name`
- `azureAdId` (unique, nullable for seed users)
- `role` (enum: ADMIN, ENGINEER, OPERATOR)
- `status` (enum: ACTIVE, INACTIVE)
- `createdAt`, `updatedAt`, `lastLoginAt`

### `Compressor`
- `id`
- `portNumber` (int, unique per site — Phase 1 single site, but design for multi-site)
- `siteId` (FK to Site, nullable in Phase 1)
- `maxFlow` (decimal)
- `minFlow` (decimal)
- `startupPenalty` (decimal)
- `runningStatus` (enum: ON, OFF)
- `priceFactor` (decimal)
- `minTakePerDay` (decimal)
- `availability` (decimal, 0-100)
- `updatedAt`, `updatedBy` (FK User)

### `Site` (stub for Phase 2 multi-site)
- `id`, `name`, `timezone`, `location`

### `TelemetryReading`
- `id`
- `source` (enum: PRESSURE_HEADER, PRESSURE_LIQ_01, POWER, PRICE, etc — extensible)
- `siteId`
- `timestamp`
- `value` (decimal)
- `unit` (string)
- Index on `(source, timestamp)` — this table will be huge eventually; consider TimescaleDB extension as a Phase 2 note in `architecture.md`

### `DemandForecast`
- `id`, `siteId`, `timestamp`, `existingDemand`, `predictedDemand`, `modelVersion`

### `Alert`
- `id`, `severity` (enum: INFO, WARN, DANGER), `message`, `source`, `createdAt`, `acknowledgedBy` (FK), `acknowledgedAt`

### `AuditLog`
- `id`, `userId` (FK), `action`, `resourceType`, `resourceId`, `metadata` (Json), `createdAt`
- Write to this on **every** mutation. Non-negotiable. Industrial systems are auditable systems.

### `SimulationRun` (Phase 1: stub; Phase 2: real)
- `id`, `startTime`, `horizon`, `status`, `createdBy`, `inputSnapshot` (Json), `results` (Json)

---

## 5. RBAC matrix (authoritative)

This is the source of truth. Implement as a function `can(user, action, resource?)` in `lib/rbac.ts` and enforce in **every** API route via middleware.

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

**Architecture must allow custom roles in Phase 2** — store permissions in a `Role` table eventually, but for Phase 1 the enum is fine. Document the migration path in `architecture.md`.

**RBAC enforcement is layered:**
1. Middleware blocks routes (`/admin/*` requires ADMIN)
2. API routes call `requirePermission()` before any DB access
3. UI hides controls the user can't use (but never trusts the UI alone)

---

## 6. Functional modules (build order)

Build in this order. Do not start a module until the previous one is tested and working.

### Phase 1A — Foundation (Week 1)
1. **Scaffold + tooling** — Next.js, TS strict, ESLint, Prettier, Vitest, Playwright, Tailwind, shadcn init
2. **Docker compose** — web + postgres up with one command
3. **Prisma schema + migrations + seed** — seed includes 5 users (one per role + extras), 4 compressors, 24h of mock telemetry, sample alerts
4. **NextAuth + Azure AD** — login flow working end-to-end. Use `.env.example` for required vars. Provide a dev fallback (credentials provider) so seeded users can log in without real Azure AD during local dev — clearly gated behind `NODE_ENV !== 'production'`
5. **Theme system** — dark + light, persisted to localStorage, no FOUC. Use CSS variables (the POC's palette is a good starting point but refine for accessibility — verify WCAG AA contrast)

### Phase 1B — Shell + RBAC (Week 1-2)
6. **App shell** — TopBar, user dropdown, theme toggle, logout
7. **Workspace selection page** — three cards, locked states for unauthorized roles
8. **RBAC middleware + helpers** — with unit tests covering every cell of the matrix above
9. **Audit log writer** — plumbed into every mutation API route

### Phase 1C — Operations dashboard (Week 2)
10. **KPI cards** — 4 cards, real data from `/api/telemetry/*`
11. **Pressure chart** — actual vs setpoint, 24h, with zoom/pan
12. **Power chart** + **Price chart**
13. **Alerts panel** — list, acknowledge action (writes to audit log)
14. **Liquifier telemetry table** — sortable, paginated, CSV/JSON export

### Phase 1D — Engineering dashboard (Week 3)
15. **Time configuration** — datetime picker with timezone display + horizon
16. **Compressor config table** — inline editing, optimistic updates via Zustand edit buffer, save/discard, validation (Zod), audit logged
17. **Demand forecast chart** — existing vs AI predicted (mock data, but served from `/api/demand` so the swap to real ML is a config change)
18. **Model status cards** — read from a `/api/models` endpoint that returns mock status for now
19. **Run simulation button** — creates a `SimulationRun` row with status `PENDING`. Phase 2 will actually run something

### Phase 1E — Admin dashboard (Week 3-4)
20. **User management** — table, create/edit/deactivate, role assignment
21. **Role permissions matrix view** — read-only display of `lib/rbac.ts`
22. **Audit log viewer** — paginated, filterable by user/action/date

### Phase 1F — Polish + ship (Week 4)
23. **Export functionality** — CSV and JSON for all tables and chart data
24. **Loading + error states** — skeletons, error boundaries, retry buttons
25. **Empty states** — every list/table has a thoughtful empty state
26. **Responsive** — desktop primary, tablet secondary (per spec). Mobile is out of scope for Phase 1
27. **Accessibility audit** — keyboard nav, focus rings, ARIA, screen reader smoke test
28. **E2E test suite** — see Section 8

---

## 7. API design conventions

- **REST**, JSON, kebab-case URLs, plural nouns
- **Versioned**: prefix all routes with `/api/v1/` (yes, even now — cheap insurance)
- **Validation**: every request body validated with Zod. Return `400` with structured errors on failure
- **Auth**: every route except `/api/v1/auth/*` requires a session. Return `401` if missing, `403` if authenticated but unauthorized
- **Errors**: structured response — `{ error: { code, message, details? } }`
- **Pagination**: cursor-based for telemetry, offset for everything else. Default limit 50, max 500
- **Timestamps**: ISO 8601 in UTC, always
- **Decimals**: send as strings to preserve precision

Document every endpoint in `docs/api.md` as you build it. Include request/response examples.

---

## 8. Testing requirements

The product spec calls out frontend, backend, and system testing. Concrete targets:

**Unit tests (Vitest)**
- 100% coverage of `lib/rbac.ts` — every cell of the permission matrix
- All Zod schemas (valid + invalid cases)
- Utility functions
- Zustand stores (state transitions)

**Component tests (Vitest + Testing Library)**
- DataTable: sort, paginate, edit, save, discard
- Forms: validation, submission, error display
- Theme toggle persists
- TopBar role display

**API integration tests (Vitest + supertest-style with Next.js test helpers)**
- Auth: unauthenticated → 401, wrong role → 403, authorized → 200
- Each CRUD endpoint: happy path + validation failure + permission failure
- Audit log written on every mutation

**E2E tests (Playwright)**
- Full login → workspace selection → dashboard flow for each role
- Engineer cannot see Admin workspace card (locked state)
- Operator cannot edit compressor config (button hidden + API rejects)
- Theme toggle persists across navigation
- Inline edit → save → reload → value persisted
- CSV export downloads a file with expected headers

**Coverage gate:** 80% line coverage on `lib/`, `app/api/`, and `components/domain/`. CI fails below this.

---

## 9. Environment variables

Document all in `.env.example` with comments. At minimum:

```
# Database
DATABASE_URL=postgresql://mpc:mpc@localhost:5432/mpc

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                    # generate: openssl rand -base64 32

# Azure AD (production)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=

# Dev auth fallback (NEVER set in production)
ENABLE_DEV_CREDENTIALS_AUTH=true

# App
NODE_ENV=development
LOG_LEVEL=info
```

---

## 10. Visual design reference

The POC (`mpc-platform.jsx`) establishes the aesthetic direction: **industrial-utilitarian**, Bloomberg Terminal / SCADA influence. Carry these forward:

- **Typography:** Monospace (JetBrains Mono or similar) for readings, numerics, labels. Sans-serif (Inter alternative — pick something with character, NOT system default) for UI text. Serif italic accents for major headlines only
- **Color:** Teal/cyan accent on near-black in dark mode. Deeper cyan on warm grey in light mode. Sharp, restrained palette — no gradients except subtle area-chart fills
- **Density:** Data-first. Operators look at this for hours. Information density > whitespace
- **Status indicators:** Pulsing dot for live data. Pills with bordered backgrounds for status enums
- **Borders, not shadows:** 1px borders define panels. Avoid the floating-card SaaS look
- **Motion:** Minimal. Smooth theme transitions, hover states. No decorative animation on a control system

Implement via shadcn/ui's CSS variable theming. Define both themes in `globals.css`. Verify WCAG AA contrast — the POC was eyeballed, not measured.

---

## 11. Phase 2 readiness (architectural notes only — do not build)

Document these in `docs/architecture.md` so the Phase 1 build doesn't paint itself into a corner:

- **Real telemetry ingestion:** A separate worker service reading from RevPi PLC / MariaDB and writing to `TelemetryReading`. The web app already reads from this table, so no API changes needed. Consider TimescaleDB hypertable for `TelemetryReading` when row count exceeds ~10M
- **ML model integration:** `/api/v1/demand` and `/api/v1/models` are the seams. Phase 1 returns mock data; Phase 2 calls an inference service (likely a separate Python service — your scikit-learn pipeline experience applies here)
- **Real-time updates:** Use Server-Sent Events (or WebSockets via a separate service) for live telemetry. React Query already supports SSE-style invalidation
- **Multi-site:** Schema already has `siteId`. Add a site switcher to the TopBar. RBAC needs a site-scoped extension (`canForSite(user, site, action)`)
- **Custom roles:** Migrate from enum to a `Role` + `Permission` table. The `can()` function abstraction means UI/API code doesn't change
- **Scenario simulation:** `SimulationRun` table already exists. Build a worker that picks up `PENDING` rows, runs the optimization, writes results

---

## 12. Definition of done (Phase 1)

A feature is done when:
- [ ] TypeScript compiles with zero errors and zero `any`
- [ ] ESLint + Prettier pass
- [ ] Unit tests pass with required coverage
- [ ] E2E test exists for the user-facing flow
- [ ] RBAC enforced at API + UI layer
- [ ] Audit log written for mutations
- [ ] Loading, error, and empty states implemented
- [ ] Keyboard accessible (Tab order, Esc closes modals, Enter submits)
- [ ] Works in both themes
- [ ] Documented in `docs/api.md` (if API) or component JSDoc (if UI)
- [ ] PR description explains the change and links to the relevant section of this README

The whole platform is done when:
- [ ] `docker compose up` brings up a working system
- [ ] All three role flows work end-to-end against seed data
- [ ] All tests green, coverage gates met
- [ ] `architecture.md` documents Phase 2 seams
- [ ] README in repo root explains how to run it

---

## 13. Things to ask me before assuming

If you hit any of these, **stop and ask** rather than guessing:

1. Real Azure AD tenant credentials — I'll provide for staging
2. Branding assets (logo, brand colors) — POC uses placeholders
3. Whether to use a UI library beyond shadcn (e.g. AG Grid for the telemetry table if it gets huge)
4. Multi-site requirements becoming concrete in Phase 1
5. Anything in this doc that contradicts the product vision document
6. Compliance requirements (we may need GDPR/audit certifications for EU deployment — flag if you spot gaps)

---

## 14. First task

Once you've read this:

1. Acknowledge you've read it
2. Propose a build plan for Phase 1A (Foundation) — file list, package list, any deviations from the structure above and why
3. Wait for confirmation
4. Then scaffold

Do not skip step 3.

---

**Project lead:** Dhrumil Patel
**POC reference:** `mpc-platform.jsx`
**Spec reference:** `docs/product-vision.md`
