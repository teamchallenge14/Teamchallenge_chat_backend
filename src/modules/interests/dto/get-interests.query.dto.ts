import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { InterestCategory } from '@prisma/client';
import { PaginationQueryDto } from '@src/common/dto/pagination-query.dto';

export class GetInterestsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: InterestCategory,
    description: 'Filter interests by category',
  })
  @IsEnum(InterestCategory)
  @IsOptional()
  category?: InterestCategory;

  @ApiPropertyOptional({
    example: 'foot',
    minLength: 3,
    description: 'Case-insensitive search by full or partial interest name (min 3 characters)',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @IsOptional()
  search?: string;
}
