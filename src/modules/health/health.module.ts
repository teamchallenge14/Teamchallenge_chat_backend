import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { DatabaseHealthDao } from '@src/modules/health/dao/database.health.dao';
import { PrismaService } from '@db/prisma.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, DatabaseHealthDao, PrismaService],
})
export class HealthModule {}
