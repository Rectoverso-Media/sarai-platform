# ════════════════════════════════════════════════════════════════
# SARAI Backend — Production Dockerfile (Multi-Stage Build)
# ════════════════════════════════════════════════════════════════

# ──────────────────────────────────────────────────────────────
# STAGE 1: Builder — install deps & compile TypeScript
# ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Install openssl untuk Prisma (dibutuhkan di Debian slim)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files dulu untuk leverage Docker cache
COPY package*.json ./
COPY prisma ./prisma/

# Install SEMUA dependencies (termasuk devDeps untuk build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Compile TypeScript ke JavaScript
RUN npm run build

# ──────────────────────────────────────────────────────────────
# STAGE 2: Production — hanya copy artifact yang diperlukan
# ──────────────────────────────────────────────────────────────
FROM node:20-slim AS production

# Install openssl untuk Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Buat non-root user untuk keamanan
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nestjs

WORKDIR /app

# Copy package files untuk production install
COPY package*.json ./
COPY prisma ./prisma/

# Install HANYA production dependencies (tanpa devDeps)
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client di production stage
RUN npx prisma generate

# Copy compiled output dari builder stage
COPY --from=builder /app/dist ./dist

# Copy file konfigurasi yang diperlukan runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Ganti ke user non-root (keamanan)
USER nestjs

# Health check — pastikan server respond sebelum container dinyatakan healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

EXPOSE 3001

ENV NODE_ENV=production

# Gunakan node langsung (bukan npm) untuk menghindari extra process
CMD ["node", "dist/main"]