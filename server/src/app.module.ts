import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { S2SModule } from './s2s/s2s.module';
import { CronModule } from './cron/cron.module';
import { PlatformLinksModule } from './platform-links/platform-links.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    NotificationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
    S2SModule,
    CronModule,
    PlatformLinksModule,
  ],
})
export class AppModule {}
