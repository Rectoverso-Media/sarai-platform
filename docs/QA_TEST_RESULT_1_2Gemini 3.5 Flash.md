# 🧪 QA Test Execution Report — Phase 1 & Phase 2
## (Gemini 3.5 Flash Verification Edition)

**Tanggal Pelaksanaan:** 17 Juni 2026  
**Metode Pengujian:** Static Code Analysis (SCA) + Codebase Audit + Integration Test Verification  
**Platform:** SARAI Platform v2.0  
**Backend:** NestJS + Prisma + PostgreSQL + BullMQ + Redis  
**Frontend:** Next.js 16 (React 19)  
**Model Auditor:** Gemini 3.5 Flash  

---

## 📊 Ringkasan Eksekusi Pengujian

Berdasarkan audit mendalam terhadap kode sumber (source code) backend dan frontend, kami memetakan **20 Skenario Pengujian** dari [QA_AUTOMATION_PHASE_1_2.md](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/docs/QA_AUTOMATION_PHASE_1_2.md) ke implementasi kode nyata.

| Kategori | Total TC | ✅ Pass | ❌ Fail (Discrepancy) | ⚠️ Blocked (Mising Env) | Status Kesiapan |
|----------|----------|---------|------------------------|--------------------------|-----------------|
| **Phase 1 — Core Infrastructure** | 10 | 2 | 7 | 1 | 🟡 **Conditionally Ready** |
| **Phase 2 — Data Engine & Connectors** | 10 | 0 | 9 | 1 | 🔴 **Not Ready (Critical Gaps)** |
| **TOTAL** | **20** | **2** | **16** | **2** | 🟡 **Needs Refactoring** |

> [!WARNING]
> **Tingkat Ketidaksesuaian Tinggi (80%):** Ditemukan kesenjangan (gap) yang signifikan antara skenario tes otomatis yang dirancang di `QA_AUTOMATION_PHASE_1_2.md` dengan implementasi rute (endpoint), penamaan variabel payload, kode HTTP status, dan model database di backend NestJS.

---

## 📋 Hasil Detil Per Test Case (TC)

### 🔹 Phase 1 — Foundation & Core Infrastructure

#### TC-PH1-01: Validasi Register Email Unik
* **ID Skenario:** `TC-PH1-01`
* **Status:** ❌ **FAIL** (Perbedaan Status HTTP)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menolak registrasi email ganda dengan status **409 Conflict**.
  * Realita Backend ([auth.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/auth/auth.service.ts#L23-L26)):
    ```typescript
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar!');
    }
    ```
    `BadRequestException` mengembalikan status **400 Bad Request**, bukan **409 Conflict**.
  * Dampak: Script pengujian otomatis `expect(res.status).toBe(409)` akan gagal.

---

#### TC-PH1-02: Validasi Login JWT Berhasil
* **ID Skenario:** `TC-PH1-02`
* **Status:** ❌ **FAIL** (Perbedaan Penulisan Variabel & Endpoint Hilang)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengembalikan `accessToken` dan `refreshToken` (camelCase) dan mengakses protected endpoint `/auth/me`.
  * Realita Backend ([auth.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/auth/auth.service.ts#L434-L439)):
    ```typescript
    return {
      message: 'Login berhasil!',
      access_token: accessToken,  // ❌ snake_case
      refresh_token: refreshTokenStr, // ❌ snake_case
      user: userWithoutSensitive,
    };
    ```
    Payload login menggunakan `access_token` dan `refresh_token` (snake_case). Selain itu, endpoint `/auth/me` **tidak terdefinisi** di [auth.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/auth/auth.controller.ts).
  * Dampak: Assertion token dan akses ke `/auth/me` akan gagal.

---

#### TC-PH1-03: Validasi Protected API Menolak JWT Invalid
* **ID Skenario:** `TC-PH1-03`
* **Status:** ✅ **PASS**
* **Analisis Kode:**
  * Implementasi backend menggunakan Passport `JwtStrategy` ([jwt.strategy.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/auth/jwt.strategy.ts)) dengan parameter `ignoreExpiration: false` terpasang secara tepat.
  * Dampak: Request tanpa token, token kedaluwarsa, atau tanda tangan tidak sah di rute ber-guard JWT akan langsung ditolak dengan status **401 Unauthorized**.

---

#### TC-PH1-04: Validasi OAuth Callback Membuat atau Menghubungkan Akun
* **ID Skenario:** `TC-PH1-04`
* **Status:** ❌ **FAIL** (Rute Mocking Tidak Tersedia)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengirim payload mock ke `POST /auth/oauth/callback/mock`.
  * Realita Backend ([auth.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/auth/auth.controller.ts)): Hanya menyediakan endpoint Google OAuth asli via `GET /auth/google/callback` yang melakukan redirect 302 ke frontend url. Tidak ada endpoint mock callback untuk testing integration API.
  * Dampak: Request tes otomatis ke rute mock menghasilkan status **404 Not Found**.

---

#### TC-PH1-05: Validasi 2FA OTP Login Flow
* **ID Skenario:** `TC-PH1-05`
* **Status:** ❌ **FAIL** (Mismatch Alur & Nama Key)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengembalikan `challengeId` lalu verifikasi via `POST /auth/2fa/verify` dengan body `{ challengeId, otp }`.
  * Realita Backend ([auth.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/auth/auth.service.ts#L70-L87)):
    * Mengembalikan `tempToken` (bukan `challengeId`).
    * Endpoint `POST /auth/2fa/verify` memerlukan JWT (auth guard aktif) dan digunakan untuk aktivasi awal.
    * Untuk login 2FA setelah password, endpoint yang benar adalah `POST /auth/2fa/login` dengan parameter `{ tempToken, code }`.
  * Dampak: Alur tes otomatis patah karena skema parameter dan endpoint yang berbeda.

---

#### TC-PH1-06: Validasi RBAC Team Member Tidak Bisa Akses Admin API
* **ID Skenario:** `TC-PH1-06`
* **Status:** ❌ **FAIL** (Role & Endpoint Tidak Sinkron)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menolak role `'MEMBER'` saat mengakses `POST /teams/team-qa-001/invitations`.
  * Realita Backend & DB ([schema.prisma](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/prisma/schema.prisma)):
    * Role enum hanya berisi `OWNER`, `ADMIN`, `EDITOR`, dan `VIEWER`. Tidak ada role bernama `MEMBER`.
    * Rute di [team.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/team/team.controller.ts) adalah `POST /team`, bukan `/teams/:id/invitations`.
  * Dampak: Tes menghasilkan status **404 Not Found** daripada **403 Forbidden**.

---

#### TC-PH1-07: Validasi Admin Bisa Mengundang Member Team
* **ID Skenario:** `TC-PH1-07`
* **Status:** ❌ **FAIL** (Penyimpangan Logika & Skema Database)
* **Analisis Kode:**
  * Ekspektasi Skenario: Admin membuat undangan baru ke tabel `TeamInvitation` dengan status `PENDING`.
  * Realita Backend ([team.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/team/team.service.ts#L62-L87)):
    * Fungsi `addMember` secara langsung membuat data `User` baru di DB dengan `isEmailVerified: false` dan `teamId` terisi.
    * Tabel `TeamInvitation` yang terdefinisi di schema Prisma **diabaikan sama sekali**.
  * Dampak: Tes verifikasi database atas ketersediaan row di tabel `TeamInvitation` akan gagal.

---

#### TC-PH1-08: Validasi Rate Limiting Login
* **ID Skenario:** `TC-PH1-08`
* **Status:** ❌ **FAIL** (Ambang Batas Terlalu Tinggi)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengirimkan 12 request login gagal berturut-turut untuk mendapatkan status **429 Too Many Requests**.
  * Realita Backend ([app.module.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/app.module.ts#L63-L66)):
    * Throttler dikonfigurasi global dengan batas `limit: 20` request per menit (`ttl: 60000`).
  * Dampak: 12 request percobaan tidak mencukupi untuk memicu proteksi (butuh 21 request). Tes akan mengembalikan status `401` terus menerus.

---

#### TC-PH1-09: Validasi Migrasi Prisma Membentuk Schema Core
* **ID Skenario:** `TC-PH1-09`
* **Status:** ✅ **PASS**
* **Analisis Kode:**
  * Skema database di [schema.prisma](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/prisma/schema.prisma) mendefinisikan tabel-tabel utama (`User`, `Team`, `TeamMember`, `DataSource`, `Connection`, `synced_data`).
  * Email unik ditandai dengan anotasi `@unique` di skema Prisma.

---

#### TC-PH1-10: Validasi Airbyte Cloud Config Health Check
* **ID Skenario:** `TC-PH1-10`
* **Status:** ⚠️ **BLOCKED**
* **Analisis Kode:**
  * Rute `GET /airbyte/test-connection` memanggil HTTP request eksternal ke URL API Airbyte.
  * Tanpa kredensial Airbyte Cloud asli (`AIRBYTE_CLIENT_ID`, `AIRBYTE_CLIENT_SECRET`, `AIRBYTE_WORKSPACE_ID` di file `.env`), fungsi ini akan selalu melempar exception UNAUTHORIZED / BAD_REQUEST.

---

### 🔸 Phase 2 — Data Source Engine & Connectors

#### TC-PH2-01: Validasi Airbyte API Wrapper Mengambil Workspace
* **ID Skenario:** `TC-PH2-01`
* **Status:** ⚠️ **BLOCKED**
* **Analisis Kode:**
  * Membutuhkan koneksi API Airbyte Cloud nyata. Tanpa kredensial yang valid di server lokal, request diblokir/gagal.

---

#### TC-PH2-02: Validasi Membuat Connection Baru
* **ID Skenario:** `TC-PH2-02`
* **Status:** ❌ **FAIL** (Endpoint & Logika Tidak Ada)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengirim data ke `POST /connections` untuk membuat koneksi baru.
  * Realita Backend ([airbyte.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/airbyte/airbyte.controller.ts)):
    * Tidak ada rute `POST /connections` atau `POST /airbyte/connections`. Yang tersedia hanya `POST /airbyte/sources` (membuat Data Source).
    * `AirbyteService` tidak memiliki method untuk membuat connection di sisi backend.
  * Dampak: Request tes otomatis mengembalikan status **404 Not Found**.

---

#### TC-PH2-03: Validasi Role MEMBER Tidak Bisa Membuat Connection
* **ID Skenario:** `TC-PH2-03`
* **Status:** ❌ **FAIL** (Endpoint Hilang)
* **Analisis Kode:**
  * Ekspektasi Skenario: Request diblokir dengan status **403 Forbidden**.
  * Realita Backend: Karena rute `POST /connections` tidak ada, request dari role manapun akan menghasilkan status **404 Not Found**.

---

#### TC-PH2-04: Validasi OAuth Flow via Airbyte
* **ID Skenario:** `TC-PH2-04`
* **Status:** ❌ **FAIL** (Endpoint Tidak Ditemukan)
* **Analisis Kode:**
  * Ekspektasi Skenario: Generate URL via `POST /airbyte/oauth/authorize`.
  * Realita Backend: Rute ini sama sekali tidak diimplementasikan di `AirbyteController`.
  * Dampak: Mengembalikan status **404 Not Found**.

---

#### TC-PH2-05: Validasi Source Catalog Mapping 600+ Sources
* **ID Skenario:** `TC-PH2-05`
* **Status:** ❌ **FAIL** (Route & Data Mismatch)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengambil katalog di `GET /sources/catalog` dan memastikan terdapat minimal 600 sources.
  * Realita Backend ([airbyte.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/airbyte/airbyte.controller.ts#L29-L32)):
    * Rute yang benar adalah `GET /airbyte/connectors`.
    * Katalog fallback lokal di [source-catalog.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/airbyte/source-catalog.ts) hanya mendefinisikan sekitar 10-15 data source populer secara hardcoded, bukan 600+.
  * Dampak: Tes gagal karena rute salah dan jumlah data tidak memenuhi kriteria minimal.

---

#### TC-PH2-06: Validasi Sync Config Full Refresh
* **ID Skenario:** `TC-PH2-06`
* **Status:** ❌ **FAIL** (Endpoint Salah)
* **Analisis Kode:**
  * Ekspektasi Skenario: Mengirim PATCH ke `/connections/conn_qa_001/sync-config`.
  * Realita Backend: Endpoint yang diimplementasikan di controller adalah `PATCH /airbyte/connections/:id/config`.
  * Dampak: Request tes otomatis mengembalikan status **404 Not Found**.

---

#### TC-PH2-07: Validasi Sync Config Incremental Wajib Cursor Field
* **ID Skenario:** `TC-PH2-07`
* **Status:** ❌ **FAIL** (Ketiadaan Validasi Backend)
* **Analisis Kode:**
  * Ekspektasi Skenario: Request ditolak dengan status **400 Bad Request** jika sync mode `'incremental'` dikirim tanpa `cursorField`.
  * Realita Backend ([airbyte.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/airbyte/airbyte.service.ts#L267-L318)):
    * Method `updateSyncConfiguration` langsung membungkus data masukan dan mengirimkannya ke API Airbyte tanpa melakukan pengecekan validitas cursor di level NestJS.
  * Dampak: Payload invalid tidak ditolak di backend (diteruskan langsung ke Airbyte API eksternal).

---

#### TC-PH2-08: Validasi Sync Monitoring Menampilkan Status Job
* **ID Skenario:** `TC-PH2-08`
* **Status:** ❌ **FAIL** (Endpoint Mismatch)
* **Analisis Kode:**
  * Ekspektasi Skenario: Membuka endpoint `GET /connections/:id/sync-status` dan sub-rute `/history`.
  * Realita Backend: Endpoint yang di-expose adalah `GET /airbyte/sources/:id/sync-status`. Sub-rute `/history` tidak diimplementasikan.
  * Dampak: Mengembalikan status **404 Not Found**.

---

#### TC-PH2-09: Validasi Trial System 14 Hari
* **ID Skenario:** `TC-PH2-09`
* **Status:** ❌ **FAIL** (Model/Endpoint Tidak Ada)
* **Analisis Kode:**
  * Ekspektasi Skenario: Membuat workspace baru via `POST /workspaces` dan menetapkan trial 14 hari.
  * Realita Backend & DB: Rute `/workspaces` tidak ada. Model `Workspace` tidak terdefinisi di database (billing/trial dikelola per `Team` atau per `DataSource`).
  * Dampak: Mengembalikan status **404 Not Found**.

---

#### TC-PH2-10: Validasi Trial Expired Membatasi Create Connection
* **ID Skenario:** `TC-PH2-10`
* **Status:** ❌ **FAIL** (Fitur Pembatasan Logika Belum Siap)
* **Analisis Kode:**
  * Ekspektasi Skenario: Menolak create connection pada workspace expired dengan status **402 Payment Required**.
  * Realita Backend ([trial.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/datasources/trial.service.ts)):
    * Meskipun Scheduler memperbarui status DataSource ke `'Expired'`, tidak ada logika interseptor atau middleware di controller yang menolak request pembuatan koneksi/source dengan status HTTP 402 ketika status trial sudah nonaktif.
  * Dampak: Skenario gagal karena backend tidak melempar error 402.

---

## 🐛 Rangkuman Temuan Kritis (Bugs & Gaps)

1. **Inkonsistensi Nama Property (Snake vs Camel Case):**
   * Backend mengembalikan token dengan key `access_token` dan `refresh_token`. Skenario pengujian Jest mengharapkan `accessToken` dan `refreshToken`.
2. **Pengabaian Skema Database Undangan:**
   * Model database `TeamInvitation` diabaikan oleh `TeamService.addMember()`, yang justru langsung membuat user palsu/unverified di database.
3. **Absensi Endpoint Penting:**
   * Endpoint seperti `/auth/me`, `/workspaces`, dan `/connections` (pembuatan koneksi) tidak ada di backend NestJS.
4. **Validasi Input Terlalu Longgar:**
   * Parameter `cronExpression` dan penentuan cursor pada mode sync `incremental` dikirim mentah-mentah ke Airbyte tanpa validasi lokal di NestJS.
5. **Konfigurasi Throttling Terlalu Tinggi:**
   * Global rate limit 20 req/menit membuat tes brute force (12 kali gagal) tidak mendeteksi status 429.

---

## 🔧 Rekomendasi Solusi Teknikal

> [!TIP]
> Untuk menyelaraskan performa API dengan rencana QA Tester Phase 1 & Phase 2, lakukan langkah-langkah berikut:

1. **Normalisasi Payload Auth:** Ubah output JWT login pada [auth.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/auth/auth.service.ts) menjadi format camelCase untuk `accessToken` dan `refreshToken`.
2. **Implementasikan Endpoint `/auth/me`:** Tambahkan route handler GET `/auth/me` di [auth.controller.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/auth/auth.controller.ts) yang mengembalikan informasi user yang sedang aktif dari objek `req.user`.
3. **Penyelarasan Alur Undangan Tim:** Ubah `addMember` di [team.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/team/team.service.ts) agar menulis ke tabel `TeamInvitation` terlebih dahulu, baru kemudian membuat `User` saat undangan diterima (`acceptInvite`).
4. **Validasi Kursor Sinkronisasi:** Tambahkan logic check di `updateSyncConfiguration` ([airbyte.service.ts](file:///c:/Users/Arbawi/Desktop/Internship/Okegas/sarai-platform/backend/src/airbyte/airbyte.service.ts)) untuk memastikan setiap stream bertipe `incremental` memiliki `cursorField` yang terdefinisi.
5. **Tambahkan Rate Limiter Khusus Login:** Konfigurasikan throttler limit khusus untuk endpoint `/auth/login` (misal 5 request per menit) agar tidak bentrok dengan limit global.

---
*Laporan ini dibuat secara otomatis oleh subagent pengujian QA Gemini 3.5 Flash.*
