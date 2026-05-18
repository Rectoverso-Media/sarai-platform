# SARAI Frontend

This folder contains SARAI frontend development files.

cd frontend

npm install

npm run dev

# SARAI Platform — Enterprise Data Integration & Analytics Engine

SARAI adalah platform *Data Platform as a Service* (DPaaS) tingkat lanjut yang dirancang untuk mengintegrasikan ratusan sumber data secara otomatis, mengolahnya dengan mesin query berbasis AI, dan menyajikannya dalam bentuk *dashboard* analitik interaktif yang dinamis.

## 🚀 Fitur Utama (Core Pillars)

- **Data Pipeline (M2):** Integrasi otomatis dengan 600+ konektor data memanfaatkan Airbyte Cloud Engine.
- **Query Engine & AI Assistant (M3):** Pembuat query berbasis visual (*No-Code Builder*) dan editor SQL mentah yang dilengkapi asisten AI (*Text-to-SQL*) menggunakan model **LLaMA 3.1** via Groq API.
- **Asynchronous Processing:** Eksekusi query skala besar di balik layar (*background jobs*) menggunakan antrean **BullMQ** dan **Redis**.
- **Interactive Dashboard Builder (M4):** Penyusunan grafik visual (Bar, Line, Pie, KPI) dengan sistem *drag-and-drop* interaktif serta fitur pembagian akses publik (*Shared Dashboard Read-Only*).
- **Multi-Tenancy & Enterprise Architecture:** Dukungan manajemen tim, log keamanan, audit sistem, dan pembatasan kuota penggunaan (*subscription ready*).

## 🛠️ Arsitektur Teknologi (Tech Stack)

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, React Grid Layout, Recharts.
- **Backend:** NestJS, TypeScript, BullMQ (Queue Management).
- **Database & ORM:** PostgreSQL (Supabase), Prisma ORM, Redis (Upstash).
- **AI Engine:** LLaMA 3.1 via Groq Cloud API.

## 📂 Struktur Database (41+ Tabel)

Komponen database dikelompokkan secara modular dalam 18 grup domain utama untuk mendukung performa dan skalabilitas:

1. **User & Auth:** `users`, `user_sessions`
2. **Team & Collaboration:** `teams`, `team_members`, `team_invitations`
3. **Data Source Integration:** `data_sources`, `connections`, `connection_auth_links`
4. **Synced Pipeline:** `airbyte_synced_*` (Tabel dinamis dari Airbyte Engine)
5. **Query Management:** `queries`, `query_executions`, `query_schedules`
6. **Custom Fields Mapping:** `custom_fields`, `custom_field_mappings`
7. **Data Blending:** `blends`, `blend_source_configs`
8. **Data Transfer:** `transfers`, `transfer_executions`
9. **API Custom Query:** `api_queries`, `api_query_executions`
10. **Dashboard Visuals:** `dashboards`, `widgets`
11. **Data Explorer:** `explorer_sessions`
12. **AI Engine Analytics:** `ai_chat_sessions`, `ai_chat_messages`, `insight_configs`, `insight_results`
13. **Warehouse Cache:** `warehouse_tables`, `warehouse_data`
14. **Table Manager:** `managed_tables`, `table_rows`
15. **Subscription Billing:** `subscriptions`, `user_subscriptions`, `usage_metrics`
16. **Third-Party Integration:** `integrations`, `linked_documents`, `templates`
17. **Smart Notification:** `notifications`, `alert_rules`, `alert_triggers`
18. **System Configurations:** `audit_logs`, `app_settings`, `rate_limit_configs`

## ⚙️ Cara Memulai Pengoperasian Lokal

### 1. Prasyarat Sistem
Pastikan perangkat Anda sudah terpasang:
- Node.js (Versi 18 atau terbaru)
- PostgreSQL / Akun Supabase aktif
- Redis Instance / Akun Upstash aktif

### 2. Konfigurasi Environment Variables (`.env`)
Buat file `.env` di dalam direktori `backend` dan sesuaikan variabel berikut:

```env
DATABASE_URL="postgresql://username:password@your-supabase-host:6543/postgres?pgbouncer=true"
GROQ_API_KEY="gsk_your_groq_api_key_here"
REDIS_HOST="your-upstash-redis-host"
REDIS_PORT=6379
REDIS_PASSWORD="your-upstash-redis-password"
JWT_SECRET="your_jwt_secret_key"