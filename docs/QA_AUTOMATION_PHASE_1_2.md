# QA Automation Test Design — Phase 1 & Phase 2

> **Project:** sarai-platform
> **Author:** QA Automation Team
> **Date:** 2026-06-17
> **Stack:** Jest + SuperTest (API/Backend NestJS), Prisma (DB), Playwright (Frontend E2E), k6 (Performance), OWASP ZAP (Security)

---

## Table of Contents

- [Phase 1 — Foundation & Core Infrastructure](#phase-1--foundation--core-infrastructure)
- [Phase 2 — Data Source Engine & Connectors](#phase-2--data-source-engine--connectors)

---

## Phase 1 — Foundation & Core Infrastructure

> Cakupan: Project Setup, Monorepo, Docker, CI/CD, DB Schema (41 tabel PostgreSQL + synced_data), Migrasi Prisma, Autentikasi (JWT, OAuth, 2FA), Manajemen Tim (RBAC), Core Middleware (Rate limiting, Redis), Airbyte Cloud Setup.

---

### TC-PH1-01: Validasi Register Email Unik

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-01 |
| **Tipe** | Integration API |
| **Kategori** | Authentication |

**BDD Gherkin:**

```gherkin
Feature: Authentication Register

Scenario: User tidak dapat register dengan email yang sudah terdaftar
  Given user dengan email "qa.user@sarai.test" sudah terdaftar
  When user melakukan register ulang dengan email yang sama
  Then API mengembalikan status 409
  And response berisi pesan email already exists
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-01: Register Email Unik', () => {
  const payload = {
    name: 'QA User',
    email: 'qa.user@sarai.test',
    password: 'SecurePass123!',
  };

  it('should reject duplicate email registration', async () => {
    // First registration should succeed
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect([201, 409]);

    // Second registration with same email should be rejected
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(409);

    expect(res.body.message).toContain('email');
  });
});
```

**Expected Result:**
- User pertama berhasil dibuat dengan status 201.
- Register kedua dengan email sama ditolak dengan status 409.
- Tidak ada duplikasi data user di PostgreSQL.

---

### TC-PH1-02: Validasi Login JWT Berhasil

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-02 |
| **Tipe** | Integration API |
| **Kategori** | Authentication |

**BDD Gherkin:**

```gherkin
Feature: JWT Authentication

Scenario: User login dengan kredensial valid
  Given user aktif sudah terdaftar
  When user login dengan email dan password valid
  Then API mengembalikan accessToken dan refreshToken
  And token dapat digunakan untuk mengakses endpoint protected
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-02: Login JWT Berhasil', () => {
  it('should login and access protected endpoint', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'qa.user@sarai.test',
        password: 'SecurePass123!',
      })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.refreshToken).toBeDefined();

    // Use the token to access a protected endpoint
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);
  });
});
```

**Expected Result:**
- Login sukses dengan status 200 dan mengembalikan `accessToken` serta `refreshToken`.
- JWT valid dapat mengakses endpoint protected `/auth/me`.

---

### TC-PH1-03: Validasi Protected API Menolak JWT Invalid

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-03 |
| **Tipe** | Security |
| **Kategori** | Authentication |

**BDD Gherkin:**

```gherkin
Feature: JWT Security

Scenario: User mengakses protected endpoint dengan token invalid
  Given user memiliki token JWT tidak valid
  When user mengakses endpoint protected
  Then API mengembalikan status 401
  And data protected tidak dikembalikan
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-03: Protected API Menolak JWT Invalid', () => {
  it('should reject invalid JWT token', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .expect(401);

    expect(res.body).not.toHaveProperty('user');
  });

  it('should reject request without Authorization header', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });
});
```

**Expected Result:**
- API mengembalikan status 401 Unauthorized.
- Tidak ada data user atau informasi sensitif yang terekspos.

---

### TC-PH1-04: Validasi OAuth Callback Membuat atau Menghubungkan Akun

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-04 |
| **Tipe** | Integration API |
| **Kategori** | Authentication |

**BDD Gherkin:**

```gherkin
Feature: OAuth Authentication

Scenario: User login menggunakan OAuth provider
  Given OAuth provider mengembalikan profile valid
  When callback OAuth diproses oleh backend
  Then sistem membuat user baru atau menghubungkan akun existing
  And sistem mengembalikan JWT session
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-04: OAuth Callback', () => {
  it('should create or link user from OAuth profile', async () => {
    const mockOAuthPayload = {
      provider: 'google',
      providerUserId: 'google-user-qa-001',
      email: 'oauth.qa@sarai.test',
      name: 'OAuth QA',
      avatarUrl: 'https://example.com/avatar.png',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/oauth/callback/mock')
      .send(mockOAuthPayload)
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(mockOAuthPayload.email);
    expect(res.body.user.oauthProvider).toBe('google');
  });

  it('should link OAuth to existing account if email matches', async () => {
    const mockOAuthPayload = {
      provider: 'google',
      providerUserId: 'google-user-qa-002',
      email: 'qa.user@sarai.test', // already registered
      name: 'OAuth QA Linked',
      avatarUrl: 'https://example.com/avatar2.png',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/oauth/callback/mock')
      .send(mockOAuthPayload)
      .expect(200);

    expect(res.body.user.oauthProvider).toBe('google');
  });
});
```

**Mock Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "usr_qa_001",
    "email": "oauth.qa@sarai.test",
    "name": "OAuth QA",
    "oauthProvider": "google"
  }
}
```

**Expected Result:**
- OAuth callback valid menghasilkan user baru atau menghubungkan akun existing.
- JWT dikembalikan untuk session.
- Tidak terjadi duplicate account untuk email yang sama.

---

### TC-PH1-05: Validasi 2FA OTP Login Flow

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-05 |
| **Tipe** | Integration API |
| **Kategori** | Authentication |

**BDD Gherkin:**

```gherkin
Feature: Two Factor Authentication

Scenario: User dengan 2FA aktif harus memasukkan OTP valid
  Given user memiliki 2FA aktif
  When user login menggunakan password valid
  Then sistem meminta verifikasi OTP
  When user mengirim OTP valid
  Then sistem mengembalikan JWT
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-05: 2FA OTP Login Flow', () => {
  it('should require OTP and complete login with valid code', async () => {
    // Step 1: Login with valid password triggers 2FA
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'twofa.user@sarai.test',
        password: 'SecurePass123!',
      })
      .expect(202);

    expect(loginRes.body.requires2FA).toBe(true);
    expect(loginRes.body.challengeId).toBeDefined();

    // Step 2: Verify with valid OTP
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/2fa/verify')
      .send({
        challengeId: loginRes.body.challengeId,
        otp: '123456',
      })
      .expect(200);

    expect(verifyRes.body.accessToken).toBeDefined();
  });

  it('should reject invalid OTP', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'twofa.user@sarai.test',
        password: 'SecurePass123!',
      })
      .expect(202);

    await request(app.getHttpServer())
      .post('/auth/2fa/verify')
      .send({
        challengeId: loginRes.body.challengeId,
        otp: '000000',
      })
      .expect(401);
  });
});
```

**Expected Result:**
- Login pertama tidak langsung mengembalikan JWT (status 202 + challengeId).
- OTP valid menghasilkan JWT (status 200).
- OTP invalid ditolak dengan status 401.

---

### TC-PH1-06: Validasi RBAC Team Member Tidak Bisa Akses Admin API

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-06 |
| **Tipe** | Security |
| **Kategori** | RBAC |

**BDD Gherkin:**

```gherkin
Feature: Team RBAC

Scenario: Member biasa mencoba mengakses endpoint admin team
  Given user memiliki role MEMBER dalam team
  When user mengakses endpoint admin team
  Then API mengembalikan status 403
  And perubahan data team tidak dilakukan
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';
import { getTokenForRole } from '../helpers/auth';

describe('TC-PH1-06: RBAC Member Restriction', () => {
  it('should reject member from admin-only team endpoint', async () => {
    const memberToken = await getTokenForRole('MEMBER');

    const res = await request(app.getHttpServer())
      .post('/teams/team-qa-001/invitations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        email: 'new.member@sarai.test',
        role: 'ADMIN',
      })
      .expect(403);

    expect(res.body.message).toContain('permission');
  });

  it('should reject member from deleting team', async () => {
    const memberToken = await getTokenForRole('MEMBER');

    await request(app.getHttpServer())
      .delete('/teams/team-qa-001')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });
});
```

**Expected Result:**
- Role MEMBER tidak dapat menjalankan aksi admin (invite, delete team).
- API mengembalikan 403 Forbidden.
- Tidak ada data yang diubah atau dihapus.

---

### TC-PH1-07: Validasi Admin Bisa Mengundang Member Team

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-07 |
| **Tipe** | Integration API |
| **Kategori** | Team Management |

**BDD Gherkin:**

```gherkin
Feature: Team Management

Scenario: Admin mengundang user baru ke team
  Given user memiliki role ADMIN dalam team
  When admin mengirim invitation ke email valid
  Then sistem membuat invitation
  And invitation memiliki status pending
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';
import { getTokenForRole } from '../helpers/auth';

describe('TC-PH1-07: Admin Invite Member', () => {
  it('should allow admin to invite team member', async () => {
    const adminToken = await getTokenForRole('ADMIN');

    const res = await request(app.getHttpServer())
      .post('/teams/team-qa-001/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'invitee@sarai.test',
        role: 'MEMBER',
      })
      .expect(201);

    expect(res.body.email).toBe('invitee@sarai.test');
    expect(res.body.status).toBe('PENDING');
  });
});
```

**Expected Result:**
- Invitation berhasil dibuat oleh ADMIN dengan status 201.
- Status invitation adalah PENDING.
- Email invitation masuk ke queue untuk dikirim.

---

### TC-PH1-08: Validasi Rate Limiting Login

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-08 |
| **Tipe** | Security |
| **Kategori** | Middleware |

**BDD Gherkin:**

```gherkin
Feature: Rate Limiting

Scenario: Client melakukan login gagal berulang kali
  Given rate limiting aktif pada endpoint login
  When client mengirim terlalu banyak request login invalid
  Then API mengembalikan status 429
  And request berikutnya diblokir sementara
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-08: Login Rate Limiting', () => {
  it('should return 429 after too many failed login attempts', async () => {
    const invalidPayload = {
      email: 'rate.limit@sarai.test',
      password: 'WrongPassword!',
    };

    const attempts = Array.from({ length: 12 }).map(() =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidPayload),
    );

    const responses = await Promise.all(attempts);
    const hasRateLimit = responses.some((res) => res.status === 429);

    expect(hasRateLimit).toBe(true);
  });
});
```

**Expected Result:**
- Setelah threshold terlampaui, API mengembalikan status 429 Too Many Requests.
- Redis rate limiter menyimpan dan mengelola counter request.
- Brute force login dapat dimitigasi.

---

### TC-PH1-09: Validasi Migrasi Prisma Membentuk Schema Core

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-09 |
| **Tipe** | Integration API |
| **Kategori** | Database |

**BDD Gherkin:**

```gherkin
Feature: Database Migration

Scenario: Database schema berhasil dibuat melalui Prisma migration
  Given PostgreSQL database kosong
  When Prisma migration dijalankan
  Then semua tabel core tersedia
  And tabel synced_data tersedia
  And constraint penting seperti unique email aktif
```

**Automation Script (Jest + Prisma):**

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('TC-PH1-09: Prisma Migration Schema', () => {
  it('should have required core tables', async () => {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    const tableNames = tables.map((t) => t.table_name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('teams');
    expect(tableNames).toContain('team_members');
    expect(tableNames).toContain('synced_data');
    expect(tableNames).toContain('connections');
    expect(tableNames).toContain('synced_data');
  });

  it('should enforce unique email constraint', async () => {
    await prisma.user.create({
      data: {
        email: 'unique.test@sarai.test',
        name: 'Unique Test',
        passwordHash: 'hash',
      },
    }).catch(() => {});

    await expect(
      prisma.user.create({
        data: {
          email: 'unique.test@sarai.test',
          name: 'Duplicate Test',
          passwordHash: 'hash',
        },
      }),
    ).rejects.toThrow();
  });
});
```

**Expected Result:**
- Migration berhasil tanpa error.
- Semua tabel core dan `synced_data` tersedia.
- Constraint unique email aktif dan mencegah duplikasi.

---

### TC-PH1-10: Validasi Airbyte Cloud Config Health Check

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-10 |
| **Tipe** | Integration API |
| **Kategori** | Integration |

**BDD Gherkin:**

```gherkin
Feature: Airbyte Cloud Setup

Scenario: Backend dapat memvalidasi konfigurasi Airbyte Cloud
  Given environment variable Airbyte sudah dikonfigurasi
  When sistem menjalankan Airbyte health check
  Then backend menerima response sukses dari Airbyte
  And workspace ID tervalidasi
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-10: Airbyte Health Check', () => {
  it('should validate Airbyte Cloud configuration', async () => {
    const res = await request(app.getHttpServer())
      .get('/integrations/airbyte/health')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(res.body.status).toBe('healthy');
    expect(res.body.workspaceId).toBeDefined();
    expect(res.body.apiReachable).toBe(true);
  });
});
```

**Mock Response:**

```json
{
  "workspaceId": "airbyte-workspace-qa",
  "status": "healthy",
  "apiReachable": true
}
```

**Expected Result:**
- Backend dapat membaca konfigurasi Airbyte.
- Health check mengembalikan status `healthy`.
- Jika credential invalid, API harus mengembalikan 502/503 tanpa membocorkan secret.

---

## Phase 2 — Data Source Engine & Connectors

> Cakupan: Airbyte API Wrapper (NestJS), Connection Management API, OAuth Flow via Airbyte, Source Catalog Mapping (600+ sources), Sync Config (Full/Incremental), Sync Monitoring, Trial System (14 hari).

---

### TC-PH2-01: Validasi Airbyte API Wrapper Mengambil Workspace

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-01 |
| **Tipe** | Integration API |
| **Kategori** | Airbyte Integration |

**BDD Gherkin:**

```gherkin
Feature: Airbyte API Wrapper

Scenario: Backend mengambil informasi workspace dari Airbyte
  Given Airbyte credential valid tersedia
  When client meminta detail workspace Airbyte
  Then backend memanggil Airbyte API wrapper
  And response workspace dikembalikan dalam format internal
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-01: Airbyte Workspace Wrapper', () => {
  it('should return normalized Airbyte workspace detail', async () => {
    const res = await request(app.getHttpServer())
      .get('/airbyte/workspace')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      status: 'CONNECTED',
    });
  });
});
```

**Expected Result:**
- Backend menormalisasi response Airbyte.
- Tidak ada data sensitif (API key) yang terekspos di response.
- Error Airbyte dipetakan ke HTTP status internal yang sesuai.

---

### TC-PH2-02: Validasi Membuat Connection Baru

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-02 |
| **Tipe** | Integration API |
| **Kategori** | Connection Management |

**BDD Gherkin:**

```gherkin
Feature: Connection Management

Scenario: User membuat connection data source baru
  Given user memiliki role ADMIN atau OWNER
  And source dan destination Airbyte valid
  When user membuat connection baru
  Then connection tersimpan di database
  And connection dibuat di Airbyte
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-02: Create Connection', () => {
  it('should create connection in Sarai and Airbyte', async () => {
    const payload = {
      sourceId: 'src_airbyte_google_ads',
      destinationId: 'dst_sarai_postgres',
      name: 'Google Ads QA Sync',
      syncMode: 'incremental',
      schedule: {
        type: 'cron',
        cronExpression: '0 */6 * * *',
      },
    };

    const res = await request(app.getHttpServer())
      .post('/connections')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send(payload)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.airbyteConnectionId).toBeDefined();
    expect(res.body.syncMode).toBe('incremental');
  });
});
```

**Expected Result:**
- Connection dibuat di Airbyte dan database lokal.
- Response mengandung `airbyteConnectionId`.
- Status awal connection aktif atau pending sesuai desain.

---

### TC-PH2-03: Validasi Role MEMBER Tidak Bisa Membuat Connection

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-03 |
| **Tipe** | Security |
| **Kategori** | RBAC |

**BDD Gherkin:**

```gherkin
Feature: Connection RBAC

Scenario: Member biasa mencoba membuat connection
  Given user memiliki role MEMBER
  When user mengirim request create connection
  Then API mengembalikan status 403
  And connection tidak dibuat
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-03: Connection RBAC', () => {
  it('should reject member from creating connection', async () => {
    const res = await request(app.getHttpServer())
      .post('/connections')
      .set('Authorization', 'Bearer mock-member-jwt')
      .send({
        sourceId: 'src_airbyte_stripe',
        destinationId: 'dst_sarai_postgres',
        name: 'Stripe QA Sync',
        syncMode: 'full_refresh',
      })
      .expect(403);

    expect(res.body.message).toContain('permission');
  });
});
```

**Expected Result:**
- MEMBER menerima 403 Forbidden.
- Tidak ada connection baru di database.
- Tidak ada panggilan create ke Airbyte API.

---

### TC-PH2-04: Validasi OAuth Flow via Airbyte

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-04 |
| **Tipe** | Integration API |
| **Kategori** | OAuth |

**BDD Gherkin:**

```gherkin
Feature: Airbyte OAuth Flow

Scenario: User memulai OAuth authorization untuk source connector
  Given connector mendukung OAuth
  When user meminta OAuth authorization URL
  Then backend mengembalikan authorization URL dari Airbyte
  And state token tersimpan untuk validasi callback
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-04: Airbyte OAuth Flow', () => {
  it('should generate OAuth authorization URL', async () => {
    const res = await request(app.getHttpServer())
      .post('/airbyte/oauth/authorize')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        sourceDefinitionId: 'google-sheets-source-def',
        redirectUrl: 'https://app.sarai.test/oauth/callback',
      })
      .expect(200);

    expect(res.body.authorizationUrl).toContain('https://');
    expect(res.body.state).toBeDefined();
  });

  it('should reject non-allowlisted redirect URL', async () => {
    await request(app.getHttpServer())
      .post('/airbyte/oauth/authorize')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        sourceDefinitionId: 'google-sheets-source-def',
        redirectUrl: 'https://evil.com/steal',
      })
      .expect(400);
  });
});
```

**Expected Result:**
- Authorization URL valid dikembalikan dari Airbyte.
- State token dibuat untuk mencegah CSRF.
- Redirect URL harus tervalidasi terhadap allowlist.

---

### TC-PH2-05: Validasi Source Catalog Mapping 600+ Sources

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-05 |
| **Tipe** | Integration API |
| **Kategori** | Catalog |

**BDD Gherkin:**

```gherkin
Feature: Source Catalog

Scenario: User membuka katalog source connector
  Given Airbyte source catalog tersedia
  When user meminta daftar source
  Then sistem mengembalikan daftar source yang sudah dimapping
  And jumlah source minimal 600
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-05: Source Catalog Mapping', () => {
  it('should return mapped source catalog with at least 600 sources', async () => {
    const res = await request(app.getHttpServer())
      .get('/sources/catalog')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(res.body.items.length).toBeGreaterThanOrEqual(600);

    const firstSource = res.body.items[0];
    expect(firstSource).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      category: expect.any(String),
      supportsOAuth: expect.any(Boolean),
    });
  });

  it('should support search/filter on source catalog', async () => {
    const res = await request(app.getHttpServer())
      .get('/sources/catalog?search=stripe')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(
      res.body.items.some((s: any) => s.name.toLowerCase().includes('stripe')),
    ).toBe(true);
  });
});
```

**Expected Result:**
- Minimal 600 source connector tersedia.
- Setiap source memiliki mapping internal: id, name, category, icon, auth type.
- Filter/search berfungsi dengan benar.

---

### TC-PH2-06: Validasi Sync Config Full Refresh

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-06 |
| **Tipe** | Integration API |
| **Kategori** | Sync Configuration |

**BDD Gherkin:**

```gherkin
Feature: Sync Configuration

Scenario: User mengatur sync mode full refresh
  Given connection valid sudah tersedia
  When user memperbarui sync config menjadi full refresh
  Then config tersimpan
  And request update dikirim ke Airbyte
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-06: Full Refresh Sync Config', () => {
  it('should update connection sync mode to full refresh', async () => {
    const res = await request(app.getHttpServer())
      .patch('/connections/conn_qa_001/sync-config')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        syncMode: 'full_refresh',
        streams: [
          { name: 'campaigns', selected: true, cursorField: null },
        ],
      })
      .expect(200);

    expect(res.body.syncMode).toBe('full_refresh');
    expect(res.body.streams[0].selected).toBe(true);
  });
});
```

**Expected Result:**
- Sync config tersimpan dengan benar.
- Airbyte connection juga ikut diperbarui.
- Full refresh tidak membutuhkan cursor field.

---

### TC-PH2-07: Validasi Sync Config Incremental Wajib Cursor Field

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-07 |
| **Tipe** | Integration API |
| **Kategori** | Validation |

**BDD Gherkin:**

```gherkin
Feature: Incremental Sync Validation

Scenario: User mengatur incremental sync tanpa cursor field
  Given connection valid sudah tersedia
  When user mengirim config incremental tanpa cursor field
  Then API mengembalikan status 400
  And config tidak disimpan
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-07: Incremental Cursor Validation', () => {
  it('should reject incremental sync without cursor field', async () => {
    const res = await request(app.getHttpServer())
      .patch('/connections/conn_qa_001/sync-config')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        syncMode: 'incremental',
        streams: [
          { name: 'orders', selected: true, cursorField: null },
        ],
      })
      .expect(400);

    expect(res.body.message).toContain('cursor');
  });

  it('should accept incremental sync with valid cursor field', async () => {
    const res = await request(app.getHttpServer())
      .patch('/connections/conn_qa_001/sync-config')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        syncMode: 'incremental',
        streams: [
          { name: 'orders', selected: true, cursorField: 'updated_at' },
        ],
      })
      .expect(200);

    expect(res.body.syncMode).toBe('incremental');
  });
});
```

**Expected Result:**
- Config incremental tanpa cursor field ditolak (400).
- Config incremental dengan cursor valid diterima (200).
- Tidak ada update ke Airbyte untuk config invalid.

---

### TC-PH2-08: Validasi Sync Monitoring Menampilkan Status Job

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-08 |
| **Tipe** | Integration API |
| **Kategori** | Monitoring |

**BDD Gherkin:**

```gherkin
Feature: Sync Monitoring

Scenario: User melihat status sync connection
  Given Airbyte job sedang berjalan
  When user membuka sync monitoring
  Then backend mengembalikan status job terkini
  And progress sync ditampilkan
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-08: Sync Monitoring', () => {
  it('should return current Airbyte sync job status', async () => {
    const res = await request(app.getHttpServer())
      .get('/connections/conn_qa_001/sync-status')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(res.body).toMatchObject({
      connectionId: 'conn_qa_001',
      status: expect.stringMatching(/running|succeeded|failed|cancelled/),
      recordsSynced: expect.any(Number),
    });
  });

  it('should return sync history for connection', async () => {
    const res = await request(app.getHttpServer())
      .get('/connections/conn_qa_001/sync-status/history')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(Array.isArray(res.body.jobs)).toBe(true);
  });
});
```

**Expected Result:**
- Status sync terbaru dikembalikan dengan benar.
- Jumlah record synced tersedia.
- Error Airbyte, jika ada, ditampilkan secara aman tanpa secret.

---

### TC-PH2-09: Validasi Trial System 14 Hari

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-09 |
| **Tipe** | Integration API |
| **Kategori** | Business Logic |

**BDD Gherkin:**

```gherkin
Feature: Trial System

Scenario: Workspace baru mendapatkan trial 14 hari
  Given user membuat workspace baru
  When workspace berhasil dibuat
  Then sistem menetapkan trial selama 14 hari
  And fitur trial dapat digunakan sampai tanggal expiry
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-09: Trial System', () => {
  it('should create 14-day trial for new workspace', async () => {
    const res = await request(app.getHttpServer())
      .post('/workspaces')
      .set('Authorization', 'Bearer mock-user-jwt')
      .send({ name: 'QA Trial Workspace' })
      .expect(201);

    const createdAt = new Date(res.body.createdAt).getTime();
    const trialEndsAt = new Date(res.body.trialEndsAt).getTime();
    const diffDays = Math.round((trialEndsAt - createdAt) / 86_400_000);

    expect(diffDays).toBe(14);
    expect(res.body.planStatus).toBe('TRIAL');
  });

  it('should return trial remaining days', async () => {
    const res = await request(app.getHttpServer())
      .get('/workspaces/current')
      .set('Authorization', 'Bearer mock-user-jwt')
      .expect(200);

    expect(res.body.trialEndsAt).toBeDefined();
    expect(res.body.trialDaysRemaining).toBeGreaterThanOrEqual(0);
  });
});
```

**Expected Result:**
- Workspace baru memiliki `planStatus` = `TRIAL`.
- Trial expiry tepat 14 hari dari tanggal pembuatan.
- `trialDaysRemaining` dikalkulasi dengan benar.

---

### TC-PH2-10: Validasi Trial Expired Membatasi Create Connection

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-10 |
| **Tipe** | Integration API |
| **Kategori** | Business Logic |

**BDD Gherkin:**

```gherkin
Feature: Trial Expiration

Scenario: User dengan trial expired mencoba membuat connection
  Given workspace trial sudah expired
  When user membuat connection baru
  Then API mengembalikan status 402
  And user diarahkan untuk upgrade subscription
```

**Automation Script (Jest + SuperTest):**

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH2-10: Trial Expired Restriction', () => {
  it('should block connection creation after trial expired', async () => {
    const res = await request(app.getHttpServer())
      .post('/connections')
      .set('Authorization', 'Bearer mock-expired-trial-jwt')
      .send({
        sourceId: 'src_airbyte_mysql',
        destinationId: 'dst_sarai_postgres',
        name: 'Expired Trial Connection',
        syncMode: 'full_refresh',
      })
      .expect(402);

    expect(res.body.code).toBe('TRIAL_EXPIRED');
    expect(res.body.upgradeRequired).toBe(true);
  });

  it('should still allow read operations after trial expired', async () => {
    await request(app.getHttpServer())
      .get('/connections')
      .set('Authorization', 'Bearer mock-expired-trial-jwt')
      .expect(200);
  });
});
```

**Expected Result:**
- Workspace expired tidak dapat membuat connection baru.
- API mengembalikan 402 Payment Required.
- Response menyertakan `code: TRIAL_EXPIRED` dan `upgradeRequired: true`.
- Operasi baca (read) masih diizinkan.

---

## Summary Table

| Phase | TC ID | Title | Type |
|-------|-------|-------|------|
| 1 | TC-PH1-01 | Register Email Unik | Integration API |
| 1 | TC-PH1-02 | Login JWT Berhasil | Integration API |
| 1 | TC-PH1-03 | JWT Invalid Ditolak | Security |
| 1 | TC-PH1-04 | OAuth Callback | Integration API |
| 1 | TC-PH1-05 | 2FA OTP Login Flow | Integration API |
| 1 | TC-PH1-06 | RBAC Member Restriction | Security |
| 1 | TC-PH1-07 | Admin Invite Member | Integration API |
| 1 | TC-PH1-08 | Login Rate Limiting | Security |
| 1 | TC-PH1-09 | Prisma Migration Schema | Integration API |
| 1 | TC-PH1-10 | Airbyte Health Check | Integration API |
| 2 | TC-PH2-01 | Airbyte Workspace Wrapper | Integration API |
| 2 | TC-PH2-02 | Create Connection | Integration API |
| 2 | TC-PH2-03 | Connection RBAC | Security |
| 2 | TC-PH2-04 | Airbyte OAuth Flow | Integration API |
| 2 | TC-PH2-05 | Source Catalog Mapping | Integration API |
| 2 | TC-PH2-06 | Full Refresh Sync Config | Integration API |
| 2 | TC-PH2-07 | Incremental Cursor Validation | Integration API |
| 2 | TC-PH2-08 | Sync Monitoring | Integration API |
| 2 | TC-PH2-09 | Trial System 14 Hari | Integration API |
| 2 | TC-PH2-10 | Trial Expired Restriction | Integration API |

---

> **Catatan:** Lanjutkan ke Phase 3–8 dengan perintah "Lanjutkan". Setiap fase akan menambahkan 10 skenario pengujian dengan format serupa.