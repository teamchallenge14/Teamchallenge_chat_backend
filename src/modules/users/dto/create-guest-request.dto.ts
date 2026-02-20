import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseUserDto } from './base-user.dto';
import { IsString } from 'class-validator';

export class CreateGuestRequestDto extends BaseUserDto {
  @ApiProperty({
    example: 'JohnDoe',
    description: 'Unique user login',
    minLength: 3,
  })
  @IsString()
  @Expose()
  login: string;
}
