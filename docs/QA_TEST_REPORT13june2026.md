# QA Test Report — SARAI Platform (Phase 1–6)
**Date:** June 13, 2026  
**Tester:** Automated Code Review  
**Scope:** Phase 1 (Foundation) through Phase 6 (AI Features & Platform Integrations)  
**Status:** ⚠️ **Issues Found — Not Production Ready**

---

## Executive Summary

The SARAI platform has been built with a comprehensive architecture covering Phases 1–6 as specified in the project brief. The codebase demonstrates solid engineering patterns (NestJS modular architecture, Prisma ORM, BullMQ queue processing, Redis caching, WebSocket streaming). However, several **critical security issues**, **architectural concerns**, and **missing implementations** were identified that must be addressed before production deployment.

**Overall Score: 6.5/10** — Functionally promising but needs hardening.

---

## Phase 1 — Foundation & Core Infrastructure (Score: 6/10)

### ✅ What Works Well
- Project structure follows NestJS best practices with feature modules
- Authentication system is comprehensive: register, login, JWT, refresh tokens, OAuth Google, email verification, password reset, 2FA
- RBAC with 4 roles (OWNER, ADMIN, EDITOR, VIEWER) implemented via guards and decorators
- Rate limiting via `@nestjs/throttler` (20 requests/minute)
- Global audit logging interceptor and exception filter
- CORS configured with support for multiple origins

### ❌ Critical Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| **CR-01** | 🔴 **CRITICAL** | `.env` file committed to repository with **real production credentials** including Stripe secret key, Airbyte OAuth tokens, Google OAuth secrets, Redis password, SMTP credentials, and AI API keys | `backend/.env` | Immediately rotate ALL credentials. Add `.env` to `.gitignore`. Use environment variables or a secrets manager. |
| **CR-02** | 🔴 **CRITICAL** | Auth controller uses `@Body() body: any` bypassing DTO validation — no input validation for register/login | `auth.controller.ts` lines 17-24 | Use class-validator DTOs (e.g., `RegisterDto`, `LoginDto`) |
| **CR-03** | 🟠 **HIGH** | 2FA temp token stored directly on User model — one-time use not enforced server-side; token remains in DB even after use | `auth.service.ts` line 370 | Clear temp token after use (currently done for login but not for failed attempts) |
| **CR-04** | 🟠 **HIGH** | Rate limit of 20 req/min is extremely restrictive — will block legitimate usage (e.g., fetching dashboard list with multiple widgets) | `app.module.ts` line 64 | Increase limit to 100-200 req/min or make it configurable per endpoint |
| **CR-05** | 🟡 **MEDIUM** | Team management has two overlapping data models: `TeamMember` table AND `team.legacyUsers` field on User model | `schema.prisma` & `team.service.ts` | Consolidate to single relationship. Currently `team.service.ts` bypasses `TeamMember` and uses `User.teamId` directly |

### ⚪ Test Coverage Issues
- All `.spec.ts` files contain only the default "should be defined" test — **zero actual test logic**
- No integration tests for auth flow
- No E2E tests for user registration → login → 2FA flow

---

## Phase 2 — Data Source Engine & Connectors (Score: 7/10)

### ✅ What Works Well
- Airbyte API wrapper service with full CRUD for sources and connections
- Source catalog with enrichment and fallback catalog for offline mode
- 14-day trial system per data source with auto-expire
- Sync monitoring via Jobs API with notification integration
- OAuth flow for authentication via Airbyte

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| **CR-06** | 🟡 **MEDIUM** | `getSyncConfiguration` may return incorrect schedule data — Airbyte API v1 returns schedule at different nesting than expected | `airbyte.service.ts` line 257 | Verify Airbyte API response shape and handle `scheduleType` and `scheduleData` fields |
| **CR-07** | 🟡 **MEDIUM** | Notification on sync trigger requires user ID, but scheduler-triggered syncs have no user context — will throw error | `airbyte.service.ts` line 212-217 | Make userId optional, skip notification if not provided |
| **CR-08** | 🟡 **MEDIUM** | API base URL hardcoded to `https://api.airbyte.com/v1` — cannot change for staging/self-hosted Airbyte | `airbyte.service.ts` line 10 | Move to environment variable `AIRBYTE_API_URL` |

---

## Phase 3 — Query Engine & Data Processing (Score: 7/10)

### ✅ What Works Well
- SQL query execution via BullMQ queue with async processing
- Redis caching of query results with 5-minute TTL
- Custom fields with expression parser using `mathjs`
- Data blending with 4 join types (INNER, LEFT, RIGHT, FULL)
- Query scheduling with cron expressions
- AI-assisted SQL generation via Groq API
- Schema discovery from `synced_data` stream samples

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| **CR-09** | 🟡 **MEDIUM** | `getQueryResult` always returns "Jalankan query lagi" even when cached result exists — cache logic broken | `queries.service.ts` lines 154-173 | Fix: return cached data when available instead of showing message |
| **CR-10** | 🟡 **MEDIUM** | Blend execution limited to 5,000 rows per source and 1,000 result rows — not practical for real datasets | `blends.service.ts` lines 118, 162 | Make limits configurable or use PostgreSQL JOIN directly |
| **CR-11** | 🟢 **LOW** | `$queryRawUnsafe` used for query execution — potential SQL injection if rawSql contains user input | `queries.processor.ts` line 28 | Validate that only system-generated SQL is executed; never execute user-provided SQL directly |
| **CR-12** | 🟢 **LOW** | In-memory JOIN in blends service is O(n) per source but doesn't scale beyond 10K rows | `blends.service.ts` lines 169-242 | Implement database-level JOIN using PostgreSQL for large datasets |

---

## Phase 4 — Data Management (Score: 6.5/10)

### ✅ What Works Well
- Transfer module with execution tracking and overwrite modes
- API Queries with HTTP builder, JSONPath response mapping, and auth type support
- Warehouse module with managed tables and dynamic schemas
- Table manager with row CRUD and batch operations

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| **CR-13** | 🟠 **HIGH** | API Queries module has no URL validation — **SSRF vulnerability** allowing requests to internal network | `api-queries.service.ts` | Implement URL allowlist validation, disable private IP ranges |
| **CR-14** | 🟡 **MEDIUM** | Data transfers integration with Google Sheets/Excel not verified — no E2E test for export pipeline | `data-transfers.service.ts` | Add integration test with mock Google/Excel APIs |
| **CR-15** | 🟢 **LOW** | CSV import/export in table manager — no file size validation or column type enforcement | `table-manager.service.ts` | Add file size limits and type validation |

---

## Phase 5 — Visualization & Dashboard (Score: 6/10)

### ✅ What Works Well
- Dashboard CRUD with team scoping and auto-refresh configuration
- 8 widget types defined in schema (bar, line, pie, kpi, number, table, text, image)
- Public sharing via token-based links with expiry
- Summary statistics (users, sources, queries, executions)
- Data explorer with filter, sort, and pagination

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| **CR-16** | 🟠 **HIGH** | Dashboard uses **two parallel data storage systems**: legacy `widgets`/`layout` JSON blobs AND new `Widget` model — risk of data inconsistency | `schema.prisma` lines 302-306, `dashboard.service.ts` | Remove legacy fields; migrate all widget data to Widget model |
| **CR-17** | 🟠 **HIGH** | **No drag-drop frontend editor** — only API CRUD for widgets exists | Frontend `custom-dashboard/page.tsx` | Implement `react-grid-layout` drag-drop editor as specified in requirements |
| **CR-18** | 🟡 **MEDIUM** | Dashboard duplicate preserves `widgets` and `layout` but not actual `Widget` model records | `dashboard.service.ts` line 96-111 | Also duplicate Widget records when duplicating dashboard |
| **CR-19** | 🟢 **LOW** | No frontend for theme switching between light/dark/midnight | `dashboard.service.ts` supports theme field | Implement theme selector in dashboard editor |

---

## Phase 6 — AI Features & Platform Integrations (Score: 5.5/10)

### ✅ What Works Well
- AI chat with WebSocket streaming (Socket.IO)
- Context injection from `synced_data` with keyword matching
- Chat session management with history
- 4 insight types defined (Trend, Anomaly, Period Comparison, Forecast)
- Google Sheets export via Service Account
- Excel export via `exceljs`
- OData endpoint for Power BI connectivity
- Integration management with template gallery

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| **CR-20** | 🔴 **CRITICAL** | **Claude API not used** — uses Groq API (`llama-3.1-8b-instant`) instead of Claude API as specified in the PDF brief | `ai.service.ts` line 11-13, `queries.service.ts` line 290-338 | Implement Claude API (Anthropic) integration as contracted |
| **CR-21** | 🟠 **HIGH** | AI Gateway WebSocket authentication not fully verified — may allow unauthenticated connections | `ai.gateway.ts` | Verify JWT auth token is validated on WebSocket handshake |
| **CR-22** | 🟠 **HIGH** | **Insight scheduling not implemented** — `frequency` field exists in schema but no background scheduler runs insights | `insights.service.ts` | Implement cron-based insight generation using `@nestjs/schedule` |
| **CR-23** | 🟠 **HIGH** | **Looker Studio connector not implemented** — referenced in requirements but no Apps Script community connector | Missing file | Implement Looker Studio Community Connector as specified |
| **CR-24** | 🟡 **MEDIUM** | OpenAI SDK initialized with Groq's base URL — confusing and may break if SDK version changes | `ai.service.ts` line 10-13 | Use Groq's native SDK or use OpenAI SDK with clear documentation |
| **CR-25** | 🟢 **LOW** | AI context builder extracts only 10 rows per stream — may not be representative for meaningful analysis | `ai.service.ts` line 140 | Make sample size configurable; add summarization for larger datasets |

---

## Cross-Cutting Issues

| # | Severity | Issue | Recommendation |
|---|----------|-------|----------------|
| **CC-01** | 🔴 **CRITICAL** | **No automated tests** — all spec files only test that services "should be defined". Phase 8 target of 70% coverage is at severe risk | Implement unit tests for all services, integration tests for critical API flows |
| **CC-02** | 🔴 **CRITICAL** | **No Swagger/OpenAPI documentation** configured despite being in deliverables | Add `@nestjs/swagger` and annotate all DTOs and endpoints |
| **CC-03** | 🟠 **HIGH** | **No HTTPS enforcement** in main.ts — server runs on HTTP only | Add HTTPS support and HSTS headers |
| **CC-04** | 🟠 **HIGH** | **No request body size limits** — could lead to memory exhaustion attacks | Add body parser size limits in main.ts |
| **CC-05** | 🟡 **MEDIUM** | **Inconsistent error responses** — some endpoints return `{ message, data }`, others return `{ data }` or throw raw exceptions | Standardize API response format across all endpoints |
| **CC-06** | 🟡 **MEDIUM** | **No pagination** for list endpoints returning potentially large datasets (queries, executions, audit logs) | Add pagination (cursor or offset-based) to all list endpoints |
| **CC-07** | 🟢 **LOW** | **Frontend API client** (`apiFetch`) doesn't handle token refresh automatically | Implement automatic 401 → refresh token → retry pattern |

---

## Phase-by-Phase Compliance Matrix

| Phase | Required Deliverables | Status | Notes |
|-------|----------------------|--------|-------|
| **P1** | Project setup, DB schema (41 tables), Auth (register/login/JWT/OAuth/2FA), Team (4 roles, RBAC), Core middleware, Airbyte Cloud setup | ✅ Complete | Schema has 28 models (fewer than 41 contracted tables but covers planned scope) |
| **P2** | Airbyte API wrapper, Connection management, OAuth flow, Source catalog, Sync config, Sync monitoring, Trial system | ✅ Complete | Functional but needs schedule handling fix |
| **P3** | Query builder (6 endpoints), Execution engine (BullMQ), Custom fields, Data blending (4 join types), Query scheduling | ✅ Complete | Blend execution limited to 5K rows, needs scaling |
| **P4** | Data transfers (Google Sheets/Excel), API queries, Warehouse, Table manager | ⚠️ Partial | API queries missing URL validation (SSRF risk) |
| **P5** | Dashboard CRUD, 8 widget types, Drag-drop editor, Public sharing, Data explorer | ⚠️ Partial | **Drag-drop frontend editor NOT implemented** — only API CRUD |
| **P6** | AI Chat (Claude), AI Insights (4 types), Google Sheets, Excel, Looker Studio, Power BI | ⚠️ Partial | **Uses Groq instead of Claude**, **Looker Studio missing**, **Insight scheduler not implemented** |
| **P7** | _Not in scope for this review_ | — | Not reviewed |
| **P8** | _Not in scope for this review_ | — | No tests exist despite Phase 8 target |

---

## Recommendations Priority Matrix

### 🔴 Immediate (Must Fix Before Any Deployment)
1. **CR-01**: Rotate all exposed credentials in `.env` immediately
2. **CR-20**: Implement Claude API integration as contracted
3. **CC-01**: Add basic unit tests for critical paths
4. **CR-02**: Add DTO validation to all controller endpoints
5. **CC-03**: Add HTTPS support

### 🟠 High Priority (Fix Before Production Launch)
1. **CR-03**: Fix 2FA token one-time enforcement
2. **CR-13**: Add SSRF protection to API Queries
3. **CR-16**: Consolidate dashboard data storage (remove legacy JSON blobs)
4. **CR-17**: Implement drag-drop dashboard editor
5. **CR-22**: Implement insight scheduler
6. **CR-23**: Implement Looker Studio connector
7. **CR-05**: Consolidate team data model
8. **CC-04**: Add request body size limits

### 🟡 Medium Priority (Fix Before Phase 7/8 Completion)
1. **CR-06**: Fix Airbyte sync schedule parsing
2. **CR-09**: Fix query result cache logic
3. **CR-10**: Make blend limits configurable
4. **CR-18**: Fix dashboard duplication to include Widget records
5. **CC-05**: Standardize API response format
6. **CC-06**: Add pagination to list endpoints

### 🟢 Low Priority (Nice to Have)
1. **CR-11**: Add SQL injection safeguards for user-provided SQL
2. **CR-15**: Add file upload validations
3. **CR-19**: Implement dashboard theme selector
4. **CR-25**: Improve AI context builder sample size
5. **CC-07**: Auto token refresh in frontend

---

## Conclusion

The SARAI platform demonstrates a well-architected foundation with proper separation of concerns, modern tech stack (NestJS, Prisma, BullMQ, Redis), and comprehensive feature coverage across Phases 1–6. The Airbyte integration pattern is sound, and the query/blend/visualization pipeline is logically structured.

However, the platform has **3 critical security vulnerabilities** (exposed credentials, no input validation, missing SSRF protection), **significant gaps in contracted deliverables** (Claude AI → Groq, missing Looker Studio, no drag-drop dashboard, no insight scheduler), and **zero test coverage** despite Phase 8 targeting 70% coverage.

**Recommendation:** Address all 🔴 and 🟠 priority items before proceeding to Phase 7/8 development, and definitely before any production deployment. The architecture is solid but the implementation needs hardening.