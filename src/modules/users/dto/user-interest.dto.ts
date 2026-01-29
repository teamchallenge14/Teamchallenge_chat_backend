import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class UserInterestDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    description: 'List of interest IDs',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  interestIds: string[];
}
