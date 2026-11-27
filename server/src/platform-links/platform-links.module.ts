import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { PlatformLinksController } from './platform-links.controller';
import { PlatformLinksService } from './platform-links.service';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [PlatformLinksController],
  providers: [PlatformLinksService],
  exports: [PlatformLinksService],
})
export class PlatformLinksModule {}
