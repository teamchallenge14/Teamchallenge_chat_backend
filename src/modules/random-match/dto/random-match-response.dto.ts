import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RandomMatchUserDto } from './random-match-user.dto';

export class RandomMatchResponseDto {
  @ApiProperty({
    type: RandomMatchUserDto,
    nullable: true,
    description: 'Matched user or null if no match found',
  })
  match: RandomMatchUserDto | null;

  @ApiPropertyOptional({
    example: 'No matches found. Try adjusting your filters.',
    description: 'Human-readable message when no match is found',
  })
  message?: string;
}
