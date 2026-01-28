import { ApiProperty } from '@nestjs/swagger';
import { UserListItemDto } from './user-list-item.dto';

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserListItemDto] })
  items: UserListItemDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}
