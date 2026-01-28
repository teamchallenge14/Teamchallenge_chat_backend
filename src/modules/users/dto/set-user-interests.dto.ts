import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayUnique, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class SetUserInterestsDto {
  @ApiProperty({
    example: ['a3f1e1a0-3b0c-4c9f-8f5a-3c6b1f7d9e21', 'b1d2c3e4-5678-4abc-9def-1234567890ab'],
    description: 'Array of interest UUIDs',
  })
  @IsArray()
  @ArrayUnique()
  @Type(() => String)
  @IsUUID('4', { each: true })
  interestIds: string[];
}
