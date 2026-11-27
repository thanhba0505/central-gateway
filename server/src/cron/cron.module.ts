import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { CronController } from './cron.controller';
import { CronJobOrgClient } from './cron-job-org.client';
import { CronService } from './cron.service';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [CronController],
  providers: [CronJobOrgClient, CronService],
  exports: [CronService],
})
export class CronModule {}
