import { Injectable } from '@nestjs/common';
import { CheckResultDto } from '../dto/check-result.dto';
import { RedisService } from '@src/infra/redis/redis.service';

@Injectable()
export class RedisHealthDao {
  constructor(private readonly redisService: RedisService) {}

  async check(timeoutMs = 500): Promise<CheckResultDto> {
    const start = Date.now();

    try {
      let timeoutId: NodeJS.Timeout | undefined;
      await Promise.race([
        this.redisService.ping(),
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
        error: err instanceof Error ? err.message : 'redis error',
      };
    }
  }
}
