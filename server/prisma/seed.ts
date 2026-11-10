import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Central Gateway database...');

  // 1. Seed Default Administrator User
  const isProd = process.env.NODE_ENV === 'production';
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@wonderlab.local';
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!isProd || rawPassword) {
    const effectivePassword = rawPassword || 'Admin@Wonderlab2026!';
    const passwordHash = await argon2.hash(effectivePassword, {
      type: argon2.argon2id,
    });

    const admin = await prisma.user.upsert({
      where: { username: adminUsername },
      update: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        isEmailVerified: true,
        isActive: true,
      },
      create: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        isEmailVerified: true,
        isActive: true,
      },
    });

    console.log(
      `[Seed] Seeded admin user: ${admin.username} (${admin.email}, Role: ${admin.role})`,
    );
  }

  // 2. Create Wonderlab project
  const wonderlab = await prisma.project.upsert({
    where: { slug: 'wonderlab' },
    update: { name: 'Wonderlab Platform' },
    create: {
      slug: 'wonderlab',
      name: 'Wonderlab Platform',
      description: 'Interactive science, probability, paradoxes and logic simulations platform',
    },
  });

  console.log('Created or updated project:', wonderlab.name);

  // Initial channel mappings for Wonderlab
  const channels = [
    { eventType: 'deploy', channelId: 'C0CGL8EHU9E' },
    { eventType: 'ci', channelId: 'C0CGL8EBFT2' },
    { eventType: 'git', channelId: 'C0CFRUJUCSE' },
    { eventType: 'feedback', channelId: 'C0CFAFQH739' },
    { eventType: 'comment', channelId: 'C0CFAFQRU2K' },
  ];

  for (const ch of channels) {
    await prisma.channelMapping.upsert({
      where: {
        projectId_eventType: {
          projectId: wonderlab.id,
          eventType: ch.eventType,
        },
      },
      update: {
        channelId: ch.channelId,
      },
      create: {
        projectId: wonderlab.id,
        eventType: ch.eventType,
        channelId: ch.channelId,
      },
    });
  }

  // 3. Create Central Gateway project
  const centralGateway = await prisma.project.upsert({
    where: { slug: 'central-gateway' },
    update: { name: 'Central Gateway' },
    create: {
      slug: 'central-gateway',
      name: 'Central Gateway',
      description: 'Centralized API & Notification Gateway for the Prism ecosystem',
    },
  });

  console.log('Created or updated project:', centralGateway.name);

  const gatewayChannels = [
    { eventType: 'deploy', channelId: 'C0CGL8EHU9E' },
    { eventType: 'ci', channelId: 'C0CGL8EBFT2' },
    { eventType: 'git', channelId: 'C0CFRUJUCSE' },
  ];

  for (const ch of gatewayChannels) {
    await prisma.channelMapping.upsert({
      where: {
        projectId_eventType: {
          projectId: centralGateway.id,
          eventType: ch.eventType,
        },
      },
      update: {
        channelId: ch.channelId,
      },
      create: {
        projectId: centralGateway.id,
        eventType: ch.eventType,
        channelId: ch.channelId,
      },
    });
  }

  // 4. Register Wonderlab Service Connection
  await prisma.serviceConnection.upsert({
    where: { slug: 'wonderlab' },
    update: {
      name: 'Wonderlab Platform',
      domain:
        process.env.NODE_ENV === 'production'
          ? 'https://wonderlab-server.onrender.com'
          : 'http://localhost:4101',
      apiPrefix: '/api/v1',
      apiKey: 'gw_to_wl_s2s_secret_2026',
      incomingSecret: 'wl_to_gw_s2s_secret_2026',
      isActive: true,
      timeoutMs: 5000,
      metadata: { syncUser: true, healthPath: '/health' },
    },
    create: {
      slug: 'wonderlab',
      name: 'Wonderlab Platform',
      domain:
        process.env.NODE_ENV === 'production'
          ? 'https://wonderlab-server.onrender.com'
          : 'http://localhost:4101',
      apiPrefix: '/api/v1',
      apiKey: 'gw_to_wl_s2s_secret_2026',
      incomingSecret: 'wl_to_gw_s2s_secret_2026',
      isActive: true,
      timeoutMs: 5000,
      metadata: { syncUser: true, healthPath: '/health' },
    },
  });
  console.log('Seeded Wonderlab Service Connection.');

  console.log('Successfully seeded database.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
