# QA Automation Test Design — Phase 5 & Phase 6

> **Project:** sarai-platform
> **Date:** 2026-06-17
> **Stack:** Jest + SuperTest (API), Playwright (Frontend E2E), k6 (Performance), OWASP ZAP (Security)

---

## Phase 5 — Visualization & Dashboard

> Cakupan: Dashboard API (Layout persistence), Widget System (8 tipe chart/card), Dashboard Frontend (Drag-drop grid), Public Sharing (Token-based link), Data Explorer (Virtual scrolling, filter visual).

---

### TC-PH5-01: Validasi Dashboard API Menyimpan Layout

```gherkin
Feature: Dashboard Persistence
Scenario: User menyimpan layout dashboard
  Given user memiliki dashboard aktif
  When user memperbarui layout dengan menambah widget
  Then layout tersimpan di database
  Dan layout dapat dimuat ulang dengan benar
```

```ts
it('should save and reload dashboard layout', async () => {
  const layout = {
    columns: 12,
    rows: 8,
    widgets: [
      { id: 'w1', type: 'chart', x: 0, y: 0, width: 6, height: 4, queryId: 'q1' },
    ],
  };

  await request(app.getHttpServer())
    .put('/dashboards/dash_qa_001/layout')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send(layout)
    .expect(200);

  const res = await request(app.getHttpServer())
    .get('/dashboards/dash_qa_001')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(res.body.layout.widgets).toHaveLength(1);
  expect(res.body.layout.widgets[0].type).toBe('chart');
});
```

**Expected Result:** Layout tersimpan dan dapat dimuat ulang dengan widget yang benar.

---

### TC-PH5-02: Validasi Widget System - 8 Tipe Chart

```gherkin
Feature: Widget System
Scenario: User membuat berbagai tipe widget
  Given user memiliki dashboard aktif
  When user menambahkan widget dengan tipe berbeda
  Then setiap tipe widget dibuat dengan benar
  Dan konfigurasi tipe spesifik tersimpan
```

```ts
it('should create all 8 widget types', async () => {
  const widgetTypes = [
    'line_chart', 'bar_chart', 'pie_chart', 'area_chart',
    'table', 'number_card', 'text_card', 'gauge',
  ];

  for (const type of widgetTypes) {
    const res = await request(app.getHttpServer())
      .post('/dashboards/dash_qa_001/widgets')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        type,
        title: `Widget ${type}`,
        queryId: 'q1',
        config: {},
      })
      .expect(201);

    expect(res.body.type).toBe(type);
  }
});
```

**Expected Result:** Semua 8 tipe widget berhasil dibuat dengan benar.

---

### TC-PH5-03: Validasi Drag-Drop Frontend Layout

```gherkin
Feature: Dashboard Frontend
Scenario: User melakukan drag-drop widget pada dashboard
  Given dashboard dalam mode edit
  When user memindahkan widget dari posisi A ke posisi B
  Then posisi widget terupdate secara real-time
  Dan layout tersimpan otomatis
```

```ts
// Playwright E2E test
import { test, expect } from '@playwright/test';

test('TC-PH5-03: Drag-drop widget', async ({ page }) => {
  await page.goto('/dashboard/dash_qa_001');
  await page.click('[data-testid="edit-mode-toggle"]');
  
  const widget = page.locator('[data-testid="widget-w1"]');
  const target = page.locator('[data-testid="grid-cell-3-0"]');
  
  await widget.dragTo(target);
  
  // Verify position updated
  await expect(widget).toHaveAttribute('data-grid-x', '3');
  await expect(widget).toHaveAttribute('data-grid-y', '0');
  
  // Save layout
  await page.click('[data-testid="save-layout"]');
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

**Expected Result:** Widget berpindah posisi, layout tersimpan otomatis.

---

### TC-PH5-04: Validasi Public Dashboard Sharing

```gherkin
Feature: Public Sharing
Scenario: User membagikan dashboard via link publik
  Given user memiliki dashboard aktif
  When user mengaktifkan public sharing
  Then sistem menghasilkan token unik
  Dan dashboard dapat diakses tanpa autentikasi
```

```ts
it('should generate public share link for dashboard', async () => {
  const res = await request(app.getHttpServer())
    .post('/dashboards/dash_qa_001/share')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({ enabled: true })
    .expect(201);

  expect(res.body.shareToken).toBeDefined();
  expect(res.body.shareUrl).toContain('/public/dashboard/');

  // Access without auth
  const publicRes = await request(app.getHttpServer())
    .get(`/public/dashboard/${res.body.shareToken}`)
    .expect(200);

  expect(publicRes.body.layout).toBeDefined();
});
```

**Expected Result:** Share token dibuat, dashboard publik dapat diakses tanpa JWT.

---

### TC-PH5-05: Validasi Data Explorer Virtual Scrolling

```gherkin
Feature: Data Explorer
Scenario: User menavigasi dataset besar dengan virtual scrolling
  Given dataset dengan 100.000 baris
  When user membuka Data Explorer
  Then hanya visible rows yang dimuat
  Dan scrolling lancar tanpa lag
```

```ts
// Playwright E2E
test('TC-PH5-05: Virtual scrolling performance', async ({ page }) => {
  await page.goto('/explorer?table=campaigns_large');
  
  // Initial rows loaded
  const initialRows = await page.locator('[data-testid="explorer-row"]').count();
  expect(initialRows).toBeLessThanOrEqual(50);
  
  // Scroll down
  await page.evaluate(() => {
    document.querySelector('[data-testid="explorer-container"]')!.scrollTop = 10000;
  });
  await page.waitForTimeout(500);
  
  // Verify still limited rows (virtual)
  const rowsAfterScroll = await page.locator('[data-testid="explorer-row"]').count();
  expect(rowsAfterScroll).toBeLessThanOrEqual(50);
  
  // Check smooth scroll performance
  const start = Date.now();
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="explorer-container"]')!;
    el.scrollTop = el.scrollHeight;
  });
  expect(Date.now() - start).toBeLessThan(1000);
});
```

**Expected Result:** Virtual scrolling hanya render visible rows, scrolling lancar.

---

### TC-PH5-06: Validasi Visual Filter pada Data Explorer

```gherkin
Feature: Visual Filter
Scenario: User menerapkan filter visual pada dataset
  Given Data Explorer dengan dataset aktif
  When user memilih filter kolom dan nilai
  Then data terfilter secara real-time
  Dan jumlah baris sesuai filter
```

```ts
it('should filter data visually in explorer', async () => {
  const res = await request(app.getHttpServer())
    .post('/explorer/filter')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      table: 'campaigns',
      filters: [
        { field: 'status', operator: 'eq', value: 'ACTIVE' },
        { field: 'budget', operator: 'gt', value: 1000 },
      ],
    })
    .expect(200);

  expect(res.body.filteredCount).toBeGreaterThan(0);
  expect(res.body.rows.every((r: any) => r.status === 'ACTIVE')).toBe(true);
});
```

**Expected Result:** Data terfilter dengan benar sesuai kriteria visual.

---

### TC-PH5-07: Validasi Dashboard RBAC - Member Hanya Bisa View

```gherkin
Feature: Dashboard RBAC
Scenario: Member mencoba mengedit dashboard
  Given user memiliki role MEMBER
  When user membuka dashboard
  Then dashboard dapat dilihat
  Tetapi mode edit tidak tersedia
```

```ts
// Playwright E2E
test('TC-PH5-07: Member cannot edit dashboard', async ({ page }) => {
  // Login as member
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'member@sarai.test');
  await page.fill('[data-testid="password"]', 'MemberPass123!');
  await page.click('[data-testid="login-btn"]');
  
  await page.goto('/dashboard/dash_qa_001');
  
  // Edit mode toggle should not be visible
  await expect(page.locator('[data-testid="edit-mode-toggle"]')).not.toBeVisible();
});
```

**Expected Result:** Member hanya bisa view dashboard tanpa akses edit.

---

### TC-PH5-08: Validasi Widget Data Refresh

```gherkin
Feature: Widget Refresh
Scenario: Widget chart menampilkan data terbaru
  Given widget dengan data dari query
  When user memicu refresh widget
  Then widget mengambil data terbaru dari server
  Dan chart diperbarui tanpa reload halaman
```

```ts
it('should refresh widget data on demand', async () => {
  const res1 = await request(app.getHttpServer())
    .get('/dashboards/dash_qa_001/widgets/w1/data')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  // Trigger refresh
  const refreshRes = await request(app.getHttpServer())
    .post('/dashboards/dash_qa_001/widgets/w1/refresh')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(refreshRes.body.lastRefreshed).toBeDefined();
});
```

**Expected Result:** Widget refresh tanpa reload halaman, data terbaru ditampilkan.

---

### TC-PH5-09: Validasi Performance Dashboard Load dengan 20 Widget

```gherkin
Feature: Dashboard Performance
Scenario: Dashboard dengan banyak widget dimuat dengan cepat
  Given dashboard dengan 20 widget
  When user membuka dashboard
  Then halaman dimuat di bawah 3 detik
  Dan semua widget menampilkan data
```

```ts
// k6 load test
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(50)<3000', 'p(95)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${__ENV.API_URL}/dashboards/dash_perf_001`, {
    headers: { Authorization: `Bearer ${__ENV.JWT_TOKEN}` },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(2);
}
```

**Expected Result:** Dashboard 20 widget load < 3s p50.

---

### TC-PH5-10: Validasi Public Dashboard Tidak Mengekspos Data Sensitif

```gherkin
Feature: Public Dashboard Security
Scenario: Dashboard publik tidak menampilkan data sensitif
  Given dashboard dengan widget query yang mengandung kolom email
  When dashboard dipublikasikan
  Then kolom sensitif tidak ditampilkan di public view
```

```ts
it('should hide sensitive fields in public dashboard', async () => {
  const shareToken = 'test_public_token';

  const res = await request(app.getHttpServer())
    .get(`/public/dashboard/${shareToken}`)
    .expect(200);

  const widgetData = res.body.layout.widgets.flatMap((w: any) => w.data?.columns || []);
  expect(widgetData).not.toContain('email');
  expect(widgetData).not.toContain('phone');
});
```

**Expected Result:** Data sensitif tersembunyi di public view.

---

## Phase 6 — AI Features & Platform Integrations

> Cakupan: SARAI AI Chat (Claude API, SSE streaming, injeksi konteks data), AI Insights (Trend, Anomaly), Export ke Google Sheets & Excel, Konektor ke Looker Studio & Power BI, Integration Management.

---

### TC-PH6-01: Validasi SARAI AI Chat Menggunakan SSE Streaming

```gherkin
Feature: AI Chat
Scenario: User mengirim pesan ke SARAI AI
  Given user memiliki context data aktif
  When user mengirim pertanyaan melalui chat
  Then respon dikirim via SSE streaming
  Dan konteks data diinjeksi ke Claude API
```

```ts
it('should stream AI response via SSE', async () => {
  const res = await request(app.getHttpServer())
    .post('/ai/chat')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      message: 'Analisis performa campaign terakhir',
      context: { connectionId: 'conn_qa_001', table: 'campaigns' },
      stream: true,
    })
    .expect(200)
    .buffer();

  expect(res.text).toContain('data:');
  expect(res.text).toContain('[DONE]');
});
```

**Expected Result:** SSE streaming berfungsi, respons parsial diterima.

---

### TC-PH6-02: Validasi AI Insights - Deteksi Anomali

```gherkin
Feature: AI Insights
Scenario: Sistem mendeteksi anomali pada data
  Given dataset dengan anomali (spike/drop)
  When user meminta AI insights
  Then anomali terdeteksi dengan benar
  Dan penjelasan disediakan
```

```ts
it('should detect anomalies in dataset', async () => {
  const res = await request(app.getHttpServer())
    .post('/ai/insights')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      table: 'revenue_daily',
      column: 'revenue',
      method: 'z-score',
    })
    .expect(200);

  expect(res.body.anomalies).toBeInstanceOf(Array);
  expect(res.body.anomalies.length).toBeGreaterThan(0);
  expect(res.body.anomalies[0]).toHaveProperty('date');
  expect(res.body.anomalies[0]).toHaveProperty('explanation');
});
```

**Expected Result:** Anomali terdeteksi dengan penjelasan.

---

### TC-PH6-03: Validasi AI Trend Analysis

```gherkin
Feature: AI Trend Analysis
Scenario: User meminta analisis trend dari data
  Given dataset time-series
  When user meminta trend analysis
  Then AI mengidentifikasi trend (naik/turun/stabil)
  Dan confidence score disediakan
```

```ts
it('should provide trend analysis with confidence', async () => {
  const res = await request(app.getHttpServer())
    .post('/ai/insights/trend')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      table: 'daily_signups',
      column: 'count',
      period: '30d',
    })
    .expect(200);

  expect(res.body.trend).toMatch(/increasing|decreasing|stable/);
  expect(res.body.confidence).toBeGreaterThan(0);
  expect(res.body.dataPoints).toBeInstanceOf(Array);
});
```

**Expected Result:** Trend analysis dengan confidence score dikembalikan.

---

### TC-PH6-04: Validasi Export AI Insight ke Google Sheets

```gherkin
Feature: AI Export
Scenario: User mengekspor AI insight ke Google Sheets
  Given AI insight tersedia
  When user meminta export ke Sheets
  Then insight data ditulis ke Sheets
  Dan URL Sheets dikembalikan
```

```ts
it('should export AI insight to Google Sheets', async () => {
  const res = await request(app.getHttpServer())
    .post('/ai/insights/export/google-sheets')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      insightId: 'insight_qa_001',
      spreadsheetTitle: 'AI Insight QA',
    })
    .expect(201);

  expect(res.body.spreadsheetUrl).toContain('docs.google.com');
});
```

**Expected Result:** AI insight terexport ke Sheets dengan URL valid.

---

### TC-PH6-05: Validasi Koneksi ke Looker Studio

```gherkin
Feature: Looker Studio Integration
Scenario: User mengkoneksikan data ke Looker Studio
  Given user memiliki data source aktif
  When user mengaktifkan koneksi Looker Studio
  Then connector URL dikembalikan
  Dan Looker Studio dapat mengakses data
```

```ts
it('should generate Looker Studio connector URL', async () => {
  const res = await request(app.getHttpServer())
    .post('/integrations/looker-studio/connect')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      connectionId: 'conn_qa_001',
      tables: ['campaigns', 'orders'],
    })
    .expect(201);

  expect(res.body.connectorUrl).toContain('lookerstudio');
  expect(res.body.status).toBe('CONNECTED');
});
```

**Expected Result:** Looker Studio connector URL valid dan terkoneksi.

---

### TC-PH6-06: Validasi Koneksi ke Power BI

```gherkin
Feature: Power BI Integration
Scenario: User mengkoneksikan data ke Power BI
  Given user memiliki data source aktif
  When user mengaktifkan koneksi Power BI
  Then OData feed URL dikembalikan
  Dan Power BI dapat mengakses data
```

```ts
it('should generate Power BI OData feed URL', async () => {
  const res = await request(app.getHttpServer())
    .post('/integrations/power-bi/connect')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      connectionId: 'conn_qa_001',
      datasets: ['campaigns'],
    })
    .expect(201);

  expect(res.body.odataUrl).toContain('/odata/');
  expect(res.body.status).toBe('CONNECTED');
});
```

**Expected Result:** Power BI OData URL valid dan terkoneksi.

---

### TC-PH6-07: Validasi Integration Management - List & Disconnect

```gherkin
Feature: Integration Management
Scenario: User mengelola integrasi aktif
  Given beberapa integrasi aktif
  When user membuka halaman integrasi
  Then daftar integrasi aktif ditampilkan
  Dan user dapat memutus integrasi tertentu
```

```ts
it('should list active integrations and disconnect', async () => {
  // List integrations
  const listRes = await request(app.getHttpServer())
    .get('/integrations')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(listRes.body.length).toBeGreaterThan(0);

  // Disconnect first integration
  const integrationId = listRes.body[0].id;
  await request(app.getHttpServer())
    .delete(`/integrations/${integrationId}`)
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);
});
```

**Expected Result:** Integrasi terdaftar, dapat di-disconnect.

---

### TC-PH6-08: Validasi Rate Limiting pada AI Chat

```gherkin
Feature: AI Rate Limiting
Scenario: User mengirim banyak permintaan AI secara cepat
  Given rate limit 10 request per menit
  When user mengirim 15 request dalam 1 menit
  Then request setelah batas ditolak
  Dan status 429 dikembalikan
```

```ts
it('should rate limit AI chat requests', async () => {
  const requests = Array.from({ length: 15 }).map(() =>
    request(app.getHttpServer())
      .post('/ai/chat')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({ message: 'test', stream: false }),
  );

  const responses = await Promise.all(requests);
  const rateLimited = responses.filter((r) => r.status === 429);

  expect(rateLimited.length).toBeGreaterThan(0);
});
```

**Expected Result:** Rate limit berfungsi, request berlebih ditolak 429.

---

### TC-PH6-09: Validasi AI Context Injection

```gherkin
Feature: AI Context
Scenario: AI menerima konteks data yang relevan
  Given user memiliki 3 dataset
  When user bertanya tentang salah satu dataset
  Then hanya dataset terkait yang diinjeksi ke prompt
  Dan AI tidak mengakses dataset lain
```

```ts
it('should inject only relevant context to AI', async () => {
  const res = await request(app.getHttpServer())
    .post('/ai/chat')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      message: 'Berapa total revenue dari campaigns?',
      context: { connectionId: 'conn_qa_001', tables: ['campaigns'] },
      stream: false,
    })
    .expect(200);

  expect(res.body.contextUsed).toContain('campaigns');
  expect(res.body.contextUsed).not.toContain('users');
});
```

**Expected Result:** Hanya konteks relevan yang digunakan oleh AI.

---

### TC-PH6-10: Validasi Performance AI Response Time

```gherkin
Feature: AI Performance
Scenario: AI chat response time harus dalam batas wajar
  Given pertanyaan standar
  When user mengirim pertanyaan
  Then streaming dimulai di bawah 2 detik
  Dan respons lengkap di bawah 10 detik
```

```ts
// k6 performance test
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(50)<10000', 'p(95)<15000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const res = http.post(`${__ENV.API_URL}/ai/chat`, JSON.stringify({
    message: 'Analisis performa bulan ini',
    stream: false,
  }), {
    headers: {
      Authorization: `Bearer ${__ENV.JWT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(3);
}
```

**Expected Result:** p50 < 10s, error rate < 5% untuk AI chat.

---

## Summary Table

| Phase | TC ID | Title | Type |
|-------|-------|-------|------|
| 5 | TC-PH5-01 | Dashboard Layout Persistence | Integration API |
| 5 | TC-PH5-02 | Widget System 8 Types | Integration API |
| 5 | TC-PH5-03 | Drag-Drop Frontend | E2E UI |
| 5 | TC-PH5-04 | Public Dashboard Sharing | Integration API |
| 5 | TC-PH5-05 | Virtual Scrolling | E2E UI / Performance |
| 5 | TC-PH5-06 | Visual Filter | Integration API |
| 5 | TC-PH5-07 | Dashboard RBAC | E2E UI |
| 5 | TC-PH5-08 | Widget Data Refresh | Integration API |
| 5 | TC-PH5-09 | Dashboard Load Performance | Performance |
| 5 | TC-PH5-10 | Public Dashboard Security | Security |
| 6 | TC-PH6-01 | AI Chat SSE Streaming | Integration API |
| 6 | TC-PH6-02 | AI Anomaly Detection | Integration API |
| 6 | TC-PH6-03 | AI Trend Analysis | Integration API |
| 6 | TC-PH6-04 | AI Export to Sheets | Integration API |
| 6 | TC-PH6-05 | Looker Studio Integration | Integration API |
| 6 | TC-PH6-06 | Power BI Integration | Integration API |
| 6 | TC-PH6-07 | Integration Management | Integration API |
| 6 | TC-PH6-08 | AI Rate Limiting | Security |
| 6 | TC-PH6-09 | AI Context Injection | Integration API |
| 6 | TC-PH6-10 | AI Response Performance | Performance |