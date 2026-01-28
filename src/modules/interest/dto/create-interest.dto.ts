import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { InterestCategory } from '@prisma/client';

export class CreateInterestDto {
  @ApiProperty({
    example: 'Football',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: InterestCategory,
    required: false,
    default: InterestCategory.OTHER,
  })
  @IsEnum(InterestCategory)
  category?: InterestCategory;
}
