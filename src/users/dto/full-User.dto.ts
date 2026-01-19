import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, Gender } from '@prisma/client';
import { InterestDto } from '@src/interest/dto/interest.dto';
import { IsUUID } from 'class-validator';

export class FullUserDto {
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

  @ApiPropertyOptional({
    example: 'User',
    minLength: 3,
    maxLength: 20,
  })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'SecondUserName',
  })
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Description',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
  })
  avatar?: string;

  @ApiPropertyOptional({
    example: 'dark',
    description: 'Profile UI theme',
  })
  profileTheme?: string;

  @ApiPropertyOptional({
    example: 25,
    minimum: 0,
  })
  age?: number;

  @ApiProperty({
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  accountStatus: AccountStatus;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
  })
  gender?: Gender;

  @ApiProperty({
    example: '2025-01-10T12:00:00.000Z',
    description: 'User creation date',
  })
  createdAt: Date;

  @ApiProperty({
    type: [InterestDto],
    description: 'User interests',
  })
  interests: InterestDto[];
}
