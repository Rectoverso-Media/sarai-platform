# SARAI Platform — Deployment Runbook

**Version:** 1.0  
**Last Updated:** June 2026  
**Owner:** Platform Engineering Team

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Local Development](#3-local-development)
4. [Docker Deployment](#4-docker-deployment)
5. [Database Migration](#5-database-migration)
6. [Health Checks](#6-health-checks)
7. [Rollback Procedure](#7-rollback-procedure)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥20.x | https://nodejs.org |
| Docker | ≥24.x | https://docker.com |
| Docker Compose | ≥2.x | included with Docker Desktop |
| PostgreSQL | ≥15 | via Docker |
| Redis | ≥7 | via Docker |

---

## 2. Environment Setup

### 2.1 Backend `.env`

```bash
# Copy template
cp backend/.env.example backend/.env

# Edit dengan credentials nyata
nano backend/.env  # atau code backend/.env
```

> [!CAUTION]
> **JANGAN pernah commit file `.env` ke git.** File ini sudah ada di `.gitignore`.
> Rotate semua credentials jika ada yang bocor.

### 2.2 Environment Variables Wajib

| Variable | Deskripsi | Cara mendapat |
|----------|-----------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard / self-hosted |
| `JWT_SECRET` | Min 64 karakter random | `openssl rand -base64 64` |
| `REDIS_HOST` | Redis host | Upstash Dashboard / self-hosted |
| `REDIS_PASSWORD` | Redis password | Upstash Dashboard |
| `STRIPE_SECRET_KEY` | Stripe API key | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `stripe listen --forward-to localhost:3001/billing/webhook` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console |
| `SMTP_USER` | Gmail address | Gmail Settings |
| `SMTP_PASS` | Google App Password | Google Account → Security → App Passwords |

---

## 3. Local Development

```bash
# 1. Clone & install
git clone <repo-url>
cd sarai-platform

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env dengan credentials
npm install
npx prisma generate
npx prisma migrate dev  # atau: npx prisma db push

# 3. Seed database (opsional)
npm run prisma db seed

# 4. Jalankan backend
npm run start:dev  # Port 3001

# 5. Setup frontend (terminal baru)
cd ../frontend
npm install
npm run dev  # Port 3000
```

---

## 4. Docker Deployment

### 4.1 Development dengan Docker Compose

```bash
# Buat .env di root project (atau di backend/)
cp backend/.env.example backend/.env

# Jalankan semua service
docker compose up --build

# Atau background:
docker compose up --build -d

# Lihat logs:
docker compose logs -f backend
docker compose logs -f frontend
```

### 4.2 Production Build

```bash
# Build production images
docker build \
  --target production \
  -t sarai-backend:latest \
  ./backend

DOCKER_BUILD=true docker build \
  --target runner \
  -t sarai-frontend:latest \
  ./frontend

# Jalankan dengan environment variables
docker run -d \
  --name sarai-backend \
  -p 3001:3001 \
  --env-file backend/.env \
  -e NODE_ENV=production \
  sarai-backend:latest
```

### 4.3 Database Migration di Docker

```bash
# Jalankan migration setelah container up
docker exec sarai-backend npx prisma migrate deploy

# Atau buat script entrypoint yang otomatis migrate:
# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

---

## 5. Database Migration

### 5.1 Development

```bash
# Buat migration baru setelah mengubah schema.prisma
npx prisma migrate dev --name "deskripsi_perubahan"

# Reset database (HAPUS SEMUA DATA — hanya untuk dev!)
npx prisma migrate reset
```

### 5.2 Production

```bash
# Deploy migration tanpa hapus data
npx prisma migrate deploy

# Verifikasi status migration
npx prisma migrate status
```

> [!WARNING]
> Selalu backup database sebelum menjalankan migration di production.

### 5.3 Backup Sebelum Migration

```bash
# Backup dengan pg_dump
pg_dump "$DATABASE_URL" | gzip > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql.gz
```

---

## 6. Health Checks

### 6.1 Manual Health Check

```bash
# Backend health
curl http://localhost:3001/

# API docs (dev only)
open http://localhost:3001/api/docs

# Database connection check
npx prisma db execute --stdin <<< "SELECT 1"

# Redis check
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
```

### 6.2 Docker Health Status

```bash
docker compose ps  # Lihat status semua container
docker inspect sarai-backend | grep -A 10 Health
```

---

## 7. Rollback Procedure

### 7.1 Code Rollback

```bash
# Rollback ke commit sebelumnya
git revert HEAD
git push

# Atau langsung ke commit tertentu
git checkout <commit-hash>
docker compose up --build -d
```

### 7.2 Database Rollback

```bash
# Restore dari backup
gunzip -c backup_pre_migration_20260617.sql.gz | psql "$DATABASE_URL"
```

---

## 8. Troubleshooting

### Backend tidak bisa konek ke Redis

```bash
# Cek Redis berjalan
docker compose ps redis

# Test koneksi manual
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
# Expected: PONG

# Cek env vars di container
docker exec sarai-backend env | grep REDIS
```

### BullMQ queue tidak berjalan

1. Pastikan Redis berjalan dan accessible
2. Cek `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` di env backend
3. Untuk Upstash: pastikan `tls: {}` dikonfigurasi di `QueriesService`

### Stripe webhook tidak diterima

```bash
# Forward webhook ke local (development)
stripe listen --forward-to localhost:3001/billing/webhook

# Cek signature secret
echo $STRIPE_WEBHOOK_SECRET  # Harus sama dengan output stripe listen
```

### Prisma generate error

```bash
# Hapus generated client dan regenerate
rm -rf node_modules/.prisma
npx prisma generate
```
