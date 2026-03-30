import { ApiProperty } from '@nestjs/swagger';

import { InterestDto } from './interests.dto';

export class PaginatedInterestsDto {
  @ApiProperty({ type: [InterestDto] })
  items: InterestDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}
