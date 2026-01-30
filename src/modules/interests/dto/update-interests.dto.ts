import { ApiPropertyOptional } from '@nestjs/swagger';
import { InterestCategory } from '@prisma/client';

export class UpdateInterestDto {
  @ApiPropertyOptional({ example: 'Basketball' })
  name?: string;

  @ApiPropertyOptional({ enum: InterestCategory })
  category?: InterestCategory;
}
