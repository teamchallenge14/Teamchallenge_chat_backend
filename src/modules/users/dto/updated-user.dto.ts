import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, AuthProvider, Gender } from '@prisma/client';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class UpdatedUserDto {
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
    example: '2000-05-15T00:00:00.000Z',
    description: 'User birth date (ISO 8601 format)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'birthDate must be a valid ISO 8601 date string' })
  birthDate?: Date;

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

  @ApiPropertyOptional({
    example: true,
    description: 'Allow other users to save this profile in contacts',
  })
  allowContactSave?: boolean;

  @ApiProperty({
    enum: AuthProvider,
    example: AuthProvider.LOCAL,
  })
  provider?: AuthProvider;

  @ApiPropertyOptional({
    example: 'ksdkosjdahguwefm',
    description: 'User provider id for social signin',
  })
  providerId?: string;

  @ApiPropertyOptional({
    example: '2025-01-10T12:00:00.000Z',
    description: 'User email verification date',
  })
  emailVerifiedAt?: Date;
  @ApiPropertyOptional({
    example: '2025-01-10T12:00:00.000Z',
    description: 'User identity verification date',
  })
  identityVerifiedAt?: Date;

  @ApiProperty({
    example: '2025-01-10T12:00:00.000Z',
    description: 'User creation date',
  })
  createdAt: Date;
}
