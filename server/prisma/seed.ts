import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Central Gateway database...');

  // Create Wonderlab project
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
    { eventType: 'deploy', channelId: 'C0CGL8EHU9E', channelName: '#deployments' },
    { eventType: 'ci', channelId: 'C0CGL8EBFT2', channelName: '#ci-cd' },
    { eventType: 'git', channelId: 'C0CFRUJUCSE', channelName: '#git-activity' },
    { eventType: 'feedback', channelId: 'C0CFAFQH739', channelName: '#wonderlab-feedback' },
    { eventType: 'comment', channelId: 'C0CFAFQRU2K', channelName: '#wonderlab-comments' },
  ];

  for (const ch of channels) {
    await prisma.channelMapping.upsert({
      where: {
        projectId_eventType_provider: {
          projectId: wonderlab.id,
          eventType: ch.eventType,
          provider: 'slack',
        },
      },
      update: {
        channelId: ch.channelId,
        channelName: ch.channelName,
      },
      create: {
        projectId: wonderlab.id,
        eventType: ch.eventType,
        channelId: ch.channelId,
        channelName: ch.channelName,
        provider: 'slack',
      },
    });
  }

  // Create Central Gateway project
  const centralGateway = await prisma.project.upsert({
    where: { slug: 'central-gateway' },
    update: { name: 'Central Gateway' },
    create: {
      slug: 'central-gateway',
      name: 'Central Gateway',
      description: 'Centralized API & Notification Gateway for the ThanhBa ecosystem',
    },
  });

  console.log('Created or updated project:', centralGateway.name);

  const gatewayChannels = [
    { eventType: 'deploy', channelId: 'C0CGL8EHU9E', channelName: '#deployments' },
    { eventType: 'ci', channelId: 'C0CGL8EBFT2', channelName: '#ci-cd' },
    { eventType: 'git', channelId: 'C0CFRUJUCSE', channelName: '#git-activity' },
  ];

  for (const ch of gatewayChannels) {
    await prisma.channelMapping.upsert({
      where: {
        projectId_eventType_provider: {
          projectId: centralGateway.id,
          eventType: ch.eventType,
          provider: 'slack',
        },
      },
      update: {
        channelId: ch.channelId,
        channelName: ch.channelName,
      },
      create: {
        projectId: centralGateway.id,
        eventType: ch.eventType,
        channelId: ch.channelId,
        channelName: ch.channelName,
        provider: 'slack',
      },
    });
  }

  // Register Wonderlab OAuth Client for SSO
  await prisma.oAuthClient.upsert({
    where: { clientId: 'wonderlab' },
    update: {
      name: 'Wonderlab Platform',
      redirectUris: [
        'http://localhost:4100/auth/callback',
        'http://localhost:4200/auth/callback',
        'https://wonderlab.io.vn/auth/callback',
        'https://www.wonderlab.io.vn/auth/callback',
      ],
      isActive: true,
    },
    create: {
      clientId: 'wonderlab',
      clientSecret: 'wonderlab_sso_secret',
      name: 'Wonderlab Platform',
      redirectUris: [
        'http://localhost:4100/auth/callback',
        'http://localhost:4200/auth/callback',
        'https://wonderlab.io.vn/auth/callback',
        'https://www.wonderlab.io.vn/auth/callback',
      ],
      isActive: true,
    },
  });
  console.log('Seeded Wonderlab OAuth client.');

  console.log('Successfully seeded channel mappings.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
