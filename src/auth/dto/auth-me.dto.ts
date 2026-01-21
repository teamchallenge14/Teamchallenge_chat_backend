import { ApiProperty } from '@nestjs/swagger';

export class AuthMeDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Authenticated user ID from access token',
  })
  id: string;
}
