import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum } from 'class-validator';

export enum RequestAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ApproveRequestDto {
  @ApiProperty()
  @IsUUID()
  requestId: string;

  @ApiProperty({ enum: RequestAction })
  @IsEnum(RequestAction)
  action: RequestAction;
}
