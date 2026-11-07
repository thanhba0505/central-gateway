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
