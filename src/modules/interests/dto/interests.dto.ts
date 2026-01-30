import { ApiProperty } from '@nestjs/swagger';
import { InterestCategory } from '@prisma/client';

export class InterestDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Interest ID (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'Music',
  })
  name: string;

  @ApiProperty({
    enum: InterestCategory,
    example: InterestCategory.ENTERTAINMENT,
  })
  category: InterestCategory;
}
