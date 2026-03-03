import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty()
  @IsUUID()
  roomId: string;
}
