import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProjectsModule } from './projects/projects.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [PrismaModule, HealthModule, NotificationsModule, ProjectsModule, LogsModule],
})
export class AppModule {}
