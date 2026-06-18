# QA Automation Test Design — Phase 3 & Phase 4

> **Project:** sarai-platform
> **Date:** 2026-06-17
> **Stack:** Jest + SuperTest (API), Prisma (DB), k6 (Performance), OWASP ZAP (Security)

---

## Phase 3 — Query Engine & Data Processing

> Cakupan: Query Builder Service (Visual query), Query Execution Engine (BullMQ, Caching), Custom Fields (Expression parser), Data Blending (JOIN engine di tabel synced_data), Query Scheduling (Cron timezone-aware).

---

### TC-PH3-01: Validasi Visual Query Builder Menghasilkan SQL

```gherkin
Feature: Query Builder
Scenario: User membuat visual query dengan filter dan grouping
  Given user memiliki connection aktif dengan synced_data tersedia
  When user menyusun query melalui visual builder
  Then backend menghasilkan SQL valid
  And query preview dikembalikan tanpa mengeksekusi
```

```ts
it('should generate valid SQL from visual query builder', async () => {
  const res = await request(app.getHttpServer())
    .post('/query-builder/preview')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      sourceTable: 'campaigns',
      filters: [{ field: 'status', operator: 'eq', value: 'ACTIVE' }],
      groupBy: ['campaign_name'],
      aggregations: [{ field: 'revenue', function: 'SUM' }],
    })
    .expect(200);

  expect(res.body.sql).toBeDefined();
  expect(res.body.sql).toContain('SELECT');
  expect(res.body.sql).toContain('GROUP BY');
  expect(res.body.parameters).toBeInstanceOf(Array);
});
```

**Expected Result:** SQL valid dihasilkan dengan benar sesuai visual builder, tanpa eksekusi.

---

### TC-PH3-02: Validasi Query Execution Engine via BullMQ

```gherkin
Feature: Query Execution
Scenario: User menjalankan query yang menghasilkan dataset besar
  Given query valid sudah dikonfigurasi
  When user mengeksekusi query
  Then query dijalankan melalui BullMQ worker
  Dan status job dikembalikan
```

```ts
it('should enqueue query execution to BullMQ and return job status', async () => {
  const res = await request(app.getHttpServer())
    .post('/queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      sql: 'SELECT * FROM campaigns WHERE status = $1',
      parameters: ['ACTIVE'],
      connectionId: 'conn_qa_001',
    })
    .expect(202);

  expect(res.body.jobId).toBeDefined();
  expect(res.body.status).toBe('QUEUED');

  // Poll for completion
  await waitForJobCompletion(res.body.jobId);
  const statusRes = await request(app.getHttpServer())
    .get(`/queries/${res.body.jobId}/status`)
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(['COMPLETED', 'FAILED']).toContain(statusRes.body.status);
});
```

**Expected Result:** Query masuk ke BullMQ queue, status job dapat dipantau hingga selesai.

---

### TC-PH3-03: Validasi Query Cache Mengurangi Latency

```gherkin
Feature: Query Caching
Scenario: User menjalankan query yang sama berulang kali
  Given query pertama sudah dieksekusi dan di-cache
  When user menjalankan query identik lagi
  Then response dikembalikan dari cache
  Dan waktu respons lebih cepat
```

```ts
it('should return cached results for identical query', async () => {
  const queryPayload = {
    sql: 'SELECT COUNT(*) as total FROM campaigns',
    connectionId: 'conn_qa_001',
  };

  // First execution - no cache
  const res1 = await request(app.getHttpServer())
    .post('/queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send(queryPayload)
    .expect(202);
  await waitForJobCompletion(res1.body.jobId);

  const start = Date.now();
  const res2 = await request(app.getHttpServer())
    .post('/queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send(queryPayload)
    .expect(202);

  expect(res2.body.fromCache).toBe(true);
  expect(Date.now() - start).toBeLessThan(1000);
});
```

**Expected Result:** Query kedua di-cache dan direspons lebih cepat dari yang pertama.

---

### TC-PH3-04: Validasi Custom Fields Expression Parser

```gherkin
Feature: Custom Fields
Scenario: User membuat custom field dengan expression matematika
  Given user memiliki dataset dengan kolom numeric
  When user membuat custom field expression "revenue / impressions * 100"
  Then expression valid terhadap parser
  Dan custom field tersimpan untuk digunakan
```

```ts
it('should validate and save custom field expression', async () => {
  const res = await request(app.getHttpServer())
    .post('/query-builder/custom-fields')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      name: 'CTR_Percent',
      expression: 'revenue / impressions * 100',
      sourceTable: 'campaigns',
      dataType: 'FLOAT',
    })
    .expect(201);

  expect(res.body.id).toBeDefined();
  expect(res.body.name).toBe('CTR_Percent');
});

it('should reject invalid expression', async () => {
  await request(app.getHttpServer())
    .post('/query-builder/custom-fields')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      name: 'BadExpression',
      expression: 'DROP TABLE campaigns; --',
      sourceTable: 'campaigns',
      dataType: 'FLOAT',
    })
    .expect(400);
});
```

**Expected Result:** Expression valid tersimpan, expression berbahaya (SQL injection) ditolak.

---

### TC-PH3-05: Validasi Data Blending (JOIN Engine)

```gherkin
Feature: Data Blending
Scenario: User melakukan JOIN dua tabel synced_data
  Given dua tabel synced_data tersedia dengan foreign key
  When user mengkonfigurasi JOIN melalui data blending
  Then hasil blending tersedia untuk query
  Dan data dari kedua tabel tergabung dengan benar
```

```ts
it('should blend data from two synced tables via JOIN', async () => {
  const res = await request(app.getHttpServer())
    .post('/query-builder/blend')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      leftTable: 'campaigns',
      rightTable: 'orders',
      joinType: 'LEFT',
      joinCondition: { left: 'campaign_id', right: 'campaign_id' },
      selectedFields: ['campaigns.name', 'orders.amount'],
    })
    .expect(200);

  expect(res.body.blendedSchema).toBeDefined();
  expect(res.body.previewRows).toBeInstanceOf(Array);
});
```

**Expected Result:** Data blending menghasilkan JOIN query yang benar, preview data tersedia.

---

### TC-PH3-06: Validasi Query Scheduling Cron Timezone-Aware

```gherkin
Feature: Query Scheduling
Scenario: User menjadwalkan query dengan timezone tertentu
  Given user memilih query dan schedule "0 8 * * *" dengan timezone "Asia/Jakarta"
  When schedule disimpan
  Then query akan dijalankan sesuai waktu timezone yang ditentukan
  Dan schedule dikonfirmasi disimpan
```

```ts
it('should save timezone-aware query schedule', async () => {
  const res = await request(app.getHttpServer())
    .post('/query-builder/schedules')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      queryId: 'query_qa_001',
      cronExpression: '0 8 * * *',
      timezone: 'Asia/Jakarta',
      enabled: true,
    })
    .expect(201);

  expect(res.body.id).toBeDefined();
  expect(res.body.nextRun).toBeDefined();
  expect(res.body.timezone).toBe('Asia/Jakarta');
});

it('should reject invalid timezone', async () => {
  await request(app.getHttpServer())
    .post('/query-builder/schedules')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      queryId: 'query_qa_001',
      cronExpression: '0 8 * * *',
      timezone: 'Invalid/Timezone',
    })
    .expect(400);
});
```

**Expected Result:** Schedule tersimpan dengan timezone valid, timezone invalid ditolak 400.

---

### TC-PH3-07: Validasi Query Execution Menangani Timeout

```gherkin
Feature: Query Timeout
Scenario: Query yang berjalan terlalu lama harus dihentikan
  Given query dengan kompleksitas tinggi
  When query melebihi batas waktu yang ditentukan
  Then query dibatalkan secara otomatis
  Dan status job berubah menjadi FAILED dengan pesan timeout
```

```ts
it('should timeout long-running query and return FAILED status', async () => {
  const res = await request(app.getHttpServer())
    .post('/queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      sql: 'SELECT pg_sleep(60)',
      connectionId: 'conn_qa_001',
      timeoutMs: 5000,
    })
    .expect(202);

  await waitForJobCompletion(res.body.jobId, 10000);

  const statusRes = await request(app.getHttpServer())
    .get(`/queries/${res.body.jobId}/status`)
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(statusRes.body.status).toBe('FAILED');
  expect(statusRes.body.error).toContain('timeout');
});
```

**Expected Result:** Query timeout dibatalkan otomatis, error message jelas tanpa membanjiri DB.

---

### TC-PH3-08: Validasi Query dengan Parameter Binding (SQL Injection Prevention)

```gherkin
Feature: Query Security
Scenario: User memasukkan SQL injection pada parameter query
  Given query dengan parameterized input
  When user mengirim parameter "' OR 1=1 --"
  Then query tidak mengeksekusi injection
  Dan hanya parameter yang di-escape yang dikembalikan
```

```ts
it('should prevent SQL injection via parameter binding', async () => {
  const res = await request(app.getHttpServer())
    .post('/queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      sql: 'SELECT * FROM users WHERE email = $1',
      parameters: ["' OR 1=1 --"],
      connectionId: 'conn_qa_001',
    })
    .expect(202);

  await waitForJobCompletion(res.body.jobId);

  const result = await request(app.getHttpServer())
    .get(`/queries/${res.body.jobId}/result`)
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  // Should return empty results, not all users
  expect(result.body.rows.length).toBe(0);
});
```

**Expected Result:** SQL injection tidak berhasil, parameter di-escape oleh parameterized query.

---

### TC-PH3-09: Validasi Query Execution Membatasi Jumlah Baris Hasil

```gherkin
Feature: Result Limiting
Scenario: User menjalankan query tanpa LIMIT
  Given query menghasilkan ribuan baris
  When hasil query dikembalikan
  Then jumlah baris dibatasi sesuai maximum rows per query
  Dan metadata menunjukkan total rows vs returned rows
```

```ts
it('should limit result rows and return metadata', async () => {
  const res = await request(app.getHttpServer())
    .post('/queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      sql: 'SELECT * FROM synced_data',
      connectionId: 'conn_qa_001',
    })
    .expect(202);

  await waitForJobCompletion(res.body.jobId);

  const result = await request(app.getHttpServer())
    .get(`/queries/${res.body.jobId}/result`)
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(result.body.rows.length).toBeLessThanOrEqual(10000);
  expect(result.body.metadata.totalRows).toBeGreaterThan(result.body.rows.length);
});
```

**Expected Result:** Hasil dibatasi, metadata mencantumkan total rows vs returned rows.

---

### TC-PH3-10: Validasi Performance Query Kompleks dengan k6

```gherkin
Feature: Query Performance
Scenario: 50 concurrent users menjalankan query kompleks
  Given dataset minimal 100.000 baris
  When 50 user mengeksekusi query bersamaan
  Then median response time di bawah 3 detik
  Dan error rate di bawah 1%
```

```ts
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(50)<3000', 'p(95)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({
    sql: 'SELECT * FROM synced_data WHERE created_at > NOW() - INTERVAL \'30 days\'',
    connectionId: 'conn_perf_001',
  });
  const res = http.post(`${__ENV.API_URL}/queries/execute`, payload, {
    headers: { Authorization: `Bearer ${__ENV.JWT_TOKEN}`, 'Content-Type': 'application/json' },
  });
  check(res, { 'status 202': (r) => r.status === 202 });
  sleep(1);
}
```

**Expected Result:** 50 VU concurrent, p50 < 3s, error rate < 1%.

---

## Phase 4 — Data Management

> Cakupan: Data Transfers (ke Sheets/Excel), API Queries (Custom HTTP request builder dengan JSONPath), Data Warehousing (Retention policy), Table Manager (Dynamic schema, CRUD, CSV import/export).

---

### TC-PH4-01: Validasi Export Data ke Google Sheets

```gherkin
Feature: Data Transfer
Scenario: User mengekspor query result ke Google Sheets
  Given user memiliki query result tersedia
  And Google Sheets OAuth terkoneksi
  When user meminta export ke Sheets
  Then file Sheets dibuat
  Dan URL file dikembalikan
```

```ts
it('should export query result to Google Sheets', async () => {
  const res = await request(app.getHttpServer())
    .post('/data-transfer/export/google-sheets')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      jobId: 'job_qa_001',
      spreadsheetTitle: 'QA Export Test',
      sheetName: 'Sheet1',
    })
    .expect(201);

  expect(res.body.spreadsheetUrl).toContain('docs.google.com');
  expect(res.body.status).toBe('COMPLETED');
});
```

**Expected Result:** Google Sheets file dibuat dan URL valid dikembalikan.

---

### TC-PH4-02: Validasi Export Data ke Excel

```gherkin
Feature: Excel Export
Scenario: User mengekspor dataset ke file Excel
  Given user memiliki query result tersedia
  When user meminta export ke Excel
  Then file Excel (.xlsx) tersedia untuk download
  Dan file memiliki header dan data sesuai query
```

```ts
it('should export query result to Excel file', async () => {
  const res = await request(app.getHttpServer())
    .post('/data-transfer/export/excel')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      jobId: 'job_qa_001',
      fileName: 'qa_export_test.xlsx',
    })
    .expect(200);

  expect(res.body.downloadUrl).toBeDefined();
  expect(res.body.fileSize).toBeGreaterThan(0);
  expect(res.body.rowCount).toBeGreaterThan(0);
});
```

**Expected Result:** File Excel valid tersedia dengan data yang benar.

---

### TC-PH4-03: Validasi API Query Builder (Custom HTTP Request)

```gherkin
Feature: API Query Builder
Scenario: User membuat custom HTTP request ke external API
  Given user mengkonfigurasi endpoint URL dan headers
  When user mengirim request melalui API query builder
  Then request dikirim ke external API
  Dan response dikembalikan dalam format internal
```

```ts
it('should send custom HTTP request and return normalized response', async () => {
  const res = await request(app.getHttpServer())
    .post('/api-queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      name: 'External API Test',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      headers: { 'Accept': 'application/json' },
      jsonPath: '$.title',
    })
    .expect(200);

  expect(res.body.extractedData).toBeDefined();
  expect(res.body.statusCode).toBe(200);
});
```

**Expected Result:** Request external API berhasil, JSONPath extract data dengan benar.

---

### TC-PH4-04: Validasi JSONPath Extraction

```gherkin
Feature: JSONPath Extraction
Scenario: User mengekstrak data dari JSON response menggunakan JSONPath
  Given API response berupa JSON nested
  When user menentukan JSONPath "$.data.items[*].name"
  Then hanya data yang cocok dengan JSONPath yang dikembalikan
```

```ts
it('should extract data using JSONPath expression', async () => {
  const res = await request(app.getHttpServer())
    .post('/api-queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      name: 'JSONPath Test',
      method: 'POST',
      url: 'https://httpbin.org/post',
      body: { test: 'data' },
      jsonPath: '$.json.test',
    })
    .expect(200);

  expect(res.body.extractedData).toBe('data');
});

it('should reject invalid JSONPath', async () => {
  await request(app.getHttpServer())
    .post('/api-queries/execute')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      name: 'Bad JSONPath',
      method: 'GET',
      url: 'https://httpbin.org/get',
      jsonPath: '[[invalid',
    })
    .expect(400);
});
```

**Expected Result:** JSONPath valid mengekstrak data, JSONPath invalid ditolak 400.

---

### TC-PH4-05: Validasi Data Retention Policy

```gherkin
Feature: Data Warehousing
Scenario: Retention policy menghapus data melebihi batas waktu
  Given retention policy 90 hari aktif untuk connection
  When scheduled cleanup job berjalan
  Then data lebih dari 90 hari dihapus dari synced_data
  Dan jumlah baris berkurang sesuai yang diharapkan
```

```ts
it('should delete data older than retention period', async () => {
  const res = await request(app.getHttpServer())
    .post('/data-warehousing/retention/trigger')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({ connectionId: 'conn_qa_001' })
    .expect(200);

  expect(res.body.deletedCount).toBeGreaterThanOrEqual(0);
  expect(res.body.cutoffDate).toBeDefined();
});
```

**Expected Result:** Data expired terhapus, audit log mencatat jumlah baris yang dihapus.

---

### TC-PH4-06: Validasi Dynamic Table Manager CRUD

```gherkin
Feature: Table Manager
Scenario: User membuat tabel dinamis baru
  Given user memiliki workspace aktif
  When user mendefinisikan schema tabel dengan kolom dan tipe data
  Then tabel baru dibuat di synced_data
  Dan user dapat melakukan CRUD pada tabel
```

```ts
it('should create dynamic table and perform CRUD operations', async () => {
  // Create table
  const createRes = await request(app.getHttpServer())
    .post('/table-manager/tables')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({
      tableName: 'qa_dynamic_table',
      columns: [
        { name: 'id', type: 'SERIAL', primaryKey: true },
        { name: 'name', type: 'VARCHAR(255)', nullable: false },
        { name: 'value', type: 'NUMERIC' },
      ],
    })
    .expect(201);

  expect(createRes.body.tableName).toBe('qa_dynamic_table');

  // Insert row
  await request(app.getHttpServer())
    .post('/table-manager/tables/qa_dynamic_table/rows')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .send({ name: 'test_row', value: 42 })
    .expect(201);

  // Read rows
  const readRes = await request(app.getHttpServer())
    .get('/table-manager/tables/qa_dynamic_table/rows')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(readRes.body.rows.length).toBeGreaterThanOrEqual(1);
});
```

**Expected Result:** Dynamic table dibuat, CRUD operation berfungsi.

---

### TC-PH4-07: Validasi CSV Import

```gherkin
Feature: CSV Import
Scenario: User mengimpor data dari file CSV ke tabel
  Given file CSV dengan header yang valid
  When user upload CSV ke tabel tertentu
  Then data dari CSV tersimpan di tabel
  Dan jumlah baris yang diimport dilaporkan
```

```ts
it('should import CSV data into dynamic table', async () => {
  const csvContent = 'name,value\nImport A,100\nImport B,200\nImport C,300';
  const res = await request(app.getHttpServer())
    .post('/table-manager/tables/qa_dynamic_table/import')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .attach('file', Buffer.from(csvContent), 'test_import.csv')
    .expect(200);

  expect(res.body.importedCount).toBe(3);
  expect(res.body.errors).toHaveLength(0);
});
```

**Expected Result:** CSV data terimport, jumlah baris benar tanpa error.

---

### TC-PH4-08: Validasi CSV Export dari Dynamic Table

```gherkin
Feature: CSV Export
Scenario: User mengekspor tabel ke format CSV
  Given tabel dengan data tersedia
  When user meminta export ke CSV
  Then file CSV dikembalikan dengan benar
  Dan header sesuai kolom tabel
```

```ts
it('should export table data to CSV', async () => {
  const res = await request(app.getHttpServer())
    .get('/table-manager/tables/qa_dynamic_table/export?format=csv')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);

  expect(res.headers['content-type']).toContain('text/csv');
  expect(res.text).toContain('name,value');
  expect(res.text.split('\n').length).toBeGreaterThanOrEqual(4);
});
```

**Expected Result:** CSV valid dengan header dan data sesuai tabel.

---

### TC-PH4-09: Validasi RBAC untuk Table Management

```gherkin
Feature: Table Management RBAC
Scenario: User MEMBER mencoba menghapus tabel
  Given user memiliki role MEMBER
  When user mengirim request hapus tabel
  Then API mengembalikan status 403
  Dan tabel tidak dihapus
```

```ts
it('should prevent member from dropping table', async () => {
  const res = await request(app.getHttpServer())
    .delete('/table-manager/tables/qa_dynamic_table')
    .set('Authorization', 'Bearer mock-member-jwt')
    .expect(403);

  // Verify table still exists
  await request(app.getHttpServer())
    .get('/table-manager/tables/qa_dynamic_table/rows')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .expect(200);
});
```

**Expected Result:** MEMBER ditolak (403), tabel tetap ada.

---

### TC-PH4-10: Validasi Performance CSV Import Volume Besar

```gherkin
Feature: CSV Import Performance
Scenario: User mengimpor CSV dengan 10.000 baris
  Given file CSV dengan 10.000 baris data
  When user upload CSV
  Then import selesai di bawah 30 detik
  Dan semua data tersimpan tanpa duplikasi
```

```ts
it('should import 10k CSV rows within performance threshold', async () => {
  const rows = Array.from({ length: 10000 }, (_, i) => `PerfRow${i},${i * 10}`);
  const csv = 'name,value\n' + rows.join('\n');

  const start = Date.now();
  const res = await request(app.getHttpServer())
    .post('/table-manager/tables/qa_perf_table/import')
    .set('Authorization', 'Bearer mock-admin-jwt')
    .attach('file', Buffer.from(csv), 'perf_10k.csv')
    .expect(200);

  const elapsed = Date.now() - start;
  expect(res.body.importedCount).toBe(10000);
  expect(elapsed).toBeLessThan(30000);
});
```

**Expected Result:** 10.000 baris terimport < 30 detik tanpa duplikasi.

---

## Summary Table

| Phase | TC ID | Title | Type |
|-------|-------|-------|------|
| 3 | TC-PH3-01 | Visual Query Builder | Integration API |
| 3 | TC-PH3-02 | BullMQ Query Execution | Integration API |
| 3 | TC-PH3-03 | Query Cache | Performance |
| 3 | TC-PH3-04 | Custom Fields Expression | Integration API |
| 3 | TC-PH3-05 | Data Blending JOIN | Integration API |
| 3 | TC-PH3-06 | Cron Scheduling Timezone | Integration API |
| 3 | TC-PH3-07 | Query Timeout | Integration API |
| 3 | TC-PH3-08 | SQL Injection Prevention | Security |
| 3 | TC-PH3-09 | Result Row Limiting | Integration API |
| 3 | TC-PH3-10 | Concurrent Query Performance | Performance |
| 4 | TC-PH4-01 | Export to Google Sheets | Integration API |
| 4 | TC-PH4-02 | Export to Excel | Integration API |
| 4 | TC-PH4-03 | API Query Builder | Integration API |
| 4 | TC-PH4-04 | JSONPath Extraction | Integration API |
| 4 | TC-PH4-05 | Data Retention Policy | Integration API |
| 4 | TC-PH4-06 | Dynamic Table CRUD | Integration API |
| 4 | TC-PH4-07 | CSV Import | Integration API |
| 4 | TC-PH4-08 | CSV Export | Integration API |
| 4 | TC-PH4-09 | Table RBAC | Security |
| 4 | TC-PH4-10 | CSV Import Performance | Performance |