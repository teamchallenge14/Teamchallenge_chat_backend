import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  Validate,
} from 'class-validator';
import { Gender, RoomLanguage } from '@prisma/client';
import { MaxAgeGteMinAgeConstraint } from '../../../common/validators/max-age-gte-min-age.validator';

export class StartRandomMatchDto {
  @ApiPropertyOptional({
    enum: RoomLanguage,
    example: RoomLanguage.EN,
    description: 'UI language. If not provided, current user language is used when available.',
  })
  @IsEnum(RoomLanguage)
  @IsOptional()
  uiLanguage?: RoomLanguage;

  @ApiPropertyOptional({
    isArray: true,
    enum: Gender,
    example: [Gender.MALE, Gender.FEMALE],
    description: 'Preferred genders of the interlocutor',
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(Gender, { each: true })
  @IsOptional()
  genders?: Gender[];

  @ApiPropertyOptional({
    isArray: true,
    enum: RoomLanguage,
    example: [RoomLanguage.EN],
    description: 'Preferred languages of the interlocutor',
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(RoomLanguage, { each: true })
  @IsOptional()
  languages?: RoomLanguage[];

  @ApiPropertyOptional({
    example: 18,
    minimum: 12,
    maximum: 100,
    description: 'Minimum preferred age',
  })
  @Type(() => Number)
  @IsInt()
  @Min(12)
  @Max(100)
  @IsOptional()
  minAge?: number;

  @ApiPropertyOptional({
    example: 30,
    minimum: 12,
    maximum: 100,
    description: 'Maximum preferred age',
  })
  @Type(() => Number)
  @IsInt()
  @Min(12)
  @Max(100)
  @Validate(MaxAgeGteMinAgeConstraint)
  @IsOptional()
  maxAge?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description: 'Preferred interest IDs',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  interestIds?: string[];
}
