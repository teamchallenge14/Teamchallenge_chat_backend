import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsUUID,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateUserDto {
  /* =========================
     AUTH (LOCAL)
     ========================= */

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'User email (LOCAL auth)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'user_login',
    minLength: 3,
    description: 'User login (LOCAL auth)',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  login?: string;

  @ApiPropertyOptional({
    example: 'StrongP4ssword',
    minLength: 8,
    description: 'Password must contain at least one uppercase letter and one number',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*\d)/)
  password?: string;

  /* =========================
     PROFILE (UserData)
     ========================= */

  @ApiPropertyOptional({
    example: 'User',
    minLength: 3,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'SecondUserName',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Short description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'dark',
    description: 'Profile UI theme',
  })
  @IsOptional()
  @IsString()
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

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  // interest

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440111'],
    description: 'List of interest IDs (UUID)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  interestIds?: string[];
}
