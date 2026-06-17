# QA Test Report - SARAI Platform Full Service

**Date:** 14 June 2026  
**Tester:** Automated QA review via code inspection and local command execution  
**Scope:** Full-service QA for current implementation, focused on Phase 1 through Phase 6 deliverables  
**Reference Brief:** SARAI - System for Analysis & Response AI, phases 1-6 only  
**Result:** FAIL - Not ready for production or full-service UAT

---

## 1. Executive Summary

The SARAI platform contains many backend modules and frontend pages for the planned Phase 1-6 scope, including authentication, team management, Airbyte wrappers, query/blend/data management, dashboard, AI chat/insights, exports, integrations, and OData/BI endpoints. However, the current build quality is not stable enough for full-service release.

Main QA outcome:

- Backend production build passes.
- Backend automated tests fail: 26 failed test suites, 2 passed test suites.
- Frontend lint fails: 126 total issues, including 91 errors.
- Frontend production build fails because `@/lib/api` cannot be resolved.
- Several contracted/briefed items are incomplete or blocked by known constraints: Grok/Groq is used instead of final AI API, Airbyte direct data-source connection is limited by free plan, NestJS Render deployment is not connected, and billing details remain unfinished.
- Security and operational readiness remain high risk, especially because `.env` files and secrets appear in the local working tree and automated test coverage is not usable.

Overall QA rating: **4/10** for Phase 1-6 full-service readiness.

---

## 2. Test Environment

| Area | Detail |
|---|---|
| Repository | `sarai-platform` |
| Frontend | Next.js 16.2.2, React 19.2.4, TypeScript, Tailwind/shadcn-style components |
| Backend | NestJS 11, Prisma, PostgreSQL target, Redis/BullMQ target |
| AI implementation observed | Groq/Grok-style API key usage through OpenAI SDK pattern, not finalized Claude/Anthropic API |
| Data integration | Airbyte API wrapper present, base URL hardcoded to Airbyte Cloud API |
| Billing | Stripe module present, but pricing/plans are not final per project note |
| Commands executed | `npm test -- --runInBand`, `npm run build`, `npm run lint`, `npm run build` |

---

## 3. QA Commands Run

| Command | Location | Result | Notes |
|---|---|---|---|
| `npm test -- --runInBand` | `sarai-platform/backend` | FAIL | 26 test suites failed, 2 passed. Failures are dependency injection setup issues and ESM parsing issue from `google-spreadsheet`/`ky`. |
| `npm run build` | `sarai-platform/backend` | PASS | NestJS build completed successfully. |
| `npm run lint` | `sarai-platform/frontend` | FAIL | 126 problems: 91 errors, 35 warnings. Common issues: `any` types, unescaped entities, setState in effects, image/a11y warnings. |
| `npm run build` | `sarai-platform/frontend` | FAIL | Next/Turbopack cannot resolve `@/lib/api` in AI chat, AI insights, and integrations pages. |

---

## 4. Phase Compliance Summary

| Phase | Brief Requirement | QA Status | Summary |
|---|---|---|---|
| Phase 1 - Foundation & Core Infrastructure | Project setup, DB schema, auth, team/RBAC, middleware, Airbyte setup | PARTIAL | Backend structure exists and build passes, but tests fail, secrets handling is risky, and production hardening is incomplete. |
| Phase 2 - Data Source Engine & Connectors | Airbyte wrapper, connection management, OAuth, catalog, sync config, monitoring, trial | PARTIAL / BLOCKED | Airbyte wrapper and catalog exist. Direct connector validation is blocked by Airbyte free-plan limitation and external API availability. |
| Phase 3 - Query Engine & Data Processing | Query builder/execution, custom fields, blending, scheduling | PARTIAL | Modules exist, but automated tests fail and scaling/validation risks remain. No successful E2E query execution was verified. |
| Phase 4 - Data Management | Transfers, API queries, warehouse, table manager | PARTIAL | Modules/pages exist. Export/API-query flows were not verified end-to-end. SSRF and input validation risks should be reviewed before enabling arbitrary HTTP queries. |
| Phase 5 - Visualization & Dashboard | Dashboard API, widgets, drag-drop frontend, public sharing, explorer | PARTIAL | Dashboard/data explorer UI exists, but frontend lint/build failure blocks production. Drag-drop/dashboard behavior needs browser E2E validation after build is fixed. |
| Phase 6 - AI Features & Platform Integrations | AI chat, AI insights, Sheets, Excel, Looker Studio, Power BI, integration management | PARTIAL / BLOCKED | AI uses temporary Grok/Groq API per project note, not final AI service. Looker/Power BI appear to rely on OData style integration rather than complete custom connector artifacts. |

---

## 5. Critical Findings

### CR-01 - Frontend production build fails

**Severity:** Critical  
**Area:** Frontend / Release readiness  
**Evidence:** `npm run build` in `sarai-platform/frontend` fails with module resolution errors:

- `app/(dashboard)/ai-chat/page.tsx` cannot resolve `@/lib/api`
- `app/(dashboard)/ai-insights/page.tsx` cannot resolve `@/lib/api`
- `app/(dashboard)/integrations/page.tsx` cannot resolve `@/lib/api`

**Likely cause:** `frontend/tsconfig.json` does not define a path alias for `@/*`, while files import from `@/lib/api`.

**Impact:** Frontend cannot be deployed as a production build. Phase 5 and Phase 6 frontend functionality cannot pass full-service QA.

**Recommendation:** Add the correct `baseUrl` and `paths` configuration or replace alias imports with relative imports, then rerun `npm run build`.

---

### CR-02 - Backend automated test suite fails heavily

**Severity:** Critical  
**Area:** Backend / Test readiness  
**Evidence:** `npm test -- --runInBand` reports:

- Test Suites: 26 failed, 2 passed, 28 total
- Tests: 25 failed, 2 passed, 27 total

Common failure categories:

- Nest dependency injection failures in service/controller specs because required providers such as `PrismaService` or module dependencies are not mocked/imported.
- Jest cannot parse ESM dependency from `ky` through `google-spreadsheet`.

**Impact:** The backend cannot demonstrate regression safety. Phase 8 target of meaningful coverage is at risk, and Phase 1-6 modules cannot be trusted through automated QA.

**Recommendation:** Fix test module setup with proper mocked providers, update Jest transform settings for ESM dependencies or mock external SDKs, and add real behavioral tests beyond `should be defined`.

---

### CR-03 - Frontend lint fails with many blocking errors

**Severity:** High  
**Area:** Frontend quality  
**Evidence:** `npm run lint` reports 126 problems, including 91 errors.

Examples:

- `@typescript-eslint/no-explicit-any` across dashboard, integrations, data sources, explorer, warehouse, table manager, and shared pages.
- `react/no-unescaped-entities` in auth, marketing, data source, data transfer, and warehouse pages.
- `react-hooks/set-state-in-effect` in AI chat, AI insights, dashboard header, and dashboard page.
- Image and accessibility warnings such as raw `<img>` usage and missing `alt` attributes.

**Impact:** Code quality gate fails. Next.js/React 19 linting identifies patterns that may cause performance, accessibility, and maintainability issues.

**Recommendation:** Prioritize build-blocking and rule-critical issues first, introduce shared frontend response types, and clean unescaped copy/a11y issues.

---

### CR-04 - AI provider is temporary and not production-final

**Severity:** High  
**Area:** Phase 6 / AI Chat and Insights  
**Evidence:** Code references `GROQ_API_KEY` in:

- `backend/src/ai/ai.service.ts`
- `backend/src/insights/insights.service.ts`
- `backend/src/queries/queries.service.ts`

Project note says the AI chatbot API is not perfect yet and Grok is being used temporarily.

**Impact:** AI quality, reliability, rate limits, billing, and prompt behavior are not final. This should not be signed off as complete Phase 6 AI delivery.

**Recommendation:** Mark AI as beta/temporary, document expected behavior and fallback behavior, and create a provider abstraction so the final AI API can replace Grok/Groq safely.

---

### CR-05 - Airbyte direct connection flow cannot be fully validated on current plan

**Severity:** High  
**Area:** Phase 2 / Connectors  
**Evidence:** Project note states Airbyte API is still on the free plan and new data sources cannot be connected directly yet. Code inspection also shows Airbyte API base URL hardcoded to `https://api.airbyte.com/v1` in `backend/src/airbyte/airbyte.service.ts`.

**Impact:** Full connector creation, OAuth, sync scheduling, and sync monitoring cannot be verified end-to-end under current account limitations.

**Recommendation:** Keep Airbyte connector QA marked as blocked until the paid/required plan and credentials are available. Move Airbyte base URL and workspace configuration into environment variables.

---

### CR-06 - Deployment target for NestJS is not connected

**Severity:** High  
**Area:** Infrastructure / Deployment  
**Evidence:** Project note says NestJS recommendation is Render.com, but it has not been connected yet.

**Impact:** Backend production runtime, environment variables, webhooks, scheduled jobs, and external integrations cannot be validated in a production-like environment.

**Recommendation:** Configure Render service for backend, attach environment variables securely, add health checks, and rerun smoke tests against deployed URL.

---

### CR-07 - Billing scope is not final

**Severity:** High  
**Area:** Billing / Business logic  
**Evidence:** Project note says billing data is still a gray area and plan/pricing structure is not finalized. Code contains Stripe billing module and Settings billing UI.

**Impact:** Billing QA cannot be considered complete because expected products, plans, quotas, upgrade/downgrade behavior, and invoice rules are unknown.

**Recommendation:** Freeze billing requirements before final QA. Until then, test only technical Stripe wiring in sandbox mode and mark business acceptance as pending.

---

## 6. Functional QA Notes by Service Area

### Authentication and Team Management

Status: **Partial pass with test gap**

- Auth, OAuth, JWT, team, roles, and guards appear in backend structure.
- Automated specs do not currently validate real register/login/RBAC behavior.
- Full QA still needs API-level tests for register, email verification, login, refresh, logout, password reset, Google OAuth callback, Microsoft OAuth if included, 2FA setup, and role-based access denial.

### Data Sources and Airbyte

Status: **Blocked for live connection testing**

- Airbyte service, source catalog, data source scheduler, and trial service exist.
- Free-plan limitation prevents full direct source connection validation.
- Need controlled sandbox credentials for Google Ads/GA4/Facebook/etc. to test OAuth and sync lifecycle.

### Query, Custom Fields, and Blending

Status: **Partial / not E2E verified**

- Query, processor, scheduler, custom fields, and blends modules exist.
- Backend test suite failure prevents automated confidence.
- Need seeded `synced_data` tables to verify SQL generation, filters, date range, async queue execution, cache behavior, custom field formula results, and join output.

### Data Management

Status: **Partial / risk found**

- Data transfers, API queries, warehouse, and table manager modules/pages exist.
- API query feature should be treated as security-sensitive because user-defined outbound HTTP requests can become SSRF if not restricted.
- Need validation for CSV size/type, warehouse retention, transfer overwrite modes, and external export credentials.

### Dashboard and Visualization

Status: **Blocked by frontend build failure**

- Dashboard/editor/data explorer pages exist.
- Production frontend build cannot complete.
- Drag-drop layout, public share token, widget rendering, data refresh, and responsive behavior require browser E2E after build is fixed.

### AI Chat and Insights

Status: **Beta / not final provider**

- AI chat, gateway, sessions, insights, and frontend pages exist.
- Current provider is temporary Grok/Groq according to project note and code evidence.
- Need QA for authentication on WebSocket connections, streaming stability, context retrieval correctness, prompt safety, hallucination handling, rate limits, and fallback responses.

### Integrations and Exports

Status: **Partial / external dependencies not fully verified**

- Google Sheets, Excel, OData, integrations service, and frontend page exist.
- Looker Studio and Power BI appear to be supported through OData-style endpoint references; complete custom connector files/artifacts were not verified.
- Need sandbox credentials and real destination documents/workspaces for full validation.

---

## 7. Security and Compliance Risks

| Risk | Severity | Notes | Recommendation |
|---|---|---|---|
| Local `.env` files visible in workspace | Critical | Backend `.env` and frontend `.env.local` are present in the working tree. If committed or shared, credentials may leak. | Ensure `.env` files are ignored, rotate any exposed keys, use secrets manager/Render environment variables. |
| External HTTP request builder | High | API queries can become SSRF without strict URL validation. | Block private IP ranges, localhost, metadata IPs, and unsupported protocols. Add allowlist option. |
| Weak automated QA | Critical | Test suite fails before validating behavior. | Fix specs and CI gate before UAT. |
| WebSocket auth needs verification | High | AI chat uses realtime socket flow, which must validate JWT on handshake and per event. | Add integration tests for unauthenticated and expired-token socket attempts. |
| Billing/webhook security pending | High | Stripe webhook exists but plan rules are unfinished. | Verify signature handling, idempotency, replay protection, and sandbox test events. |
| Public dashboard sharing | Medium | Token-based sharing must avoid data leaks across teams. | Add tests for token expiry, revoked tokens, and cross-team access. |

---

## 8. Recommended Test Cases for Next QA Cycle

### API Smoke Tests

- Register user, verify email, login, refresh token, logout.
- Create team, invite member, accept invitation, enforce Owner/Admin/Editor/Viewer permissions.
- List Airbyte source catalog without live connection.
- Attempt Airbyte connection creation with mocked Airbyte response.
- Create query against seeded synced table, execute query, poll execution result.
- Create custom field and validate formula output.
- Create blend from two seeded sources and validate join result.
- Create dashboard, add all 8 widget types, generate public share token.
- Start AI chat session, send prompt, receive streamed response.
- Create AI insight config and generate each insight type.
- Export sample query result to Google Sheets and Excel sandbox destinations.

### Frontend E2E Tests

- Auth pages: login, register, forgot password, reset password.
- Dashboard shell: sidebar, team switcher, route guards, logout.
- Data source catalog and connection wizard.
- Query builder and result viewer.
- Dashboard editor drag/drop and public share page.
- AI chat streaming UI and error handling when token/API is missing.
- Integrations page and OData endpoint copy flow.
- Billing settings once pricing is finalized.

### Non-Functional Tests

- Load test query execution queue and dashboard read endpoints.
- Validate rate limiting behavior per endpoint category.
- Dependency vulnerability scan.
- OWASP checks for auth/session, SSRF, injection, insecure direct object reference, and CORS.
- Backup/restore test for PostgreSQL and Prisma migrations.

---

## 9. Priority Fix Plan

### Must Fix Before Full-Service UAT

1. Fix frontend `@/lib/api` import resolution and confirm `npm run build` passes.
2. Fix backend Jest setup so all tests at least run deterministically.
3. Add meaningful backend tests for auth, RBAC, query execution, dashboard share, AI endpoints, and billing webhook signature handling.
4. Resolve frontend lint errors or tune lint rules intentionally with documented rationale.
5. Move all secrets out of files and into environment/secret management.
6. Mark AI feature as beta until final provider is selected and validated.
7. Mark Airbyte live connection testing as blocked until the required Airbyte plan is available.
8. Freeze billing products/plans before signing off billing screens and Stripe flows.

### Should Fix Before Production

1. Configure Render.com or selected backend host and run deployment smoke tests.
2. Add Swagger/OpenAPI documentation for backend endpoints.
3. Add request body size limits and consistent API response format.
4. Add SSRF protection to API query builder.
5. Add E2E tests with seeded demo data for Phase 1-6 critical flows.
6. Validate public dashboard access controls and token expiry.
7. Implement monitoring/health endpoints for backend, queues, Redis, database, and Airbyte sync status.

---

## 10. Final QA Verdict

**Current verdict:** FAIL for full-service QA.

The codebase has broad Phase 1-6 feature coverage, but it is not ready for production or final UAT because the frontend cannot build, frontend lint fails, backend tests fail, and several external/contracted services are either temporary, not connected, or not finalized.

**Acceptable next milestone:** Internal development QA only, after fixing the frontend build and backend test suite.

**Not acceptable yet:** Production release, client UAT sign-off, billing sign-off, Airbyte connector sign-off, or final AI feature sign-off.
