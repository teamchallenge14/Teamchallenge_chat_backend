import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('liveness')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Checks that the Node.js process is alive',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  liveness(): HealthResponseDto {
    return this.healthService.liveness();
  }

  @Get('readiness')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Checks if the service is ready to receive traffic',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ type: HealthResponseDto })
  async readiness(): Promise<HealthResponseDto> {
    return this.healthService.readiness();
  }

  @Get()
  @ApiOperation({
    summary: 'Full health status',
    description: 'Detailed health information for monitoring and debugging',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ type: HealthResponseDto })
  async full(): Promise<HealthResponseDto> {
    return this.healthService.full();
  }
}
