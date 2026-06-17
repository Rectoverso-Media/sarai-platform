import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.8', '192.168.100.5'],

  // Fix: Turbopack mendeteksi project root dari lokasi .git (sarai-platform/).
  // Kita perlu memberitahu Turbopack bahwa root yang benar adalah direktori frontend ini.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Standalone output untuk Docker production — menghasilkan image yang lebih kecil
  // Aktifkan ini saat build untuk production
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),

  // Security headers untuk production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

