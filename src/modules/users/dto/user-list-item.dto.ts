import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthProvider } from '@prisma/client';
import { IsUUID } from 'class-validator';

export class UserListItemDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID (UUID)',
  })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'User email (LOCAL auth)',
  })
  email?: string;

  @ApiPropertyOptional({
    example: 'user_login',
    description: 'User login (LOCAL auth)',
  })
  login?: string;

  @ApiProperty({ example: 'LOCAL', required: true })
  provider: AuthProvider;

  @ApiProperty({
    example: '2025-01-10T12:00:00.000Z',
    description: 'User creation date',
  })
  createdAt: Date;
}
