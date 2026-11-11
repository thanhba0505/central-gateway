import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminOrS2SGuard } from './admin-or-s2s.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService, AdminOrS2SGuard],
  exports: [UsersService],
})
export class UsersModule {}
