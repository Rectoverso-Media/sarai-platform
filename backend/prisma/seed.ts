import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database SARAI...');

  // ==========================================
  // 1. Buat Tim Default
  // ==========================================
  const team = await prisma.team.upsert({
    where: { id: 'default-team-001' },
    update: {},
    create: {
      id: 'default-team-001',
      name: 'Tim SARAI Demo',
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'ACTIVE',
    },
  });
  console.log('✅ Tim default dibuat:', team.name);

  // ==========================================
  // 2. Buat Users (Owner, Admin, Viewer)
  // ==========================================
  const ownerPassword = await bcrypt.hash('Admin123!', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@sarai.demo' },
    update: {},
    create: {
      email: 'owner@sarai.demo',
      name: 'Owner SARAI',
      password: ownerPassword,
      role: Role.OWNER,
      isEmailVerified: true,
      teamId: team.id,
    },
  });
  console.log('✅ Owner dibuat:', owner.email);

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sarai.demo' },
    update: {},
    create: {
      email: 'admin@sarai.demo',
      name: 'Admin SARAI',
      password: adminPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
      teamId: team.id,
    },
  });
  console.log('✅ Admin dibuat:', admin.email);

  const viewerPassword = await bcrypt.hash('Viewer123!', 10);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@sarai.demo' },
    update: {},
    create: {
      email: 'viewer@sarai.demo',
      name: 'Viewer SARAI',
      password: viewerPassword,
      role: Role.VIEWER,
      isEmailVerified: true,
      teamId: team.id,
    },
  });
  console.log('✅ Viewer dibuat:', viewer.email);

  // ==========================================
  // 3. Buat Data Sources Contoh
  // ==========================================
  const gadsSource = await prisma.dataSource.upsert({
    where: { airbyteSourceId: 'demo-google-ads-001' },
    update: {},
    create: {
      name: 'Google Ads - Kampanye Q4 2025',
      sourceType: 'Google Ads',
      connectorName: 'Google Ads',
      airbyteSourceId: 'demo-google-ads-001',
      status: 'Connected',
      isTrialActive: false,
      trialStartsAt: new Date('2025-11-01'),
      trialEndsAt: new Date('2025-11-15'),
    },
  });
  console.log('✅ Data source Google Ads dibuat');

  const metaSource = await prisma.dataSource.upsert({
    where: { airbyteSourceId: 'demo-meta-ads-001' },
    update: {},
    create: {
      name: 'Meta Ads - Facebook Campaign',
      sourceType: 'Facebook Marketing',
      connectorName: 'Facebook Marketing',
      airbyteSourceId: 'demo-meta-ads-001',
      status: 'Connected',
      isTrialActive: true,
      trialStartsAt: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Data source Meta Ads dibuat');

  // ==========================================
  // 4. Buat Query Contoh
  // ==========================================
  const query1 = await prisma.query.upsert({
    where: { id: 'demo-query-001' },
    update: {},
    create: {
      id: 'demo-query-001',
      name: 'Total Spend per Kampanye',
      description: 'Menghitung total pengeluaran per kampanye iklan',
      rawSql: 'SELECT campaign_name, SUM(spend) as total_spend FROM synced_data WHERE stream_name = \'campaigns\' GROUP BY campaign_name ORDER BY total_spend DESC',
    },
  });
  console.log('✅ Query contoh dibuat');

  // ==========================================
  // 5. Buat Dashboard Default
  // ==========================================
  const dashboard = await prisma.dashboard.upsert({
    where: { id: 'default-dashboard' },
    update: {},
    create: {
      id: 'default-dashboard',
      name: 'Main Dashboard',
      teamId: team.id,
      isPublic: false,
      widgets: [],
      layout: [],
    },
  });
  console.log('✅ Dashboard default dibuat');

  // ==========================================
  // 6. Buat Insight Config Default
  // ==========================================
  const insightConfig = await prisma.insightConfig.upsert({
    where: { id: 'default-insight-config' },
    update: {},
    create: {
      id: 'default-insight-config',
      targetTable: 'system',
      metric: 'daily_health_check',
      frequency: 'daily',
    },
  });
  console.log('✅ Insight config dibuat');

  // ==========================================
  // 7. Buat Notifikasi Demo
  // ==========================================
  await prisma.notification.create({
    data: {
      userId: owner.id,
      title: 'Selamat datang di SARAI! 🎉',
      message: 'Platform analitik data terintegrasi Anda sudah siap. Mulai hubungkan sumber data pertama Anda.',
      isRead: false,
    },
  });
  console.log('✅ Notifikasi welcome dibuat');

  // ==========================================
  // 8. Buat Audit Log Demo
  // ==========================================
  await prisma.auditLog.createMany({
    data: [
      {
        action: 'POST /auth/register',
        actor: owner.email,
        details: JSON.stringify({ role: 'OWNER' }),
        ipAddress: '127.0.0.1',
      },
      {
        action: 'POST /data-sources',
        actor: owner.email,
        details: JSON.stringify({ source: 'Google Ads' }),
        ipAddress: '127.0.0.1',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Audit log demo dibuat');

  console.log('\n🎉 Seeding selesai! Akun demo:');
  console.log('   Owner  : owner@sarai.demo  / Admin123!');
  console.log('   Admin  : admin@sarai.demo  / Admin123!');
  console.log('   Viewer : viewer@sarai.demo / Viewer123!');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
