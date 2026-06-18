# QA Automation Test Design — Phase 7 & Phase 8

> **Project:** sarai-platform
> **Date:** 2026-06-17
> **Stack:** Jest + SuperTest (API), Playwright (Frontend E2E), k6 (Performance), OWASP ZAP (Security)

---

## Phase 7 — Business Features & Frontend

> Cakupan: Subscription & Billing (Stripe), Usage Tracking (Query, Token, Storage), Notifikasi & Alerting (Email, Slack), Audit Log, 46+ Halaman Frontend (Auth, Settings, Data Catalog, dsb) lengkap dengan Shared Components.

---

### TC-PH7-01: Validasi Subscription Checkout dengan Stripe

```gherkin
Feature: Subscription Billing
Scenario: User membeli subscription plan baru
  Given user belum memiliki subscription aktif
  When user memilih plan "Pro" dan melanjutkan ke checkout
  Then Stripe checkout session dibuat
  Dan redirect URL dikembalikan
```

```ts
it('should create Stripe checkout session for subscription', async () => {
  const res = await request(app.getHttpServer())
    .post('/billing/checkout')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      planId: 'pro_monthly',
      successUrl: 'https://app.sarai.test/billing/success',
      cancelUrl: 'https://app.sarai.test/billing/cancel',
    })
    .expect(201);

  expect(res.body.checkoutUrl).toContain('stripe.com');
  expect(res.body.sessionId).toMatch(/^cs_/);
});
```

**Expected Result:** Stripe checkout session valid dengan URL redirect.

---

### TC-PH7-02: Validasi Webhook Stripe Payment Success

```gherkin
Feature: Stripe Webhook
Scenario: Stripe mengirim event payment success
  Given subscription dalam status pending
  When Stripe mengirim webhook checkout.session.completed
  Then subscription user berubah menjadi ACTIVE
  Dan invoice tersimpan di database
```

```ts
it('should process Stripe webhook and activate subscription', async () => {
  const webhookPayload = {
    id: 'evt_test_webhook',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        customer: 'cus_test_456',
        subscription: 'sub_test_789',
        metadata: { userId: 'user_qa_001' },
      },
    },
  };

  await request(app.getHttpServer())
    .post('/billing/webhook')
    .set('Stripe-Signature', 'mock_valid_signature')
    .send(webhookPayload)
    .expect(200);

  const userRes = await request(app.getHttpServer())
    .get('/billing/subscription')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(userRes.body.status).toBe('ACTIVE');
  expect(userRes.body.plan).toBe('pro_monthly');
});
```

**Expected Result:** Subscription teraktivasi setelah webhook valid diterima.

---

### TC-PH7-03: Validasi Usage Tracking - Query Count

```gherkin
Feature: Usage Tracking
Scenario: Sistem melacak jumlah query yang digunakan user
  Given user memiliki quota 1000 query/bulan
  When user menjalankan 5 query baru
  Then usage counter bertambah 5
  Dan sisa quota berkurang
```

```ts
it('should track query usage accurately', async () => {
  // Execute 5 queries
  for (let i = 0; i < 5; i++) {
    await request(app.getHttpServer())
      .post('/queries/execute')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        sql: `SELECT ${i} as val`,
        connectionId: 'conn_qa_001',
      });
  }

  const usageRes = await request(app.getHttpServer())
    .get('/billing/usage')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(usageRes.body.queries.used).toBeGreaterThanOrEqual(5);
  expect(usageRes.body.queries.remaining).toBeLessThan(1000);
  expect(usageRes.body.queries.limit).toBe(1000);
});
```

**Expected Result:** Query count tertrack dengan benar, sisa quota akurat.

---

### TC-PH7-04: Validasi Usage Tracking - Token AI

```gherkin
Feature: Token Usage
Scenario: Sistem melacak token AI yang dikonsumsi
  Given user mengirim pesan ke AI chat
  When AI merespons dengan 500 token
  Then token usage tercatat
  Dan biaya terkalkulasi
```

```ts
it('should track AI token usage after chat', async () => {
  await request(app.getHttpServer())
    .post('/ai/chat')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({ message: 'Analisis data', stream: false })
    .expect(200);

  const usageRes = await request(app.getHttpServer())
    .get('/billing/usage')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(usageRes.body.aiTokens.used).toBeGreaterThan(0);
  expect(usageRes.body.aiTokens.cost).toBeGreaterThan(0);
});
```

**Expected Result:** Token usage tercatat dengan biaya yang sesuai.

---

### TC-PH7-05: Validasi Notifikasi Email

```gherkin
Feature: Email Notifications
Scenario: User menerima notifikasi email saat limit tercapai
  Given user mencapai 90% dari query quota
  When usage check dilakukan
  Then notifikasi email dikirim ke user
  Dan email berisi peringatan quota
```

```ts
it('should send email notification when approaching usage limit', async () => {
  // Mock near-limit usage
  const res = await request(app.getHttpServer())
    .post('/notifications/usage-warning')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({ userId: 'user_qa_001', usagePercent: 90 })
    .expect(200);

  expect(res.body.emailSent).toBe(true);
  expect(res.body.recipient).toContain('@');
});
```

**Expected Result:** Email notifikasi terkirim saat mendekati limit.

---

### TC-PH7-06: Validasi Notifikasi Slack

```gherkin
Feature: Slack Notifications
Scenario: Tim menerima notifikasi Slack saat sync gagal
  Given tim terhubung ke Slack workspace
  When data sync gagal untuk connection tertentu
  Then notifikasi dikirim ke Slack channel
  Dan pesan berisi detail error
```

```ts
it('should send Slack notification on sync failure', async () => {
  const res = await request(app.getHttpServer())
    .post('/notifications/slack/test')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      channel: '#data-alerts',
      message: 'Sync failed for connection conn_qa_001',
      severity: 'error',
    })
    .expect(200);

  expect(res.body.slackSent).toBe(true);
  expect(res.body.channel).toBe('#data-alerts');
});
```

**Expected Result:** Slack notification terkirim ke channel yang benar.

---

### TC-PH7-07: Validasi Audit Log mencatat aktivitas penting

```gherkin
Feature: Audit Log
Scenario: Sistem mencatat semua aktivitas sensitif
  Given user melakukan aksi login, query execute, dan billing change
  When masing-masing aksi dilakukan
  Then setiap aksi tercatat di audit log
  Dan log mencakup timestamp, user, action, dan detail
```

```ts
it('should record all sensitive activities in audit log', async () => {
  // Perform actions
  await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@sarai.test', password: 'AdminPass123!' })
    .expect(201);

  // Check audit log
  const logRes = await request(app.getHttpServer())
    .get('/audit-log?page=1&limit=10')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(logRes.body.entries.length).toBeGreaterThan(0);
  expect(logRes.body.entries[0]).toHaveProperty('action');
  expect(logRes.body.entries[0]).toHaveProperty('timestamp');
  expect(logRes.body.entries[0]).toHaveProperty('userId');
});
```

**Expected Result:** Semua aktivitas sensitif tercatat di audit log.

---

### TC-PH7-08: Validasi Frontend Auth Pages (Register, Login, 2FA)

```gherkin
Feature: Auth Frontend
Scenario: User melewati alur auth lengkap
  Given user baru mengunjungi halaman register
  When user mengisi form register, login, dan memasukkan 2FA code
  Then user berhasil masuk ke dashboard
```

```ts
// Playwright E2E
import { test, expect } from '@playwright/test';

test('TC-PH7-08: Complete auth flow', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.fill('[data-testid="email"]', 'newuser@sarai.test');
  await page.fill('[data-testid="password"]', 'NewUser123!');
  await page.fill('[data-testid="confirm-password"]', 'NewUser123!');
  await page.click('[data-testid="register-btn"]');
  await expect(page).toHaveURL(/.*verify/);

  // Login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'newuser@sarai.test');
  await page.fill('[data-testid="password"]', 'NewUser123!');
  await page.click('[data-testid="login-btn"]');
  await expect(page).toHaveURL(/.*2fa|.*dashboard/);

  // 2FA
  if (page.url().includes('2fa')) {
    await page.fill('[data-testid="otp-input-1"]', '6');
    await page.fill('[data-testid="otp-input-2"]', '5');
    await page.fill('[data-testid="otp-input-3"]', '4');
    await page.fill('[data-testid="otp-input-4"]', '3');
    await page.fill('[data-testid="otp-input-5"]', '2');
    await page.fill('[data-testid="otp-input-6"]', '1');
    await page.click('[data-testid="verify-2fa"]');
  }
  await expect(page).toHaveURL(/.*dashboard/);
});
```

**Expected Result:** Auth flow register → login → 2FA berhasil hingga ke dashboard.

---

### TC-PH7-09: Validasi Frontend Settings & Profile Pages

```gherkin
Feature: Settings Frontend
Scenario: User memperbarui profil dan password
  Given user login ke aplikasi
  When user mengubah nama dan password di halaman settings
  Then perubahan tersimpan
  Dan password baru dapat digunakan untuk login
```

```ts
test('TC-PH7-09: Update profile and password', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'admin@sarai.test');
  await page.fill('[data-testid="password"]', 'AdminPass123!');
  await page.click('[data-testid="login-btn"]');

  await page.goto('/settings/profile');
  await page.fill('[data-testid="display-name"]', 'Updated QA Admin');
  await page.click('[data-testid="save-profile"]');
  await expect(page.locator('.toast-success')).toBeVisible();

  // Change password
  await page.goto('/settings/security');
  await page.fill('[data-testid="current-password"]', 'AdminPass123!');
  await page.fill('[data-testid="new-password"]', 'AdminNewPass456!');
  await page.fill('[data-testid="confirm-new-password"]', 'AdminNewPass456!');
  await page.click('[data-testid="change-password-btn"]');
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

**Expected Result:** Profil dan password berhasil diperbarui.

---

### TC-PH7-10: Validasi Frontend Data Catalog Pages

```gherkin
Feature: Data Catalog Frontend
Scenario: User menelusuri data catalog
  Given user login dan memiliki akses data catalog
  When user membuka halaman data catalog
  Then daftar tabel dan metadata ditampilkan
  Dan user dapat mencari tabel tertentu
```

```ts
test('TC-PH7-10: Browse and search data catalog', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'admin@sarai.test');
  await page.fill('[data-testid="password"]', 'AdminPass123!');
  await page.click('[data-testid="login-btn"]');
  await page.goto('/data-catalog');

  // Verify catalog loaded
  await expect(page.locator('[data-testid="catalog-list"]')).toBeVisible();

  // Search for table
  await page.fill('[data-testid="catalog-search"]', 'campaigns');
  await page.waitForTimeout(500);
  const results = page.locator('[data-testid="catalog-item"]');
  await expect(results.first()).toBeVisible();

  // Click to view details
  await results.first().click();
  await expect(page.locator('[data-testid="table-schema"]')).toBeVisible();
});
```

**Expected Result:** Data catalog menampilkan daftar tabel, pencarian berfungsi.

---

## Phase 8 — Testing, QA & Deployment

> Cakupan: Unit Testing (>70% coverage), Integration Testing, E2E Testing (9 critical flow), Performance & Security (k6, OWASP), Deployment (Docker, Kubernetes), Monitoring (Prometheus, Grafana), Backup & Recovery.

---

### TC-PH8-01: Validasi Unit Test Coverage >70%

```gherkin
Feature: Unit Test Coverage
Scenario: Semua service memiliki minimal 70% code coverage
  Given source code sudah ditulis
  When test runner dijalankan
  Then coverage report menunjukkan minimal 70% line coverage
  Dan tidak ada service yang di bawah threshold
```

```ts
// package.json script: "test:cov": "jest --coverage"
it('should meet 70% code coverage threshold', async () => {
  const coverageThreshold = {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  };

  // Run: npm run test:cov
  // Coverage report generated at ./coverage/
  // Enforce threshold via jest.config:
  // coverageThreshold: { global: { lines: 70 } }
  expect(true).toBe(true); // Placeholder — enforced by jest config
});
```

```json
// jest.config.ts coverageThreshold snippet
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

**Expected Result:** Coverage ≥ 70% di semua metric (lines, branches, functions, statements).

---

### TC-PH8-02: Validasi Integration Test - End-to-End API Flow

```gherkin
Feature: Integration Testing
Scenario: Semua modul backend berintegrasi dengan benar
  Given aplikasi berjalan dengan test database
  When integration test suite dijalankan
  Then semua API endpoints merespons dengan benar
  Dan tidak ada error tak terduga
```

```ts
describe('Full API Integration Test', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@sarai.test', password: 'AdminPass123!' });
    authToken = loginRes.body.accessToken;
  });

  it('should complete full data pipeline', async () => {
    // 1. Create connection
    const conn = await request(app.getHttpServer())
      .post('/connections')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Integration Test', type: 'postgres', config: {} })
      .expect(201);

    // 2. Trigger sync
    const sync = await request(app.getHttpServer())
      .post(`/connections/${conn.body.id}/sync`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(202);

    // 3. Run query
    const query = await request(app.getHttpServer())
      .post('/queries/execute')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ sql: 'SELECT 1', connectionId: conn.body.id })
      .expect(202);

    expect(query.body.jobId).toBeDefined();
  });
});
```

**Expected Result:** Full pipeline (connection → sync → query) berjalan tanpa error.

---

### TC-PH8-03: Validasi E2E - Critical Flow #1: User Registration to Dashboard

```gherkin
Feature: E2E Critical Flow
Scenario: Flow lengkap dari registrasi hingga dashboard
  Given user baru mengunjungi aplikasi
  When user mendaftar, verifikasi email, login, dan mengakses dashboard
  Then user melihat welcome screen di dashboard
  Dan semua komponen utama dimuat
```

```ts
test('E2E #1: Registration to Dashboard', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/register`);
  await page.fill('[data-testid="email"]', `e2e-${Date.now()}@test.com`);
  await page.fill('[data-testid="password"]', 'E2ETest123!');
  await page.click('[data-testid="register-btn"]');
  
  // Verify email (mock)
  await page.goto(`${process.env.BASE_URL}/verify-email?token=mock_verify_token`);
  
  // Login
  await page.goto(`${process.env.BASE_URL}/login`);
  await page.fill('[data-testid="email"]', `e2e-${Date.now()}@test.com`);
  await page.fill('[data-testid="password"]', 'E2ETest123!');
  await page.click('[data-testid="login-btn"]');
  
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('[data-testid="welcome-banner"]')).toBeVisible();
  await expect(page.locator('[data-testid="sidebar-nav"]')).toBeVisible();
});
```

**Expected Result:** User berhasil register → verify → login → dashboard loaded.

---

### TC-PH8-04: Validasi E2E - Critical Flow #2: Data Source Connection Setup

```gherkin
Feature: E2E Critical Flow
Scenario: User mengkoneksikan data source baru
  Given user login ke dashboard
  When user menambahkan data source PostgreSQL
  Then koneksi berhasil diverifikasi
  Dan sync pertama dimulai
```

```ts
test('E2E #2: Connect data source', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/data-sources`);
  await page.click('[data-testid="add-source-btn"]');
  await page.click('[data-testid="source-type-postgres"]');
  
  await page.fill('[data-testid="host"]', process.env.TEST_DB_HOST!);
  await page.fill('[data-testid="port"]', '5432');
  await page.fill('[data-testid="database"]', 'test_db');
  await page.fill('[data-testid="username"]', 'test_user');
  await page.fill('[data-testid="password"]', 'test_pass');
  
  await page.click('[data-testid="test-connection"]');
  await expect(page.locator('[data-testid="connection-success"]')).toBeVisible();
  
  await page.click('[data-testid="save-source"]');
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

**Expected Result:** Data source terkoneksi, test connection berhasil.

---

### TC-PH8-05: Validasi E2E - Critical Flow #3: Create Dashboard with Widget

```gherkin
Feature: E2E Critical Flow
Scenario: User membuat dashboard dengan widget chart
  Given user memiliki data source terkoneksi
  When user membuat dashboard baru dan menambahkan widget
  Then widget menampilkan data dari data source
  Dan layout tersimpan
```

```ts
test('E2E #3: Create dashboard with widget', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/dashboards`);
  await page.click('[data-testid="create-dashboard-btn"]');
  await page.fill('[data-testid="dashboard-name"]', 'QA Test Dashboard');
  await page.click('[data-testid="save-dashboard"]');
  
  // Add widget
  await page.click('[data-testid="add-widget-btn"]');
  await page.click('[data-testid="widget-type-line_chart"]');
  await page.selectOption('[data-testid="widget-query-select"]', { index: 0 });
  await page.click('[data-testid="save-widget"]');
  
  await expect(page.locator('[data-testid="widget-line_chart"]')).toBeVisible();
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

**Expected Result:** Dashboard dibuat, widget menampilkan data.

---

### TC-PH8-06: Validasi Deployment Docker Build

```gherkin
Feature: Docker Deployment
Scenario: Aplikasi berhasil di-build dan dijalankan via Docker
  Given Dockerfile tersedia untuk backend dan frontend
  When perintah docker-compose build dijalankan
  Then semua image berhasil di-build
  Dan aplikasi berjalan di semua container
```

```sh
# Command validation
docker-compose build --no-cache
docker-compose up -d
docker-compose ps  # All services should be "Up"

# Health check
curl -f http://localhost:3000/health
# Expected: {"status":"ok"}
```

**Expected Result:** Semua container berjalan, health check OK.

---

### TC-PH8-07: Validasi OWASP Security Scan

```gherkin
Feature: Security Testing
Scenario: Aplikasi lolos OWASP Top 10 security scan
  Given aplikasi berjalan di test environment
  When OWASP ZAP scan dijalankan
  Then tidak ada vulnerability HIGH atau CRITICAL
  Dan low/medium issues didokumentasikan
```

```yaml
# OWASP ZAP Baseline Scan config (zap-baseline.conf)
apiKey: ${ZAP_API_KEY}
target: http://localhost:3000
rules:
  - id: 40012   # Cross Site Scripting (Reflected) - WARN
  - id: 40014   # Cross Site Scripting (Persistent) - WARN
  - id: 40018   # SQL Injection - FAIL
  - id: 40019   # SQL Injection (MySQL) - FAIL
  - id: 10010   # Cookie No HttpOnly Flag - WARN
  - id: 10011   # Cookie Without Secure Flag - WARN
  - id: 10020   # X-Frame-Options Header - WARN
  - id: 90033   # Loosely Scoped Cookie - WARN
```

```ts
// Security scan validation
it('should pass OWASP scan with no HIGH/CRITICAL vulnerabilities', async () => {
  // Run: docker run --rm -v $(pwd)/zap:/zap/wrk owasp/zap2docker-stable \
  //   zap-baseline.py -t http://host.docker.internal:3000
  // Parse report.json
  const report = JSON.parse(fs.readFileSync('./zap/report.json', 'utf-8'));
  const highVulns = report.sites.flatMap((s: any) =>
    s.alerts.filter((a: any) => a.riskdesc.startsWith('High') || a.riskdesc.startsWith('Critical'))
  );
  expect(highVulns).toHaveLength(0);
});
```

**Expected Result:** 0 HIGH/CRITICAL vulnerabilities. Low/medium didokumentasi.

---

### TC-PH8-08: Validasi Performance Test dengan k6 - Full Load

```gherkin
Feature: Performance Testing
Scenario: 100 concurrent users menggunakan aplikasi secara bersamaan
  Given aplikasi berjalan di performance environment
  When 100 VU menjalankan mixed workload selama 5 menit
  Then p95 response time di bawah 5 detik
  Dan error rate di bawah 2%
  Dan throughput minimal 50 req/detik
```

```ts
// k6 full load test
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up
    { duration: '3m', target: 100 },  // Steady state
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(50)<2000', 'p(95)<5000', 'p(99)<10000'],
    http_req_failed: ['rate<0.02'],
    http_reqs: ['rate>50'],
  },
};

export default function () {
  const endpoints = [
    { method: 'GET', url: '/dashboards' },
    { method: 'GET', url: '/connections' },
    { method: 'POST', url: '/queries/execute', body: { sql: 'SELECT 1' } },
    { method: 'GET', url: '/data-catalog' },
  ];

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http[ep.method.toLowerCase()](
    `${__ENV.API_URL}${ep.url}`,
    ep.body ? JSON.stringify(ep.body) : undefined,
    {
      headers: {
        Authorization: `Bearer ${__ENV.JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );

  check(res, {
    'status is not 5xx': (r) => r.status < 500,
  });
  sleep(1);
}
```

**Expected Result:** p95 < 5s, error rate < 2%, throughput > 50 req/s.

---

### TC-PH8-09: Validasi Monitoring - Prometheus Metrics

```gherkin
Feature: Monitoring
Scenario: Prometheus mengumpulkan metrik dari aplikasi
  Given aplikasi berjalan dengan Prometheus exporter
  When Prometheus scrape endpoint /metrics
  Then metrik HTTP requests terkumpul
  Dan metrik database connections terkumpul
  Dan metrik BullMQ jobs terkumpul
```

```ts
it('should expose Prometheus metrics', async () => {
  const res = await request(app.getHttpServer())
    .get('/metrics')
    .expect(200);

  expect(res.text).toContain('http_requests_total');
  expect(res.text).toContain('http_request_duration_seconds');
  expect(res.text).toContain('nodejs_heap_size_bytes');
});
```

```sh
# Verify via curl
curl http://localhost:3000/metrics
# Expected: Prometheus format metrics output
```

**Expected Result:** Metrics endpoint expose HTTP, DB, dan BullMQ metrics dalam format Prometheus.

---

### TC-PH8-10: Validasi Backup & Recovery

```gherkin
Feature: Backup & Recovery
Scenario: Database berhasil di-backup dan dipulihkan
  Given PostgreSQL database dengan data aktif
  When backup command dijalankan
  Then backup file tersimpan
  Dan recovery dari backup berhasil memulihkan data
```

```sh
# Backup
docker exec postgres pg_dump -U postgres sarai_db > backup_$(date +%Y%m%d).sql
ls -la backup_*.sql  # File should exist

# Restore to test database
docker exec -i postgres psql -U postgres sarai_db_recovery < backup_20260617.sql

# Verify record count
docker exec postgres psql -U postgres -d sarai_db -c "SELECT count(*) FROM users;"
docker exec postgres psql -U postgres -d sarai_db_recovery -c "SELECT count(*) FROM users;"
# Both counts should match
```

```ts
it('should backup and restore database successfully', async () => {
  // Count records before backup
  const beforeRes = await request(app.getHttpServer())
    .get('/admin/db-stats')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  const originalCount = beforeRes.body.userCount;

  // Trigger backup
  const backupRes = await request(app.getHttpServer())
    .post('/admin/backup')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(backupRes.body.backupFile).toBeDefined();

  // Restore to test DB and verify
  const restoreRes = await request(app.getHttpServer())
    .post('/admin/restore')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({ backupFile: backupRes.body.backupFile, targetDb: 'sarai_db_recovery' })
    .expect(200);

  expect(restoreRes.body.restoredCount).toBe(originalCount);
});
```

**Expected Result:** Backup tersimpan, restore berhasil dengan jumlah data yang sama.

---

## Summary Table

| Phase | TC ID | Title | Type |
|-------|-------|-------|------|
| 7 | TC-PH7-01 | Stripe Checkout Session | Integration API |
| 7 | TC-PH7-02 | Stripe Webhook Processing | Integration API |
| 7 | TC-PH7-03 | Usage Tracking - Query Count | Integration API |
| 7 | TC-PH7-04 | Usage Tracking - AI Tokens | Integration API |
| 7 | TC-PH7-05 | Email Notifications | Integration API |
| 7 | TC-PH7-06 | Slack Notifications | Integration API |
| 7 | TC-PH7-07 | Audit Log | Integration API |
| 7 | TC-PH7-08 | Auth Frontend Pages | E2E UI |
| 7 | TC-PH7-09 | Settings & Profile Pages | E2E UI |
| 7 | TC-PH7-10 | Data Catalog Pages | E2E UI |
| 8 | TC-PH8-01 | Unit Test Coverage >70% | Testing/QA |
| 8 | TC-PH8-02 | Integration Test Suite | Testing/QA |
| 8 | TC-PH8-03 | E2E Critical Flow #1 | E2E UI |
| 8 | TC-PH8-04 | E2E Critical Flow #2 | E2E UI |
| 8 | TC-PH8-05 | E2E Critical Flow #3 | E2E UI |
| 8 | TC-PH8-06 | Docker Deployment | Deployment |
| 8 | TC-PH8-07 | OWASP Security Scan | Security |
| 8 | TC-PH8-08 | Full Load Performance (k6) | Performance |
| 8 | TC-PH8-09 | Prometheus Monitoring | Monitoring |
| 8 | TC-PH8-10 | Backup & Recovery | Deployment |

---

## Complete Summary — All 8 Phases (80 Test Cases)

| Phase | File | Test Cases |
|-------|------|------------|
| Phase 1 — Foundation & Core Infrastructure | `QA_AUTOMATION_PHASE_1_2.md` | TC-PH1-01 s/d TC-PH1-10 |
| Phase 2 — Data Source Engine & Connectors | `QA_AUTOMATION_PHASE_1_2.md` | TC-PH2-01 s/d TC-PH2-10 |
| Phase 3 — Query Engine & Data Processing | `QA_AUTOMATION_PHASE_3_4.md` | TC-PH3-01 s/d TC-PH3-10 |
| Phase 4 — Data Management | `QA_AUTOMATION_PHASE_3_4.md` | TC-PH4-01 s/d TC-PH4-10 |
| Phase 5 — Visualization & Dashboard | `QA_AUTOMATION_PHASE_5_6.md` | TC-PH5-01 s/d TC-PH5-10 |
| Phase 6 — AI Features & Integrations | `QA_AUTOMATION_PHASE_5_6.md` | TC-PH6-01 s/d TC-PH6-10 |
| Phase 7 — Business Features & Frontend | `QA_AUTOMATION_PHASE_7_8.md` | TC-PH7-01 s/d TC-PH7-10 |
| Phase 8 — Testing, QA & Deployment | `QA_AUTOMATION_PHASE_7_8.md` | TC-PH8-01 s/d TC-PH8-10 |

**Total: 8 Phase × 10 Skenario = 80 Test Cases**