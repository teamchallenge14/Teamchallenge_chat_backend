import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckResultDto } from './check-result.dto';

export class HealthResponseDto {
  @ApiProperty({ enum: ['healthy', 'unhealthy'], example: 'healthy' })
  status: 'healthy' | 'unhealthy';

  @ApiProperty({ example: '2026-01-22T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({
    example: 12345,
    description: 'Process uptime in seconds',
  })
  uptime: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/CheckResultDto',
    },
  })
  checks?: Record<string, CheckResultDto>;
}
