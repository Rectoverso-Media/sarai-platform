import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.8', '192.168.100.5'],

  // Fix: Turbopack mendeteksi project root dari lokasi .git (sarai-platform/).
  // Kita perlu memberitahu Turbopack bahwa root yang benar adalah direktori frontend ini.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
