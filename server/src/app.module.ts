import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProjectsModule } from './projects/projects.module';
import { LogsModule } from './logs/logs.module';
import { AuthModule } from './auth/auth.module';
import { S2SModule } from './s2s/s2s.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    NotificationsModule,
    ProjectsModule,
    LogsModule,
    AuthModule,
    S2SModule,
  ],
})
export class AppModule {}
