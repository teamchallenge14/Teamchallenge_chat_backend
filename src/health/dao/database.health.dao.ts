import { Injectable } from '@nestjs/common';
import { PrismaService } from '@db/prisma.service';
import { CheckResultDto } from '../dto/check-result.dto';

@Injectable()
export class DatabaseHealthDao {
  constructor(private readonly prisma: PrismaService) {}

  async check(timeoutMs = 500): Promise<CheckResultDto> {
    const start = Date.now();

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
      ]);

      return {
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : 'db error',
      };
    }
  }
}
