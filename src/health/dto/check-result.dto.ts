import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckResultDto {
  @ApiProperty({ enum: ['healthy', 'unhealthy'], example: 'healthy' })
  status: 'healthy' | 'unhealthy';

  @ApiPropertyOptional({
    example: 15,
    description: 'Latency in milliseconds',
  })
  latencyMs?: number;

  @ApiPropertyOptional({
    example: 'connection timeout',
  })
  error?: string;
}
