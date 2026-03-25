// dto/base-user.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Gender } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BaseUserDto {
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  firstName?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Description',
  })
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'dark',
    description: 'Profile UI theme',
  })
  @Expose()
  @IsOptional()
  @IsString()
  profileTheme?: string;

  @ApiPropertyOptional()
  @ApiPropertyOptional({
    example: '2000-05-15T00:00:00.000Z',
    description: 'User birth date (ISO 8601 format)',
    type: String,
    format: 'date-time',
  })
  @Expose()
  @IsOptional()
  @IsDateString({}, { message: 'birthDate must be a valid ISO 8601 date string' })
  birthDate?: Date;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
  })
  @Expose()
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
