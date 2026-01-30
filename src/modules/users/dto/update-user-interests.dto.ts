import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserInterestsDto {
  @ApiPropertyOptional({
    description: 'Interest IDs to add to the user',
    example: ['c1c6e8e1-6f3a-4c3a-9f4a-1c9c6f8e1234'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  add?: string[];

  @ApiPropertyOptional({
    description: 'Interest IDs to remove from the user',
    example: ['b2b7a9d2-1234-4a2b-9f8e-abcdef123456'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  remove?: string[];
}
