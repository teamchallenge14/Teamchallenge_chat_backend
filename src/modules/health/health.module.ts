import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { DatabaseHealthDao } from '@src/modules/health/dao/database.health.dao';
import { PrismaService } from '@db/prisma.service';
import { RedisHealthDao } from '@src/modules/health/dao/redis.health.dao';
import { RedisModule } from '@src/infra/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [HealthController],
  providers: [HealthService, DatabaseHealthDao, RedisHealthDao, PrismaService],
})
export class HealthModule {}
