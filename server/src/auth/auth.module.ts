import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { S2SModule } from '../s2s/s2s.module';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [
    PrismaModule,
    S2SModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'central-gateway-jwt-secret-key-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ApiKeyGuard],
  exports: [AuthService, JwtModule, ApiKeyGuard],
})
export class AuthModule {}
