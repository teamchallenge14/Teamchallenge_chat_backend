import { IsUUID } from 'class-validator';

export class JoinRoomPayloadDto {
  @IsUUID()
  roomId: string;
}
