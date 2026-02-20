import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@src/common/dto/pagination-query.dto';

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class GetRoomsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: SortOrder,
    example: SortOrder.desc,
    description: 'Sort order for members count',
  })
  @IsEnum(SortOrder)
  @IsOptional()
  membersCount?: SortOrder;
}
