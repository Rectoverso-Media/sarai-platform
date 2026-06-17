# ════════════════════════════════════════════════════════════════
# SARAI Frontend — Production Dockerfile (Multi-Stage Build)
# ════════════════════════════════════════════════════════════════

# ──────────────────────────────────────────────────────────────
# STAGE 1: Dependencies installer
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./
# npm ci lebih deterministic dan lebih aman dari npm install untuk CI/production
RUN npm ci

# ──────────────────────────────────────────────────────────────
# STAGE 2: Builder — build Next.js app
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps dari stage sebelumnya
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build dengan standalone output (lebih ringan untuk Docker)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ──────────────────────────────────────────────────────────────
# STAGE 3: Runner — production image yang minimal
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Buat non-root user untuk keamanan
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy hanya file yang dibutuhkan runtime
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Gunakan server.js dari standalone output Next.js
CMD ["node", "server.js"]