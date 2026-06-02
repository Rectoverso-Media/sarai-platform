/**
 * Helper terpusat untuk fetch ke backend API dengan JWT token.
 * Ambil token dari localStorage('access_token') secara otomatis.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch ke backend dengan JWT Authorization header secara otomatis.
 * Signature sama persis dengan native fetch() agar mudah dipakai.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

export { API_URL };
