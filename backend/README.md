
# Sarai Platform - Backend Architecture & Database Documentation

Repositori ini berisi struktur backend dan dokumentasi skema database untuk **Sarai Platform**. Sistem ini dirancang dengan arsitektur multi-tenant (berbasis tim) yang berfungsi sebagai platform integrasi data, visualisasi, dan analitik berbasis AI.

## 🛠 Tech Stack (Backend)
* **Framework:** NestJS
* **Database:** PostgreSQL
* **Authentication:** JWT (JSON Web Tokens) & OAuth
* **Data Integration:** Airbyte (untuk *data syncing*)
* **Billing/Payment:** Stripe

---

## 🗄️ Database Domains & Architecture

Skema database dibagi menjadi beberapa domain logis berdasarkan fungsionalitas fitur:

### 1. Identity, Access & Team Management (IAM)
Menangani autentikasi pengguna, otorisasi peran (RBAC), pengaturan sesi, dan manajemen *multi-tenancy* (Tim).
* `User`: Data inti pengguna (termasuk status 2FA).
* `UserSession`: Manajemen sesi JWT dan pelacakan login (IP, User Agent).
* `Team`: Entitas *tenant* utama. Menyimpan data kuota penggunaan (AI tokens, queries) dan status langganan Stripe.
* `TeamMember` & `TeamInvitation`: Relasi dan proses *onboarding* pengguna ke dalam tim.

### 2. Data Sources & Integrations
Mengelola koneksi ke sumber data eksternal, konfigurasi Airbyte, dan penyimpanan token OAuth.
* `DataSource` & `Connection`: Kredensial dan metadata sumber data, termasuk integrasi dengan *host* Airbyte.
* `ConnectionAuthLink` & `OAuthToken`: Penyimpanan token dan autentikasi pihak ketiga secara aman.
* `Integration` & `LinkedDocument`: Konfigurasi layanan terintegrasi lainnya di luar sumber data inti.

### 3. Query Engine & Data Pipeline
Menangani logika pengambilan data, *scheduling*, operasi ETL ringan, dan *blending* data.
* `Query`, `QueryExecution`, `QuerySchedule`: Menyimpan *raw SQL*, riwayat eksekusi, dan penjadwalan *cron*.
* `ApiQuery` & `ApiQueryExecution`: Pengambilan data via HTTP/API (termasuk *header* dan *body template*).
* `Blend` & `BlendSourceConfig`: Konfigurasi *JOIN* antar sumber data yang berbeda.
* `Transfer` & `TransferExecution`: Ekspor data dari platform ke target eksternal (misal: Google Sheets).
* `synced_data`: Tabel tujuan (*destination*) untuk data yang ditarik oleh Airbyte.

### 4. Visualizations & Dashboards
Sistem presentasi data dan antarmuka interaktif.
* `Dashboard`: Penampung *widgets*, konfigurasi *layout*, dan tema.
* `Widget`: Komponen visual individual (grafik, tabel) dengan koordinat tata letak (X, Y, W, H).
* `ShareToken`: Mekanisme berbagi *dashboard* ke publik melalui tautan berbatas waktu.
* `ExplorerSession`: Menyimpan sesi filter, *sort*, dan status halaman eksplorasi data secara *real-time*.

### 5. AI capabilities & Automated Insights
Fitur kecerdasan buatan untuk menganalisis anomali dan asisten *chat*.
* `AiChatSession` & `AiChatMessage`: Logika *conversational AI* antara pengguna dan asisten data.
* `InsightConfig` & `InsightResult`: Konfigurasi dan hasil analisis otomatis (seperti deteksi anomali pada metrik yang ditentukan).

### 6. System & Infrastructure Operations
Pemantauan kesehatan platform, batasan layanan (*rate limiting*), dan audit keamanan.
* `AuditLog`: Rekam jejak aktivitas (*action, actor, IP*) untuk keamanan.
* `UsageMetric`: Pencatatan metrik penggunaan tim (billing & kuota).
* `AppSetting` & `RateLimitConfig`: Konfigurasi global dan perlindungan *endpoint*.
* `AlertRule`, `AlertTrigger`, `Notification`: Sistem notifikasi dan peringatan berbasis ambang batas (*threshold*).
* `InfrastructureNode`: Status dan *uptime* dari *worker* atau layanan mikro.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL
* Stripe API Key
* Airbyte Instance (Opsional untuk testing lokal)

### Installation
1. *Clone* repositori `sarai-platform`.
2. Salin `.env.example` ke `.env` dan sesuaikan kredensial database PostgreSQL Anda.
3. Instal semua dependensi:
   ```bash
   npm install

```

4. Jalankan migrasi database atau sinkronisasi entitas:
```bash
npm run typeorm migration:run

```


5. Mulai *development server*:
```bash
npm run start:dev

```



---

*Dokumentasi ini di-generate berdasarkan DDL schema PostgreSQL terbaru.*

```

```