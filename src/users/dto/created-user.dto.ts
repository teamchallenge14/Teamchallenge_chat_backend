import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '@prisma/client';
import { IsUUID } from 'class-validator';

export class CreatedUserDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID (UUID)',
  })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'user' })
  login?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'LOCAL', required: true })
  provider: AuthProvider;

  @ApiProperty({
    example: '2025-12-19T10:30:00.000Z',
  })
  createdAt: Date;
}
