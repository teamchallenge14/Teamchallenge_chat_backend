import { ApiProperty } from '@nestjs/swagger';

export class AddUserInterestResponseDto {
  @ApiProperty({ example: 2 })
  added: number;
}

export class DeleteUserInterestResponseDto {
  @ApiProperty({ example: 1 })
  deleted: number;
}
