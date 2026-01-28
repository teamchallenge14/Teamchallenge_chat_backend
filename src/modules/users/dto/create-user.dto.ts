import {
  IsEmail,
  IsOptional,
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AccountStatus, Gender } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique user email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'JohnDoe',
    description: 'Unique user login',
    minLength: 3,
  })
  @IsString()
  login: string;

  @ApiProperty({
    example: 'StrongP4ssword',
    description: 'Password must contain at least one uppercase letter and one number',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*\d)/)
  password: string;

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
    example: 'Description',
  })
  @IsOptional()
  @IsString()
  description?: string;

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
    example: 25,
    minimum: 12,
    maximum: 120,
    description: 'User age (minimum 12)',
  })
  @IsOptional()
  @IsInt()
  @Min(12, { message: 'Age must be at least 12 years old' })
  @Max(120, { message: 'Age must be realistic' })
  age?: number;

  @ApiPropertyOptional({
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
