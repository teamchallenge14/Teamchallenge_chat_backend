import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';
import { runtimeCheck } from './checks/runtime.check';
import { DatabaseHealthDao } from './dao/database.health.dao';

@Injectable()
export class HealthService {
  constructor(private readonly dbHealthDao: DatabaseHealthDao) {}

  private base(): Pick<HealthResponseDto, 'timestamp' | 'uptime'> {
    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  liveness(): HealthResponseDto {
    return {
      status: 'healthy',
      ...this.base(),
    };
  }

  async readiness(): Promise<HealthResponseDto> {
    const runtime = runtimeCheck();
    const database = await this.dbHealthDao.check();

    const healthy = runtime.status === 'healthy' && database.status === 'healthy';

    const response: HealthResponseDto = {
      status: healthy ? 'healthy' : 'unhealthy',
      ...this.base(),
      checks: {
        runtime,
        database,
      },
    };

    if (!healthy) {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }

  async full(): Promise<HealthResponseDto> {
    return this.readiness();
  }
}
