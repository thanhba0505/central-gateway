import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { S2SService } from './s2s.service';

@Module({
  imports: [PrismaModule],
  providers: [S2SService],
  exports: [S2SService],
})
export class S2SModule {}
