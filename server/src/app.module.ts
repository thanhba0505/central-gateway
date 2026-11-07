import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [PrismaModule, HealthModule, NotificationsModule, ProjectsModule],
})
export class AppModule {}
