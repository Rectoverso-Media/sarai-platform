# Kita pakai versi slim (Debian) yang punya library C/C++ lebih lengkap buat Prisma
FROM node:20-slim 

# Kita butuh install openssl manual di Debian slim biar Prisma bisa jalan
RUN apt-get update -y && apt-get install -y openssl

# Set folder kerja di dalam kontainer
WORKDIR /app

# Copy file package dulu buat install library
COPY package*.json ./
COPY prisma ./prisma/

# Install library dan generate prisma client
RUN npm install
RUN npx prisma generate

# Copy semua kodingan backend kamu
COPY . .

# Build aplikasi NestJS
RUN npm run build

# Buka jalur portal 3001
EXPOSE 3001

# Jalankan servernya
CMD ["npm", "run", "start:prod"]