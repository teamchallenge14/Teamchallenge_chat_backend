import { Injectable } from '@nestjs/common';
import { PrismaService } from '@db/prisma.service';
import { CheckResultDto } from '../dto/check-result.dto';

@Injectable()
export class DatabaseHealthDao {
  constructor(private readonly prisma: PrismaService) {}

  async check(timeoutMs = 500): Promise<CheckResultDto> {
    const start = Date.now();

    try {
      let timeoutId: NodeJS.Timeout | undefined;
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
        }),
      ]);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
