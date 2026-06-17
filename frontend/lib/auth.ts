/**
 * Utility untuk decode JWT token dan extract user info.
 * Dipakai di seluruh frontend sebagai pengganti localStorage('userData').
 *
 * SECURITY NOTE:
 * - JWT payload bisa di-decode tanpa secret karena payload tidak dienkripsi.
 * - Tapi TIDAK bisa dipalsukan karena signature diverifikasi di backend.
 * - Jangan simpan data sensitif di payload JWT.
 */

export interface JwtPayload {
  sub: string;      // user ID
  email: string;
  name: string;
  role: string;
  teamId?: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT payload (bagian tengah token, base64url encoded).
 * Tidak memerlukan secret — payload JWT memang bisa dibaca di client.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Tambahkan padding base64 jika perlu
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Ambil token dari localStorage('access_token').
 * Return null jika tidak ada atau jika berjalan di server (SSR).
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Ambil user info dari JWT token yang tersimpan.
 * Sumber kebenaran utama untuk user identity di frontend.
 */
export function getCurrentUser(): JwtPayload | null {
  const token = getToken();
  if (!token) return null;
  return decodeJwt(token);
}

/**
 * Cek apakah token masih valid (belum expired).
 */
export function isTokenValid(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.exp * 1000 > Date.now();
}

/**
 * Logout: hapus token dari localStorage dan redirect ke login.
 * Jangan hapus 'userData' karena sudah deprecated — gunakan JWT.
 */
export function logout(): void {
  localStorage.removeItem('access_token');
  // Hapus juga userData lama jika ada (backward compat cleanup)
  localStorage.removeItem('userData');
  // Hapus cookie isLoggedIn jika ada
  document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
