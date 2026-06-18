# 🧪 QA Test Execution Report — Phase 3 & Phase 4
## (Gemini 3.5 Flash Verification Edition)

**Tanggal Pelaksanaan:** 17 Juni 2026  
**Metode Pengujian:** Static Code Analysis (SCA) + Codebase Audit + Integration Test Verification  
**Platform:** SARAI Platform v2.0  
**Backend:** NestJS + Prisma + PostgreSQL + BullMQ + Redis  
**Model Auditor:** Gemini 3.5 Flash  

---

## 📊 Ringkasan Eksekusi Pengujian

Berdasarkan audit mendalam terhadap kode sumber (source code) backend, kami memetakan **20 Skenario Pengujian** dari [QA_AUTOMATION_PHASE_3_4.md](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/docs/QA_AUTOMATION_PHASE_3_4.md) ke implementasi kode nyata.

| Kategori | Total TC | ✅ Pass | ❌ Fail (Discrepancy) | ⚠️ Blocked | Status Kesiapan |
|----------|----------|---------|------------------------|-------------|-----------------|
| **Phase 3 — Query Engine & Data Processing** | 10 | 0 | 10 | 0 | 🔴 **Not Ready (Critical Gaps)** |
| **Phase 4 — Data Management** | 10 | 0 | 10 | 0 | 🔴 **Not Ready (Critical Gaps)** |
| **TOTAL** | **20** | **0** | **20** | **0** | 🔴 **Needs Refactoring** |

> [!WARNING]
> **Tingkat Ketidaksesuaian Tinggi (100%):** Seluruh 20 skenario tes otomatis yang dirancang di `QA_AUTOMATION_PHASE_3_4.md` mengalami kegagalan eksekusi (*FAIL*) jika dijalankan langsung. Hal ini disebabkan oleh ketidaksesuaian endpoint base path, perbedaan skema payload request/response, ketiadaan filter RBAC, serta absennya beberapa fitur krusial (seperti *Query Timeout* dan *Parameter Binding*).

---

## 📋 Hasil Detil Per Test Case (TC)

### 🔹 Phase 3 — Query Engine & Data Processing

#### TC-PH3-01: Validasi Visual Query Builder Menghasilkan SQL
* **ID Skenario:** `TC-PH3-01`
* **Status:** ❌ **FAIL** (Endpoint & Fitur Tidak Ditemukan)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengirim visual builder config ke `POST /query-builder/preview` dan menerima representasi SQL tanpa melakukan eksekusi di database.
  * Realita Backend:
    * Tidak ada controller atau service bertajuk `/query-builder` di backend.
    * Model `Query` di [schema.prisma](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/prisma/schema.prisma#L157) menyimpan `builderData` sebagai format Json blob mentah, tetapi tidak ada modul parser visual-to-SQL yang menerjemahkannya di backend.
    * Endpoint alternatif `/queries/generate-sql` ([queries.controller.ts:L107-L110](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.controller.ts#L107-L110)) menghasilkan SQL menggunakan integrasi AI Groq, bukan visual query builder.
  * Dampak: Script tes otomatis yang memanggil `POST /query-builder/preview` akan menerima status **404 Not Found**.

---

#### TC-PH3-02: Validasi Query Execution Engine via BullMQ
* **ID Skenario:** `TC-PH3-02`
* **Status:** ❌ **FAIL** (Inkonsistensi Endpoint & Polling)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menjalankan SQL ad-hoc via `POST /queries/execute` dengan payload `{ sql, parameters, connectionId }` lalu memantau status via `GET /queries/${jobId}/status`.
  * Realita Backend:
    * Endpoint eksekusi query yang tersedia di controller adalah `POST /queries/:id/execute` ([queries.controller.ts:L70-L73](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.controller.ts#L70-L73)) yang mengeksekusi query yang *telah tersimpan* di DB berdasarkan UUID (`id`), tidak menerima payload SQL ad-hoc di body.
    * Endpoint polling status adalah `GET /queries/job-status/:jobId` ([queries.controller.ts:L88-L91](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.controller.ts#L88-L91)), bukan `/queries/:jobId/status`.
    * Output status dari BullMQ job mengembalikan format `{ state: 'completed' | 'failed', result }` ([queries.service.ts:L248-L251](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.service.ts#L248-L251)) bukannya properti `status`.
  * Dampak: Request gagal compile/execute karena perbedaan rute dan struktur response.

---

#### TC-PH3-03: Validasi Query Cache Mengurangi Latency
* **ID Skenario:** `TC-PH3-03`
* **Status:** ❌ **FAIL** (Inkonsistensi Alur Caching)
* **Analisis Kode:**
  * Ekspektasi Skenario: Eksekusi berulang terhadap query yang sama mengembalikan data dari cache secara langsung via endpoint eksekusi dengan properti `fromCache: true`.
  * Realita Backend:
    * Fungsi `executeQuery` ([queries.service.ts:L121-L151](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.service.ts#L121-L151)) selalu menghapus/meng-invalidate cache Redis terlebih dahulu:
      ```typescript
      // Invalidate cache lama agar eksekusi baru punya hasil fresh
      await this.redis.del(this.getCacheKey(id));
      ```
      Sehingga, setiap kali route eksekusi dipanggil, backend dipaksa mengantrekan proses ke BullMQ.
    * Caching data (TTL 5 menit) hanya digunakan ketika memanggil endpoint retrieval `GET /queries/:id/result` ([queries.service.ts:L154-L173](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.service.ts#L154-L173)).
  * Dampak: Assertion cache pada route eksekusi akan bernilai `false` (selalu reload dari database).

---

#### TC-PH3-04: Validasi Custom Fields Expression Parser
* **ID Skenario:** `TC-PH3-04`
* **Status:** ❌ **FAIL** (Perbedaan Endpoint & Payload)
* **Analisis Kode:**
  * Ekspektasi Skenario: Membuat custom field via `POST /query-builder/custom-fields` dengan body mengandung `sourceTable`, dan menolak SQL Injection.
  * Realita Backend:
    * Endpoint yang terdaftar di controller adalah `POST /custom-fields` ([custom-fields.controller.ts:L11-L22](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/custom-fields/custom-fields.controller.ts#L11-L22)).
    * Nama properti tabel di body request adalah `targetTable`, bukan `sourceTable`.
    * Keamanan Ekspresi: Validasi di `CustomFieldsService.validateExpression` ([custom-fields.service.ts:L166-L189](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/custom-fields/custom-fields.service.ts#L166-L189)) berhasil memblokir SQL Injection (seperti titik koma `;`, tanda kutip, dan keyword JS berbahaya) dan melempar `400 Bad Request`.
  * Dampak: Jalur pemanggilan URL tes patah (404), meskipun filter keamanan di level service sudah bekerja dengan baik.

---

#### TC-PH3-05: Validasi Data Blending (JOIN Engine)
* **ID Skenario:** `TC-PH3-05`
* **Status:** ❌ **FAIL** (Mismatch Endpoint & Skema Payload)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menggabungkan data via `POST /query-builder/blend` dengan skema left/right table dan joinCondition.
  * Realita Backend:
    * Endpoint terpasang pada `POST /blends` ([blends.controller.ts:L11-L26](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/blends/blends.controller.ts#L11-L26)).
    * Skema body menerima payload gabungan array sources:
      ```typescript
      body: {
        name: string;
        joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
        sources: { dataSourceId: string; streamName: string; joinKey: string; alias?: string; }[];
      }
      ```
    * Pemrosesan blending dijalankan secara asinkron/sinkron terpisah via `POST /blends/:id/execute` ([blends.controller.ts:L41-L44](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/blends/blends.controller.ts#L41-L44)).
  * Dampak: Perbedaan struktur payload dan alur eksekusi blending menyebabkan tes otomatis gagal total.

---

#### TC-PH3-06: Validasi Query Scheduling Cron Timezone-Aware
* **ID Skenario:** `TC-PH3-06`
* **Status:** ❌ **FAIL** (Absennya Fitur Timezone)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menyimpan jadwal otomatis timezone-aware via `POST /query-builder/schedules` dengan parameter `timezone` (misal: "Asia/Jakarta") dan memvalidasi kebenaran format timezone.
  * Realita Backend:
    * Endpoint scheduling adalah `POST /queries/:id/schedule` ([queries.controller.ts:L96-L102](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.controller.ts#L96-L102)).
    * Properti body hanya menerima `{ cronExpression: string; isActive: boolean }`.
    * Model database `QuerySchedule` ([schema.prisma:L185-L193](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/prisma/schema.prisma#L185-L193)) tidak memiliki kolom `timezone`.
    * Logika penjadwalan berjalan sepenuhnya pada server time (UTC) tanpa ada validasi string timezone di database maupun controller.
  * Dampak: Key `timezone` diabaikan, dan validasi timezone palsu (400 Bad Request) tidak akan pernah terpicu.

---

#### TC-PH3-07: Validasi Query Execution Menangani Timeout
* **ID Skenario:** `TC-PH3-07`
* **Status:** ❌ **FAIL** (Absennya Logika Timeout Kustom)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menentukan batas waktu (misal `timeoutMs: 5000`) pada request eksekusi query. Jika query di database memakan waktu lebih lama (misal `SELECT pg_sleep(60)`), query dibatalkan otomatis dan status job di-update ke `FAILED` dengan pesan error timeout.
  * Realita Backend:
    * Endpoint `POST /queries/:id/execute` tidak menerima parameter body apa pun, termasuk `timeoutMs`.
    * BullMQ worker ([queries.processor.ts:L28](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.processor.ts#L28)) mengeksekusi raw SQL secara langsung via `this.prisma.$queryRawUnsafe(rawSql)` tanpa pembatasan waktu execution. Query akan berjalan terus di DB hingga level koneksi default/gateway putus.
  * Dampak: Query berjalan penuh tanpa interupsi timeout, tes asersi status `FAILED` akan hang/gagal.

---

#### TC-PH3-08: Validasi Query dengan Parameter Binding (SQL Injection Prevention)
* **ID Skenario:** `TC-PH3-08`
* **Status:** ❌ **FAIL** (Absennya Fitur Parameter Binding)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengirim query SQL dengan parameter terpisah (misal `SELECT * FROM users WHERE email = $1` dan payload parameter `["' OR 1=1 --"]`) untuk mencegah eksploitasi SQL Injection.
  * Realita Backend:
    * Worker mengeksekusi SQL mentah menggunakan `this.prisma.$queryRawUnsafe(rawSql)` ([queries.processor.ts:L28](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.processor.ts#L28)).
    * Tidak ada struktur payload parameters yang diterima atau diproses oleh endpoint eksekusi di [queries.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.controller.ts) maupun [queries.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.service.ts).
  * Dampak: Penggunaan dynamic parameters di runtime tidak didukung.

---

#### TC-PH3-09: Validasi Query Execution Membatasi Jumlah Baris Hasil
* **ID Skenario:** `TC-PH3-09`
* **Status:** ❌ **FAIL** (Ketiadaan Limit & Metadata)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengembalikan hasil query dengan baris dibatasi (misal maks 10.000) dan menyertakan metadata `totalRows` vs `returnedRows`.
  * Realita Backend:
    * `QueryProcessor` mengeksekusi dan mengambil seluruh hasil query dari database ([queries.processor.ts:L28-L49](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.processor.ts#L28-L49)). Baris data tidak dibatasi untuk payload caching di Redis.
    * Pembatasan slice 1000 baris hanya berlaku untuk `resultSnapshot` yang disimpan di database ([queries.processor.ts:L54-L63](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.processor.ts#L54-L63)).
    * Response hasil eksekusi tidak menyertakan struktur object `metadata` (hanya `rowCount`, `columns`, `rows`, `durationMs`).
  * Dampak: Format response tidak sesuai dengan skema asersi tes otomatis.

---

#### TC-PH3-10: Validasi Performance Query Kompleks dengan k6
* **ID Skenario:** `TC-PH3-10`
* **Status:** ❌ **FAIL** (Endpoint & Payload Mismatch)
* **Analisis Kode:**
  * Ekspektasi Skenario: Script k6 memanggil `POST /queries/execute` dengan payload `{ sql, connectionId }` secara konkuren.
  * Realita Backend: Karena rute tersebut mengembalikan status **404 Not Found** (karena rute asli membutuhkan parameter path `:id`), tes beban k6 akan menghasilkan error rate 100%.
  * Dampak: Metrik performance k6 tidak valid.

---

### 🔸 Phase 4 — Data Management

#### TC-PH4-01: Validasi Export Data ke Google Sheets
* **ID Skenario:** `TC-PH4-01`
* **Status:** ❌ **FAIL** (Perbedaan Payload & Alur Kerja)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengirim data ke `POST /data-transfer/export/google-sheets` dengan body `{ jobId, spreadsheetTitle, sheetName }` untuk membuat sheet baru secara dinamis dan mendapatkan link sheet.
  * Realita Backend:
    * Endpoint aslinya terletak di `POST /integrations/sheets/export` ([google-sheets.controller.ts:L29](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/integrations/google-sheets/google-sheets.controller.ts#L29)).
    * Body payload mewajibkan properti `sheetId` (ID spreadsheet yang sudah ada di Google Drive) dan `mode` ('append' | 'replace') ([google-sheets.controller.ts:L13-L18](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/integrations/google-sheets/google-sheets.controller.ts#L13-L18)).
    * GoogleSheetsService mengekspor data ke dokumen spreadsheet yang sudah ada, tidak membuat file spreadsheet baru dari nol ([google-sheets.service.ts:L50-L52](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/integrations/google-sheets/google-sheets.service.ts#L50-L52)).
    * Format response yang dihasilkan adalah `{ success: true, message, rowsProcessed, mode }`, tidak mengembalikan URL tautan spreadsheet (`spreadsheetUrl`).
  * Dampak: Tes otomatis gagal total karena pemanggilan rute salah dan kegagalan parameter `sheetId`.

---

#### TC-PH4-02: Validasi Export Data ke Excel
* **ID Skenario:** `TC-PH4-02`
* **Status:** ❌ **FAIL** (Perbedaan Format Output & Payload)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengirim `POST /data-transfer/export/excel` dengan `{ jobId, fileName }` dan mengembalikan JSON berisi link download (`downloadUrl`), ukuran file, dan jumlah baris.
  * Realita Backend:
    * Endpoint-nya adalah `POST /integrations/excel/export` ([excel.controller.ts:L30](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/integrations/excel/excel.controller.ts#L30)).
    * Request payload menggunakan `queryId` untuk mengambil snapshot eksekusi query (bukan `jobId`) ([excel.controller.ts:L15](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/integrations/excel/excel.controller.ts#L15)).
    * Endpoint ini langsung mengirimkan binary stream `.xlsx` buffer dengan header `Content-Disposition: attachment; filename="..."` ([excel.controller.ts:L86-L93](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/integrations/excel/excel.controller.ts#L86-L93)), tidak mengembalikan JSON berisi `downloadUrl`.
  * Dampak: Script tes otomatis yang mengharapkan response JSON akan mengalami error parsing karena menerima binary buffer.

---

#### TC-PH4-03: Validasi API Query Builder (Custom HTTP Request)
* **ID Skenario:** `TC-PH4-03`
* **Status:** ❌ **FAIL** (Alur Pemrosesan Berbeda)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengeksekusi custom HTTP request ad-hoc secara langsung lewat `POST /api-queries/execute` dengan body konfigurasi HTTP.
  * Realita Backend:
    * Eksekusi langsung/preview API query ad-hoc tanpa simpan tidak didukung.
    * Pengguna harus membuat konfigurasi query terlebih dahulu via `POST /api-queries` ([api-queries.controller.ts:L22](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/api-queries/api-queries.controller.ts#L22)), kemudian mengeksekusi dengan memanggil ID-nya di database via `POST /api-queries/:id/execute` ([api-queries.controller.ts:L46-L50](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/api-queries/api-queries.controller.ts#L46-L50)).
  * Dampak: Tes otomatis terputus pada route `/api-queries/execute` (404 Not Found).

---

#### TC-PH4-04: Validasi JSONPath Extraction
* **ID Skenario:** `TC-PH4-04`
* **Status:** ❌ **FAIL** (Penyimpangan Penanganan Error)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menolak ekspresi JSONPath yang tidak valid dengan status **400 Bad Request**.
  * Realita Backend:
    * Pada `ApiQueriesService.executeApiQuery` ([api-queries.service.ts:L170-L176](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/api-queries/api-queries.service.ts#L170-L176)), jika sintaks JSONPath salah, error ditangkap secara lokal (silent catch) dan mengembalikan nilai `null`:
      ```typescript
      try {
        const values = JSONPath({ path: jsonPath, json: responseData });
        mappedResult[fieldName] = values.length === 1 ? values[0] : values;
      } catch {
        mappedResult[fieldName] = null; // ❌ Tidak melempar BadRequestException
      }
      ```
    * Eksekusi API query tetap berjalan sukses dengan status **200 OK**, hanya datanya saja yang bernilai null.
  * Dampak: Tes asersi status `400` untuk JSONPath invalid akan gagal karena API mengembalikan status `200`.

---

#### TC-PH4-05: Validasi Data Retention Policy
* **ID Skenario:** `TC-PH4-05`
* **Status:** ❌ **FAIL** (Endpoint Manual Trigger Tidak Ada)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menghapus data expired dengan memicu cleanup via `POST /data-warehousing/retention/trigger`.
  * Realita Backend:
    * Tidak ada rute manual trigger retention di controller mana pun.
    * Logika retention policy hanya diimplementasikan sebagai fungsi penjadwalan internal `@Cron(CronExpression.EVERY_DAY_AT_2AM)` ([warehouse.service.ts:L247-L278](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/warehouse/warehouse.service.ts#L247-L278)) yang berjalan otomatis di latar belakang untuk semua model `ManagedTable` yang berkonfigurasi `retentionDays`.
  * Dampak: Eksekusi tes otomatis ke endpoint trigger manual menghasilkan **404 Not Found**.

---

#### TC-PH4-06: Validasi Dynamic Table Manager CRUD
* **ID Skenario:** `TC-PH4-06`
* **Status:** ❌ **FAIL** (Ketidaksesuaian Endpoint Base & Parameter Tabel)
* **Analisis Kode:**
  * Ekspektasi Skenario: Membuat tabel dinamis via `POST /table-manager/tables` dan melakukan manipulasi baris (CRUD) menggunakan nama tabel (misal: `qa_dynamic_table`).
  * Realita Backend:
    * Endpoint base di controller adalah `/tables` ([table-manager.controller.ts:L23](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/table-manager/table-manager.controller.ts#L23)), bukan `/table-manager/tables`.
    * Operasi manipulasi data baris (create/read/update/delete row) membutuhkan **UUID (id) tabel** ([table-manager.controller.ts:L75-L78](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/table-manager/table-manager.controller.ts#L75-L78)), bukan nama tabel string.
  * Dampak: Penggunaan nama tabel di parameter path akan menghasilkan error 404/400 (karena validasi format UUID).

---

#### TC-PH4-07: Validasi CSV Import
* **ID Skenario:** `TC-PH4-07`
* **Status:** ❌ **FAIL** (Inkonsistensi Rute & Parameter Path)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengunggah file CSV ke `POST /table-manager/tables/:name/import`.
  * Realita Backend:
    * Endpoint-nya adalah `POST /tables/:id/import` ([table-manager.controller.ts:L115](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/table-manager/table-manager.controller.ts#L115)) yang membutuhkan parameter UUID tabel (`:id`), bukan nama tabel (`:name`).
  * Dampak: Request tes otomatis mengembalikan status **404 Not Found** atau melempar error validasi UUID.

---

#### TC-PH4-08: Validasi CSV Export dari Dynamic Table
* **ID Skenario:** `TC-PH4-08`
* **Status:** ❌ **FAIL** (Inkonsistensi Parameter URL)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengunduh data CSV via `GET /table-manager/tables/:name/export?format=csv`.
  * Realita Backend:
    * Endpoint-nya adalah `GET /tables/:id/export` ([table-manager.controller.ts:L127](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/table-manager/table-manager.controller.ts#L127)), yang membutuhkan parameter UUID tabel (`:id`) dan langsung mengembalikan file CSV tanpa perlu query parameter `format=csv`.
  * Dampak: Request dengan nama tabel di path akan mengembalikan status **404 Not Found**.

---

#### TC-PH4-09: Validasi RBAC untuk Table Management
* **ID Skenario:** `TC-PH4-09`
* **Status:** ❌ **FAIL** (Ketiadaan Proteksi Roles Guard & Mismatch Role)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menolak request `DELETE` tabel oleh user dengan role `MEMBER` dengan status **403 Forbidden**.
  * Realita Backend:
    * `TableManagerController` ([table-manager.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/table-manager/table-manager.controller.ts)) hanya dilindungi oleh `@UseGuards(AuthGuard('jwt'))`. Modul ini **tidak mengimplementasikan** `RolesGuard` atau decorator `@Roles()`.
    * Akibatnya, semua user yang terautentikasi (termasuk role EDITOR/VIEWER) memiliki wewenang penuh untuk menghapus tabel dan isinya.
    * Model Role database ([schema.prisma](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/prisma/schema.prisma#L588-L593)) hanya mendefinisikan `OWNER`, `ADMIN`, `EDITOR`, dan `VIEWER`. Tidak ada role bernama `MEMBER`.
  * Dampak: User non-admin berhasil menghapus tabel (200 OK) alih-alih diblokir (403 Forbidden).

---

#### TC-PH4-10: Validasi Performance CSV Import Volume Besar
* **ID Skenario:** `TC-PH4-10`
* **Status:** ❌ **FAIL** (Endpoint & Parameter Mismatch)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengunggah CSV 10.000 baris ke `POST /table-manager/tables/qa_perf_table/import` dan selesai di bawah 30 detik.
  * Realita Backend: Rute yang salah di test case (`/table-manager/tables/:name/import` vs `/tables/:id/import`) menyebabkan request diblokir/gagal sebelum performa dapat diukur.
  * Dampak: Asersi benchmarking performa tidak dapat diuji.

---

## 🐛 Rangkuman Temuan Kritis (Bugs & Gaps)

1. **Ketiadaan Fitur Keamanan Table Manager (RBAC Bypass):**
   * Controller `TableManagerController` sama sekali tidak memeriksa role pengguna. Hal ini membahayakan data warehouse karena role non-admin dapat memanipulasi dan menghapus tabel dinamis.
2. **Absennya Fitur Query Engine yang Direncanakan:**
   * **Visual Query Builder Parser:** Frontend mengirim filter/grouping tetapi backend hanya menyimpan blob JSON tanpa parser ke SQL PostgreSQL.
   * **Parameter Binding:** Worker BullMQ langsung mengeksekusi SQL string mentah via `queryRawUnsafe()`, tidak mendukung dynamic query parameters binding pada waktu eksekusi.
   * **Query Timeout:** Tidak ada mekanisme pembatalan query database jika waktu eksekusi melebihi batas detik tertentu.
3. **Penyimpangan Penanganan Error JSONPath:**
   * Sintaks JSONPath yang salah ditangkap secara diam-diam (*silent catch*) dan hanya mengembalikan nilai null, bukan melempar kesalahan **400 Bad Request**.
4. **Inkonsistensi Rute & Skema Identitas Tabel:**
   * Rute di dokumentasi tes menggunakan prefix `/table-manager/tables` dan parameter nama tabel (string). Rute nyata menggunakan `/tables` dan mewajibkan UUID (id) database.

---

## 🔧 Rekomendasi Solusi Teknikal

> [!TIP]
> Untuk menyelaraskan performa API dengan rencana QA Tester Phase 3 & Phase 4, lakukan langkah-langkah berikut:

1. **Terapkan Roles Guard di Table Manager:**
   * Tambahkan `@UseGuards(AuthGuard('jwt'), RolesGuard)` dan `@Roles(Role.OWNER, Role.ADMIN)` pada rute-rute sensitif (seperti delete/create tabel) di [table-manager.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/table-manager/table-manager.controller.ts).
2. **Implementasikan Parameter Binding:**
   * Ubah implementasi worker di [queries.processor.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/queries/queries.processor.ts) agar menerima array parameter dinamis dari payload job BullMQ dan meneruskannya ke fungsi eksekusi database yang aman (parameterized query).
3. **Buat Rute Manual Trigger Retention & Query Timeout:**
   * Tambahkan endpoint manual trigger di [warehouse.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/warehouse/warehouse.controller.ts) yang memanggil `applyRetentionPolicy()`.
   * Gunakan session timeout / `SET statement_timeout` PostgreSQL atau pembatalan asinkron di NestJS saat mengeksekusi query database untuk mendukung batas `timeoutMs`.
4. **Perbaiki Response JSONPath Validation:**
   * Di dalam [api-queries.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/api-queries/api-queries.service.ts), validasi ekspresi JSONPath menggunakan blok `try-catch` saat menyimpan/memperbarui data, dan lemparkan `BadRequestException` (400) jika sintaks tidak valid.

---
*Laporan ini dibuat secara otomatis oleh subagent pengujian QA Gemini 3.5 Flash.*
