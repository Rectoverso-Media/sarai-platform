# QA Automation Test Cases — Phase 1 & Phase 2

> **Project:** sarai-platform
> **Author:** Senior QA Automation Engineer
> **Date:** 2026-06-17
> **Stack:** Jest + SuperTest (API/Backend), Playwright (Frontend E2E), Prisma (DB Validation)

---

# PHASE 1 — Foundation & Core Infrastructure

---

## TC-PH1-01: Validasi Register Email Unik

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-01 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Authentication |
| **Prioritas** | Critical |

### BDD Gherkin

```gherkin
Feature: Authentication Register

  Scenario: User tidak dapat register dengan email yang sudah terdaftar
    Given user dengan email "qa.user@sarai.test" sudah terdaftar
    When user melakukan register ulang dengan email yang sama
    Then API mengembalikan status 409
    And response berisi pesan email already exists
```

### Automation Script — Backend (Jest + SuperTest)

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

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH1-01: Register Email Unik — UI E2E', () => {
  test('should show error when registering with existing email', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="register-name"]', 'QA User');
    await page.fill('[data-testid="register-email"]', 'qa.user@sarai.test');
    await page.fill('[data-testid="register-password"]', 'SecurePass123!');
    await page.fill('[data-testid="register-confirm-password"]', 'SecurePass123!');

    // Submit first registration
    await page.click('[data-testid="register-submit"]');
    await expect(page).toHaveURL(/\/(dashboard|login)/);

    // Go back to register and try again
    await page.goto('/register');
    await page.fill('[data-testid="register-name"]', 'QA User Duplicate');
    await page.fill('[data-testid="register-email"]', 'qa.user@sarai.test');
    await page.fill('[data-testid="register-password"]', 'SecurePass123!');
    await page.fill('[data-testid="register-confirm-password"]', 'SecurePass123!');
    await page.click('[data-testid="register-submit"]');

    // Assert error message appears
    await expect(page.locator('[data-testid="register-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-error"]')).toContainText(/email.*exists|already.*registered/i);
  });
});
```

### Expected Result
- User pertama berhasil dibuat dengan status 201.
- Register kedua dengan email sama ditolak dengan status 409.
- Tidak ada duplikasi data user di PostgreSQL.
- Frontend menampilkan error toast/banner yang sesuai.

---

## TC-PH1-02: Validasi Login JWT Berhasil

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-02 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Authentication |
| **Prioritas** | Critical |

### BDD Gherkin

```gherkin
Feature: JWT Authentication

  Scenario: User login dengan kredensial valid
    Given user aktif sudah terdaftar
    When user login dengan email dan password valid
    Then API mengembalikan accessToken dan refreshToken
    And token dapat digunakan untuk mengakses endpoint protected
```

### Automation Script — Backend (Jest + SuperTest)

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

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH1-02: Login JWT Berhasil — UI E2E', () => {
  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('[data-testid="login-email"]', 'qa.user@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');

    // Submit login
    await page.click('[data-testid="login-submit"]');

    // Assert redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Assert user is authenticated — check for user menu or avatar
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('QA User');
  });

  test('should persist JWT in browser and allow protected navigation', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'qa.user@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to a protected route
    await page.goto('/settings/profile');
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();

    // Verify JWT token is stored
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });
});
```

### Expected Result
- Login sukses dengan status 200 dan mengembalikan `accessToken` serta `refreshToken`.
- JWT valid dapat mengakses endpoint protected `/auth/me`.
- Frontend redirect ke dashboard setelah login.
- JWT tersimpan di localStorage/cookie dan tetap valid navigasi ke halaman protected.

---

## TC-PH1-03: Validasi Protected API Menolak JWT Invalid

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-03 |
| **Tipe** | Security + E2E UI |
| **Kategori** | Authentication |
| **Prioritas** | Critical |

### BDD Gherkin

```gherkin
Feature: JWT Security

  Scenario: User mengakses protected endpoint dengan token invalid
    Given user memiliki token JWT tidak valid
    When user mengakses endpoint protected
    Then API mengembalikan status 401
    And data protected tidak dikembalikan
```

### Automation Script — Backend (Jest + SuperTest)

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

  it('should reject expired JWT token', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(res.body.message).toBeDefined();
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH1-03: Protected API Menolak JWT Invalid — UI E2E', () => {
  test('should redirect to login when JWT is invalid in localStorage', async ({ page }) => {
    // Set invalid token in localStorage before navigating
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'invalid.jwt.token');
    });

    // Try to access protected route
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show unauthorized state and clear stale session', async ({ page }) => {
    // Manipulate stored token to simulate expired session
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'expired.invalid.token');
      localStorage.setItem('refreshToken', 'expired.refresh.token');
    });

    await page.goto('/dashboard');

    // User should be redirected to login with a session expired notice
    await expect(page).toHaveURL(/\/login/);
    const storedToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(storedToken).toBeNull(); // Token should be cleared
  });
});
```

### Expected Result
- API mengembalikan status 401 Unauthorized untuk token invalid/missing/expired.
- Tidak ada data user atau informasi sensitif yang terekspos.
- Frontend redirect ke halaman login dan membersihkan token dari storage.

---

## TC-PH1-04: Validasi OAuth Callback Membuat atau Menghubungkan Akun

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-04 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Authentication |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: OAuth Authentication

  Scenario: User login menggunakan OAuth provider
    Given OAuth provider mengembalikan profile valid
    When callback OAuth diproses oleh backend
    Then sistem membuat user baru atau menghubungkan akun existing
    And sistem mengembalikan JWT session
```

### Automation Script — Backend (Jest + SuperTest)

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-04: OAuth Callback', () => {
  it('should create new user from OAuth profile', async () => {
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

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH1-04: OAuth Login — UI E2E', () => {
  test('should redirect to OAuth provider when clicking Google login', async ({ page }) => {
    await page.goto('/login');

    // Click Google OAuth button
    const googleBtn = page.locator('[data-testid="login-google"]');
    await expect(googleBtn).toBeVisible();

    // Intercept OAuth redirect
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      googleBtn.click(),
    ]);

    // If using redirect (not popup):
    const currentUrl = page.url();
    // Should navigate to Google OAuth or show OAuth flow
    expect(
      currentUrl.includes('accounts.google.com') ||
      currentUrl.includes('/auth/oauth') ||
      popup !== null
    ).toBe(true);
  });

  test('should complete OAuth flow with mock provider in dev mode', async ({ page }) => {
    // In dev/test environment, use mock OAuth endpoint
    await page.goto('/login');

    // Click mock OAuth login (if dev mode has a mock button)
    const mockOAuthBtn = page.locator('[data-testid="login-mock-oauth"]');
    if (await mockOAuthBtn.isVisible()) {
      await mockOAuthBtn.click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    }
  });
});
```

### Expected Result
- OAuth callback valid menghasilkan user baru atau menghubungkan akun existing.
- JWT dikembalikan untuk session.
- Tidak terjadi duplicate account untuk email yang sama.
- Frontend menampilkan button OAuth dan menangani redirect dengan benar.

---

## TC-PH1-05: Validasi 2FA OTP Login Flow

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-05 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Authentication |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Two Factor Authentication

  Scenario: User dengan 2FA aktif harus memasukkan OTP valid
    Given user memiliki 2FA aktif
    When user login menggunakan password valid
    Then sistem meminta verifikasi OTP
    When user mengirim OTP valid
    Then sistem mengembalikan JWT
```

### Automation Script — Backend (Jest + SuperTest)

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

    const res = await request(app.getHttpServer())
      .post('/auth/2fa/verify')
      .send({
        challengeId: loginRes.body.challengeId,
        otp: '000000',
      })
      .expect(401);

    expect(res.body.message).toBeDefined();
  });

  it('should lock after too many failed OTP attempts', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'twofa.user@sarai.test',
        password: 'SecurePass123!',
      })
      .expect(202);

    // Try 5 wrong OTPs
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/2fa/verify')
        .send({
          challengeId: loginRes.body.challengeId,
          otp: '000000',
        })
        .expect(401);
    }

    // Next attempt should be locked out
    const lockedRes = await request(app.getHttpServer())
      .post('/auth/2fa/verify')
      .send({
        challengeId: loginRes.body.challengeId,
        otp: '123456',
      })
      .expect(423);

    expect(lockedRes.body.message).toContain('locked');
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH1-05: 2FA OTP Login Flow — UI E2E', () => {
  test('should show 2FA input after valid password and complete login', async ({ page }) => {
    await page.goto('/login');

    // Step 1: Fill and submit login form
    await page.fill('[data-testid="login-email"]', 'twofa.user@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');

    // Step 2: Assert 2FA verification screen appears
    await expect(page.locator('[data-testid="2fa-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="2fa-input"]')).toBeVisible();

    // Step 3: Enter OTP code
    await page.fill('[data-testid="2fa-input"]', '123456');
    await page.click('[data-testid="2fa-submit"]');

    // Step 4: Assert successful login
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error message for invalid OTP', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="login-email"]', 'twofa.user@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');

    await expect(page.locator('[data-testid="2fa-form"]')).toBeVisible();

    await page.fill('[data-testid="2fa-input"]', '000000');
    await page.click('[data-testid="2fa-submit"]');

    // Assert error message
    await expect(page.locator('[data-testid="2fa-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="2fa-error"]')).toContainText(/invalid|incorrect/i);
  });
});
```

### Expected Result
- Login pertama tidak langsung mengembalikan JWT (status 202 + challengeId).
- OTP valid menghasilkan JWT (status 200).
- OTP invalid ditolak dengan status 401.
- Frontend menampilkan form OTP setelah login, dan menampilkan error untuk OTP salah.

---

## TC-PH1-06: Validasi RBAC Team Member Tidak Bisa Akses Admin API

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-06 |
| **Tipe** | Security + E2E UI |
| **Kategori** | RBAC |
| **Prioritas** | Critical |

### BDD Gherkin

```gherkin
Feature: Team RBAC

  Scenario: Member biasa mencoba mengakses endpoint admin team
    Given user memiliki role MEMBER dalam team
    When user mengakses endpoint admin team
    Then API mengembalikan status 403
    And perubahan data team tidak dilakukan
```

### Automation Script — Backend (Jest + SuperTest)

```ts
import request from 'supertest';
import { app } from '../setup-e2e';
import { getTokenForRole } from '../helpers/auth';

describe('TC-PH1-06: RBAC Member Restriction', () => {
  it('should reject member from inviting team member', async () => {
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

  it('should reject member from updating team settings', async () => {
    const memberToken = await getTokenForRole('MEMBER');

    await request(app.getHttpServer())
      .patch('/teams/team-qa-001')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacked Team' })
      .expect(403);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH1-06: RBAC Member Restriction — UI E2E', () => {
  test('should hide admin-only actions for MEMBER role', async ({ page }) => {
    // Login as member
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'member@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to team settings
    await page.goto('/teams/team-qa-001/settings');

    // Assert invite button is NOT visible for MEMBER
    await expect(page.locator('[data-testid="invite-member-btn"]')).not.toBeVisible();

    // Assert delete team button is NOT visible
    await expect(page.locator('[data-testid="delete-team-btn"]')).not.toBeVisible();

    // Assert member sees read-only or limited view
    await expect(page.locator('[data-testid="team-info-section"]')).toBeVisible();
  });

  test('should show 403 error when member navigates to admin URL directly', async ({ page }) => {
    // Login as member
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'member@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Try to navigate directly to team invite page
    await page.goto('/teams/team-qa-001/invitations/new');

    // Should show access denied or redirect
    const errorOrRedirect =
      await page.locator('[data-testid="access-denied"]').isVisible() ||
      page.url().includes('/dashboard');
    expect(errorOrRedirect).toBe(true);
  });
});
```

### Expected Result
- Role MEMBER tidak dapat menjalankan aksi admin (invite, delete team).
- API mengembalikan 403 Forbidden.
- Tidak ada data yang diubah atau dihapus.
- Frontend menyembunyikan/menonaktifkan tombol admin untuk role MEMBER.

---

## TC-PH1-07: Validasi Admin Bisa Mengundang Member Team

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-07 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Team Management |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Team Management

  Scenario: Admin mengundang user baru ke team
    Given user memiliki role ADMIN dalam team
    When admin mengirim invitation ke email valid
    Then sistem membuat invitation
    And invitation memiliki status pending
```

### Automation Script — Backend (Jest + SuperTest)

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

  it('should not allow duplicate invitation to same email', async () => {
    const adminToken = await getTokenForRole('ADMIN');

    // First invite
    await request(app.getHttpServer())
      .post('/teams/team-qa-001/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'duplicate.invite@sarai.test', role: 'MEMBER' })
      .expect(201);

    // Duplicate invite
    await request(app.getHttpServer())
      .post('/teams/team-qa-001/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'duplicate.invite@sarai.test', role: 'MEMBER' })
      .expect([409, 400]);
  });

  it('should allow owner to invite admin', async () => {
    const ownerToken = await getTokenForRole('OWNER');

    const res = await request(app.getHttpServer())
      .post('/teams/team-qa-001/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'new.admin@sarai.test', role: 'ADMIN' })
      .expect(201);

    expect(res.body.role).toBe('ADMIN');
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH1-07: Admin Invite Member — UI E2E', () => {
  test('should allow admin to invite a member via the invite form', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to team members page
    await page.goto('/teams/team-qa-001/members');

    // Click invite button
    await page.click('[data-testid="invite-member-btn"]');
    await expect(page.locator('[data-testid="invite-form"]')).toBeVisible();

    // Fill invitation form
    await page.fill('[data-testid="invite-email"]', 'invitee@sarai.test');
    await page.selectOption('[data-testid="invite-role"]', 'MEMBER');

    // Submit invitation
    await page.click('[data-testid="invite-submit"]');

    // Assert success toast/message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/invitation.*sent|invited/i);

    // Assert new invitation appears in the list
    await expect(page.locator('text=invitee@sarai.test')).toBeVisible();
    await expect(page.locator('[data-testid="invitation-status-PENDING"]')).toBeVisible();
  });
});
```

### Expected Result
- Invitation berhasil dibuat oleh ADMIN dengan status 201.
- Status invitation adalah PENDING.
- Email invitation masuk ke queue untuk dikirim.
- Frontend menampilkan form invite, menampilkan toast sukses, dan memperbarui daftar invitation.

---

## TC-PH1-08: Validasi Rate Limiting Login

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-08 |
| **Tipe** | Security |
| **Kategori** | Middleware |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Rate Limiting

  Scenario: Client melakukan login gagal berulang kali
    Given rate limiting aktif pada endpoint login
    When client mengirim terlalu banyak request login invalid
    Then API mengembalikan status 429
    And request berikutnya diblokir sementara
```

### Automation Script — Backend (Jest + SuperTest)

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
    const rateLimitedResponses = responses.filter((res) => res.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Check rate limit headers
    const rateLimitedRes = rateLimitedResponses[0];
    expect(rateLimitedRes.headers['retry-after']).toBeDefined();
  });

  it('should include Retry-After header in 429 response', async () => {
    const invalidPayload = {
      email: 'rate.limit2@sarai.test',
      password: 'WrongPassword!',
    };

    // Exhaust rate limit
    const attempts = Array.from({ length: 15 }).map(() =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidPayload),
    );

    await Promise.all(attempts);

    // Next request should be rate limited with Retry-After
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(invalidPayload);

    if (res.status === 429) {
      expect(res.headers['retry-after']).toBeDefined();
      expect(res.body.message).toContain('rate limit');
    }
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH1-08: Login Rate Limiting — UI E2E', () => {
  test('should display rate limit message after multiple failed attempts', async ({ page }) => {
    await page.goto('/login');

    // Perform multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="login-email"]', 'rate.limit@sarai.test');
      await page.fill('[data-testid="login-password"]', 'WrongPassword!');
      await page.click('[data-testid="login-submit"]');
      await page.waitForTimeout(500); // Small delay between attempts
    }

    // Assert rate limit message or disabled form
    const isRateLimited =
      await page.locator('[data-testid="rate-limit-message"]').isVisible() ||
      await page.locator('[data-testid="login-submit"]').isDisabled();

    expect(isRateLimited).toBe(true);
  });
});
```

### Expected Result
- Setelah threshold terlampaui, API mengembalikan status 429 Too Many Requests.
- Redis rate limiter menyimpan dan mengelola counter request.
- Brute force login dapat dimitigasi.
- Frontend menampilkan pesan rate limit atau menonaktifkan form login.

---

## TC-PH1-09: Validasi Migrasi Prisma Membentuk Schema Core

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-09 |
| **Tipe** | Integration API |
| **Kategori** | Database |
| **Prioritas** | Critical |

### BDD Gherkin

```gherkin
Feature: Database Migration

  Scenario: Database schema berhasil dibuat melalui Prisma migration
    Given PostgreSQL database kosong
    When Prisma migration dijalankan
    Then semua tabel core tersedia
    And tabel synced_data tersedia
    And constraint penting seperti unique email aktif
```

### Automation Script — Backend (Jest + Prisma)

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('TC-PH1-09: Prisma Migration Schema', () => {
  const requiredTables = [
    'users',
    'teams',
    'team_members',
    'connections',
    'synced_data',
    'invitations',
    'workspaces',
    'data_sources',
    'sync_jobs',
    'api_keys',
  ];

  it('should have all required core tables', async () => {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    const tableNames = tables.map((t) => t.table_name);

    for (const table of requiredTables) {
      expect(tableNames).toContain(table);
    }
  });

  it('should enforce unique email constraint on users table', async () => {
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

  it('should have correct column types for critical fields', async () => {
    const columns = await prisma.$queryRaw<Array<{
      column_name: string;
      data_type: string;
      table_name: string;
    }>>`
      SELECT column_name, data_type, table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'users'
    `;

    const emailCol = columns.find((c) => c.column_name === 'email');
    expect(emailCol).toBeDefined();

    const idCol = columns.find((c) => c.column_name === 'id');
    expect(idCol).toBeDefined();
  });

  it('should have foreign key constraints for team_members', async () => {
    const fKeys = await prisma.$queryRaw<Array<{
      constraint_name: string;
      table_name: string;
    }>>`
      SELECT tc.constraint_name, tc.table_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'team_members'
      AND tc.table_schema = 'public'
    `;

    expect(fKeys.length).toBeGreaterThan(0);
  });
});
```

### Expected Result
- Migration berhasil tanpa error.
- Semua tabel core dan `synced_data` tersedia.
- Constraint unique email aktif dan mencegah duplikasi.
- Foreign key constraints pada relasi team_members valid.

---

## TC-PH1-10: Validasi Airbyte Cloud Config Health Check

| Item | Detail |
|------|--------|
| **ID** | TC-PH1-10 |
| **Tipe** | Integration API |
| **Kategori** | Integration |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Airbyte Cloud Setup

  Scenario: Backend dapat memvalidasi konfigurasi Airbyte Cloud
    Given environment variable Airbyte sudah dikonfigurasi
    When sistem menjalankan Airbyte health check
    Then backend menerima response sukses dari Airbyte
    And workspace ID tervalidasi
```

### Automation Script — Backend (Jest + SuperTest)

```ts
import request from 'supertest';
import { app } from '../setup-e2e';

describe('TC-PH1-10: Airbyte Health Check', () => {
  it('should validate Airbyte Cloud configuration and return healthy status', async () => {
    const res = await request(app.getHttpServer())
      .get('/integrations/airbyte/health')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(res.body.status).toBe('healthy');
    expect(res.body.workspaceId).toBeDefined();
    expect(res.body.apiReachable).toBe(true);
  });

  it('should not expose API key in health check response', async () => {
    const res = await request(app.getHttpServer())
      .get('/integrations/airbyte/health')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    const responseString = JSON.stringify(res.body);
    expect(responseString).not.toContain('api_key');
    expect(responseString).not.toContain('AIRBYTE_API_KEY');
  });

  it('should return 502/503 when Airbyte credentials are invalid', async () => {
    const res = await request(app.getHttpServer())
      .get('/integrations/airbyte/health')
      .set('Authorization', 'Bearer mock-admin-jwt-invalid-config')
      .expect(502);

    expect(res.body.status).toBe('unhealthy');
    expect(res.body.message).toBeDefined();
    // Ensure no secrets are leaked in error message
    expect(JSON.stringify(res.body)).not.toContain('sk-');
  });
});
```

### Expected Result
- Backend dapat membaca konfigurasi Airbyte.
- Health check mengembalikan status `healthy`.
- Jika credential invalid, API harus mengembalikan 502/503 tanpa membocorkan secret.
- Response tidak mengandung API key atau credential sensitif.

---
---

# PHASE 2 — Data Source Engine & Connectors

---

## TC-PH2-01: Validasi Airbyte API Wrapper Mengambil Workspace

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-01 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Airbyte Integration |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Airbyte API Wrapper

  Scenario: Backend mengambil informasi workspace dari Airbyte
    Given Airbyte credential valid tersedia
    When client meminta detail workspace Airbyte
    Then backend memanggil Airbyte API wrapper
    And response workspace dikembalikan dalam format internal
```

### Automation Script — Backend (Jest + SuperTest)

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

  it('should not expose Airbyte API key in response', async () => {
    const res = await request(app.getHttpServer())
      .get('/airbyte/workspace')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('apiKey');
    expect(bodyStr).not.toContain('api_key');
  });

  it('should return 503 when Airbyte is unreachable', async () => {
    const res = await request(app.getHttpServer())
      .get('/airbyte/workspace')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(503);

    expect(res.body.message).toContain('unreachable');
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-01: Airbyte Workspace — UI E2E', () => {
  test('should display Airbyte connection status on integrations page', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to integrations page
    await page.goto('/integrations');

    // Assert Airbyte workspace status is displayed
    await expect(page.locator('[data-testid="airbyte-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="airbyte-status"]')).toContainText(/connected|healthy/i);
  });
});
```

### Expected Result
- Backend menormalisasi response Airbyte.
- Tidak ada data sensitif (API key) yang terekspos di response.
- Error Airbyte dipetakan ke HTTP status internal yang sesuai.
- Frontend menampilkan status koneksi Airbyte pada halaman integrations.

---

## TC-PH2-02: Validasi Membuat Connection Baru

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-02 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Connection Management |
| **Prioritas** | Critical |

### BDD Gherkin

```gherkin
Feature: Connection Management

  Scenario: User membuat connection data source baru
    Given user memiliki role ADMIN atau OWNER
    And source dan destination Airbyte valid
    When user membuat connection baru
    Then connection tersimpan di database
    And connection dibuat di Airbyte
```

### Automation Script — Backend (Jest + SuperTest)

```ts
import request from 'supertest';
import { app } from '../setup-e2e';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    expect(res.body.name).toBe('Google Ads QA Sync');

    // Verify connection exists in database
    const dbConnection = await prisma.connection.findUnique({
      where: { id: res.body.id },
    });
    expect(dbConnection).not.toBeNull();
    expect(dbConnection?.airbyteConnectionId).toBeDefined();
  });

  it('should return 400 for invalid source/destination', async () => {
    await request(app.getHttpServer())
      .post('/connections')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        sourceId: 'nonexistent_source',
        destinationId: 'dst_sarai_postgres',
        name: 'Invalid Connection',
        syncMode: 'full_refresh',
      })
      .expect(400);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-02: Create Connection — UI E2E', () => {
  test('should create a new data source connection via wizard', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to connections page
    await page.goto('/connections');
    await page.click('[data-testid="create-connection-btn"]');

    // Step 1: Select source
    await expect(page.locator('[data-testid="source-selector"]')).toBeVisible();
    await page.click('[data-testid="source-google-ads"]');

    // Step 2: Configure source
    await page.fill('[data-testid="source-api-key"]', 'test-api-key');
    await page.click('[data-testid="next-step-btn"]');

    // Step 3: Select destination
    await page.click('[data-testid="destination-postgres"]');
    await page.click('[data-testid="next-step-btn"]');

    // Step 4: Configure sync
    await page.fill('[data-testid="connection-name"]', 'Google Ads QA Sync');
    await page.selectOption('[data-testid="sync-mode"]', 'incremental');
    await page.fill('[data-testid="cron-expression"]', '0 */6 * * *');

    // Submit connection
    await page.click('[data-testid="create-connection-submit"]');

    // Assert success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('text=Google Ads QA Sync')).toBeVisible();
  });
});
```

### Expected Result
- Connection dibuat di Airbyte dan database lokal.
- Response mengandung `airbyteConnectionId`.
- Status awal connection aktif atau pending sesuai desain.
- Frontend wizard berfungsi dari source selection hingga sync configuration.

---

## TC-PH2-03: Validasi Role MEMBER Tidak Bisa Membuat Connection

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-03 |
| **Tipe** | Security + E2E UI |
| **Kategori** | RBAC |
| **Prioritas** | Critical |

### BDD Gherkin

```gherkin
Feature: Connection RBAC

  Scenario: Member biasa mencoba membuat connection
    Given user memiliki role MEMBER
    When user mengirim request create connection
    Then API mengembalikan status 403
    And connection tidak dibuat
```

### Automation Script — Backend (Jest + SuperTest)

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

  it('should reject member from updating connection', async () => {
    await request(app.getHttpServer())
      .patch('/connections/conn_qa_001')
      .set('Authorization', 'Bearer mock-member-jwt')
      .send({ name: 'Hacked Connection' })
      .expect(403);
  });

  it('should reject member from deleting connection', async () => {
    await request(app.getHttpServer())
      .delete('/connections/conn_qa_001')
      .set('Authorization', 'Bearer mock-member-jwt')
      .expect(403);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-03: Connection RBAC — UI E2E', () => {
  test('should not show create connection button for MEMBER role', async ({ page }) => {
    // Login as member
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'member@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to connections page
    await page.goto('/connections');

    // Create connection button should not be visible
    await expect(page.locator('[data-testid="create-connection-btn"]')).not.toBeVisible();

    // Member should see existing connections (read-only)
    await expect(page.locator('[data-testid="connections-list"]')).toBeVisible();
  });
});
```

### Expected Result
- MEMBER menerima 403 Forbidden untuk create/update/delete connection.
- Tidak ada connection baru di database.
- Tidak ada panggilan create ke Airbyte API.
- Frontend menyembunyikan tombol create connection untuk MEMBER.

---

## TC-PH2-04: Validasi OAuth Flow via Airbyte

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-04 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | OAuth |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Airbyte OAuth Flow

  Scenario: User memulai OAuth authorization untuk source connector
    Given connector mendukung OAuth
    When user meminta OAuth authorization URL
    Then backend mengembalikan authorization URL dari Airbyte
    And state token tersimpan untuk validasi callback
```

### Automation Script — Backend (Jest + SuperTest)

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
    const res = await request(app.getHttpServer())
      .post('/airbyte/oauth/authorize')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        sourceDefinitionId: 'google-sheets-source-def',
        redirectUrl: 'https://evil.com/steal',
      })
      .expect(400);

    expect(res.body.message).toContain('redirect');
  });

  it('should reject OAuth for connector that does not support OAuth', async () => {
    await request(app.getHttpServer())
      .post('/airbyte/oauth/authorize')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        sourceDefinitionId: 'csv-file-source-def',
        redirectUrl: 'https://app.sarai.test/oauth/callback',
      })
      .expect(400);
  });

  it('should validate state token on callback', async () => {
    const authRes = await request(app.getHttpServer())
      .post('/airbyte/oauth/authorize')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        sourceDefinitionId: 'google-sheets-source-def',
        redirectUrl: 'https://app.sarai.test/oauth/callback',
      })
      .expect(200);

    // Callback with invalid state should fail
    await request(app.getHttpServer())
      .post('/airbyte/oauth/callback')
      .send({
        state: 'invalid-state-token',
        code: 'auth_code_here',
      })
      .expect(400);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-04: Airbyte OAuth Flow — UI E2E', () => {
  test('should initiate OAuth flow for Google Sheets connector', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to create connection and select Google Sheets
    await page.goto('/connections/new');
    await page.click('[data-testid="source-google-sheets"]');

    // Should show OAuth connect button
    const oauthBtn = page.locator('[data-testid="oauth-connect-btn"]');
    await expect(oauthBtn).toBeVisible();
    await expect(oauthBtn).toContainText(/connect.*google/i);
  });
});
```

### Expected Result
- Authorization URL valid dikembalikan dari Airbyte.
- State token dibuat untuk mencegah CSRF.
- Redirect URL harus tervalidasi terhadap allowlist.
- Connector tanpa OAuth support ditolak.
- Frontend menampilkan tombol OAuth connect untuk connector yang mendukung.

---

## TC-PH2-05: Validasi Source Catalog Mapping 600+ Sources

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-05 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Catalog |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Source Catalog

  Scenario: User membuka katalog source connector
    Given Airbyte source catalog tersedia
    When user meminta daftar source
    Then sistem mengembalikan daftar source yang sudah dimapping
    And jumlah source minimal 600
```

### Automation Script — Backend (Jest + SuperTest)

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

  it('should support category filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/sources/catalog?category=databases')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
    res.body.items.forEach((source: any) => {
      expect(source.category).toBe('databases');
    });
  });

  it('should support pagination', async () => {
    const page1 = await request(app.getHttpServer())
      .get('/sources/catalog?page=1&limit=50')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    const page2 = await request(app.getHttpServer())
      .get('/sources/catalog?page=2&limit=50')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(200);

    expect(page1.body.items.length).toBe(50);
    expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-05: Source Catalog — UI E2E', () => {
  test('should display source catalog with search functionality', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to source catalog
    await page.goto('/sources');
    await expect(page.locator('[data-testid="source-catalog"]')).toBeVisible();

    // Assert sources are loaded
    await expect(page.locator('[data-testid="source-card"]').first()).toBeVisible();

    // Test search functionality
    await page.fill('[data-testid="source-search"]', 'stripe');
    await page.waitForTimeout(500);

    // Assert filtered results contain "stripe"
    const results = page.locator('[data-testid="source-card"]');
    await expect(results.first()).toBeVisible();
    await expect(results.first()).toContainText(/stripe/i);
  });

  test('should display source categories as filter tabs', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/sources');

    // Assert category filters are present
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();

    // Click a category filter
    await page.click('[data-testid="category-databases"]');

    // Assert filtered sources
    const results = page.locator('[data-testid="source-card"]');
    await expect(results.first()).toBeVisible();
  });
});
```

### Expected Result
- Minimal 600 source connector tersedia.
- Setiap source memiliki mapping internal: id, name, category, icon, auth type.
- Filter/search berfungsi dengan benar.
- Frontend menampilkan katalog dengan grid cards dan search bar yang responsif.

---

## TC-PH2-06: Validasi Sync Config Full Refresh

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-06 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Sync Configuration |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Sync Configuration

  Scenario: User mengatur sync mode full refresh
    Given connection valid sudah tersedia
    When user memperbarui sync config menjadi full refresh
    Then config tersimpan
    And request update dikirim ke Airbyte
```

### Automation Script — Backend (Jest + SuperTest)

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
          { name: 'ad_groups', selected: true, cursorField: null },
        ],
      })
      .expect(200);

    expect(res.body.syncMode).toBe('full_refresh');
    expect(res.body.streams[0].selected).toBe(true);
    expect(res.body.streams[0].cursorField).toBeNull();
  });

  it('should return 404 for non-existent connection', async () => {
    await request(app.getHttpServer())
      .patch('/connections/nonexistent_conn/sync-config')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        syncMode: 'full_refresh',
        streams: [{ name: 'campaigns', selected: true, cursorField: null }],
      })
      .expect(404);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-06: Full Refresh Sync Config — UI E2E', () => {
  test('should update sync mode to full refresh in connection settings', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to connection settings
    await page.goto('/connections/conn_qa_001/settings');

    // Change sync mode to full refresh
    await page.selectOption('[data-testid="sync-mode-select"]', 'full_refresh');

    // Select streams
    await page.check('[data-testid="stream-campaigns"]');

    // Save changes
    await page.click('[data-testid="save-sync-config"]');

    // Assert success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-mode-select"]')).toHaveValue('full_refresh');
  });
});
```

### Expected Result
- Sync config tersimpan dengan benar.
- Airbyte connection juga ikut diperbarui.
- Full refresh tidak membutuhkan cursor field.
- Frontend memperbarui UI setelah save sukses.

---

## TC-PH2-07: Validasi Sync Config Incremental Wajib Cursor Field

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-07 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Validation |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Incremental Sync Validation

  Scenario: User mengatur incremental sync tanpa cursor field
    Given connection valid sudah tersedia
    When user mengirim config incremental tanpa cursor field
    Then API mengembalikan status 400
    And config tidak disimpan
```

### Automation Script — Backend (Jest + SuperTest)

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
    expect(res.body.streams[0].cursorField).toBe('updated_at');
  });

  it('should reject cursor field that does not exist in stream schema', async () => {
    const res = await request(app.getHttpServer())
      .patch('/connections/conn_qa_001/sync-config')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .send({
        syncMode: 'incremental',
        streams: [
          { name: 'orders', selected: true, cursorField: 'nonexistent_field' },
        ],
      })
      .expect(400);

    expect(res.body.message).toContain('cursor');
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-07: Incremental Cursor Validation — UI E2E', () => {
  test('should show validation error when selecting incremental without cursor', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to connection settings
    await page.goto('/connections/conn_qa_001/settings');

    // Change sync mode to incremental without selecting cursor
    await page.selectOption('[data-testid="sync-mode-select"]', 'incremental');

    // Cursor field should now be required and visible
    await expect(page.locator('[data-testid="cursor-field-select"]')).toBeVisible();

    // Try to save without cursor
    await page.click('[data-testid="save-sync-config"]');

    // Assert validation error
    await expect(page.locator('[data-testid="cursor-field-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="cursor-field-error"]')).toContainText(/cursor.*required|select.*cursor/i);
  });

  test('should allow saving when cursor field is provided for incremental', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/connections/conn_qa_001/settings');

    await page.selectOption('[data-testid="sync-mode-select"]', 'incremental');
    await page.selectOption('[data-testid="cursor-field-select"]', 'updated_at');
    await page.click('[data-testid="save-sync-config"]');

    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});
```

### Expected Result
- Config incremental tanpa cursor field ditolak (400).
- Config incremental dengan cursor valid diterima (200).
- Tidak ada update ke Airbyte untuk config invalid.
- Frontend menampilkan field cursor wajib saat incremental dipilih dan menampilkan validasi error.

---

## TC-PH2-08: Validasi Sync Monitoring Menampilkan Status Job

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-08 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Monitoring |
| **Prioritas** | High |

### BDD Gherkin

```gherkin
Feature: Sync Monitoring

  Scenario: User melihat status sync connection
    Given Airbyte job sedang berjalan
    When user membuka sync monitoring
    Then backend mengembalikan status job terkini
    And progress sync ditampilkan
```

### Automation Script — Backend (Jest + SuperTest)

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

    if (res.body.jobs.length > 0) {
      expect(res.body.jobs[0]).toMatchObject({
        jobId: expect.any(String),
        status: expect.any(String),
        startedAt: expect.any(String),
      });
    }
  });

  it('should return 404 for non-existent connection sync status', async () => {
    await request(app.getHttpServer())
      .get('/connections/nonexistent/sync-status')
      .set('Authorization', 'Bearer mock-admin-jwt')
      .expect(404);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-08: Sync Monitoring — UI E2E', () => {
  test('should display sync status and history on monitoring page', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to connection monitoring
    await page.goto('/connections/conn_qa_001/monitoring');

    // Assert sync status is displayed
    await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-status"]')).toContainText(
      /running|succeeded|failed|idle/i,
    );

    // Assert records synced count
    await expect(page.locator('[data-testid="records-synced"]')).toBeVisible();

    // Assert sync history table
    await expect(page.locator('[data-testid="sync-history-table"]')).toBeVisible();
  });

  test('should show sync progress indicator during active sync', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/connections/conn_qa_001/monitoring');

    // If sync is running, progress bar should be visible
    const progressVisible = await page.locator('[data-testid="sync-progress"]').isVisible();
    if (progressVisible) {
      await expect(page.locator('[data-testid="sync-progress"]')).toContainText(/\d+%/);
    }
  });
});
```

### Expected Result
- Status sync terbaru dikembalikan dengan benar.
- Jumlah record synced tersedia.
- Error Airbyte, jika ada, ditampilkan secara aman tanpa secret.
- Frontend menampilkan status, progress bar, dan history table.

---

## TC-PH2-09: Validasi Trial System 14 Hari

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-09 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Business Logic |
| **Prioritas** | Medium |

### BDD Gherkin

```gherkin
Feature: Trial System

  Scenario: Workspace baru mendapatkan trial 14 hari
    Given user membuat workspace baru
    When workspace berhasil dibuat
    Then sistem menetapkan trial selama 14 hari
    And fitur trial dapat digunakan sampai tanggal expiry
```

### Automation Script — Backend (Jest + SuperTest)

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
    expect(res.body.trialDaysRemaining).toBeLessThanOrEqual(14);
  });

  it('should calculate trial days remaining correctly', async () => {
    const res = await request(app.getHttpServer())
      .get('/workspaces/current')
      .set('Authorization', 'Bearer mock-user-jwt')
      .expect(200);

    const now = Date.now();
    const trialEnds = new Date(res.body.trialEndsAt).getTime();
    const expectedDaysRemaining = Math.ceil((trialEnds - now) / 86_400_000);

    expect(res.body.trialDaysRemaining).toBe(expectedDaysRemaining);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-09: Trial System — UI E2E', () => {
  test('should display trial badge and remaining days for new workspace', async ({ page }) => {
    // Login as user with trial workspace
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'trial.user@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Assert trial badge is visible
    await expect(page.locator('[data-testid="trial-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="trial-badge"]')).toContainText(/trial/i);

    // Assert remaining days display
    await expect(page.locator('[data-testid="trial-days-remaining"]')).toBeVisible();
    await expect(page.locator('[data-testid="trial-days-remaining"]')).toContainText(/\d+\s*days?/i);
  });

  test('should show upgrade prompt for trial users', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'trial.user@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to billing or settings
    await page.goto('/settings/billing');

    // Assert upgrade CTA is visible
    await expect(page.locator('[data-testid="upgrade-btn"]')).toBeVisible();
  });
});
```

### Expected Result
- Workspace baru memiliki `planStatus` = `TRIAL`.
- Trial expiry tepat 14 hari dari tanggal pembuatan.
- `trialDaysRemaining` dikalkulasi dengan benar.
- Frontend menampilkan badge trial dan sisa hari yang tersisa.

---

## TC-PH2-10: Validasi Trial Expired Membatasi Create Connection

| Item | Detail |
|------|--------|
| **ID** | TC-PH2-10 |
| **Tipe** | Integration API + E2E UI |
| **Kategori** | Business Logic |
| **Prioritas** | Medium |

### BDD Gherkin

```gherkin
Feature: Trial Expiration

  Scenario: User dengan trial expired mencoba membuat connection
    Given workspace trial sudah expired
    When user membuat connection baru
    Then API mengembalikan status 402
    And user diarahkan untuk upgrade subscription
```

### Automation Script — Backend (Jest + SuperTest)

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

  it('should still allow read on source catalog after trial expired', async () => {
    const res = await request(app.getHttpServer())
      .get('/sources/catalog')
      .set('Authorization', 'Bearer mock-expired-trial-jwt')
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('should block sync trigger for expired trial', async () => {
    await request(app.getHttpServer())
      .post('/connections/conn_qa_001/trigger-sync')
      .set('Authorization', 'Bearer mock-expired-trial-jwt')
      .expect(402);
  });
});
```

### Automation Script — Frontend (Playwright)

```ts
import { test, expect } from '@playwright/test';

test.describe('TC-PH2-10: Trial Expired Restriction — UI E2E', () => {
  test('should show upgrade prompt and block connection creation for expired trial', async ({ page }) => {
    // Login as user with expired trial
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'expired.trial@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Assert expired trial banner is visible
    await expect(page.locator('[data-testid="trial-expired-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="trial-expired-banner"]')).toContainText(/expired|upgrade/i);

    // Navigate to connections page
    await page.goto('/connections');

    // Create connection button should be disabled or show upgrade modal
    const createBtn = page.locator('[data-testid="create-connection-btn"]');
    if (await createBtn.isVisible()) {
      await createBtn.click();

      // Should show upgrade modal instead of connection wizard
      await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-modal"]')).toContainText(/upgrade|subscription/i);
    }
  });

  test('should still allow viewing existing connections when trial expired', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'expired.trial@sarai.test');
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/connections');

    // Should still see existing connections (read-only)
    await expect(page.locator('[data-testid="connections-list"]')).toBeVisible();
  });
});
```

### Expected Result
- Workspace expired tidak dapat membuat connection baru.
- API mengembalikan 402 Payment Required.
- Response menyertakan `code: TRIAL_EXPIRED` dan `upgradeRequired: true`.
- Operasi baca (read) masih diizinkan.
- Frontend menampilkan banner expired trial dan modal upgrade saat user mencoba membuat connection.

---

> **Catatan:** Dokumen ini mencakup 10 skenario pengujian Phase 1 dan 10 skenario Phase 2, masing-masing dengan format: ID & Judul, BDD Gherkin, Automation Script Backend (Jest + SuperTest), Automation Script Frontend (Playwright), dan Expected Result. Lanjutkan ke Phase 3–8 dengan perintah "Lanjutkan".