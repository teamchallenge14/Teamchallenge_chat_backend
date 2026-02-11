import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, RoomMemberRole } from '@prisma/client';
import { CreatedRoomDto } from './created-room.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class RoomMemberDto {
  @ApiPropertyOptional({
    example: 'John',
  })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
  })
  lastName?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
  })
  avatar?: string;

  @ApiPropertyOptional({
    example: '2000-05-15T00:00:00.000Z',
    description: 'User birth date (ISO 8601 format)',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'birthDate must be a valid ISO 8601 date string' })
  birthDate?: Date;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
  })
  gender?: Gender;

  @ApiProperty({
    enum: RoomMemberRole,
    example: RoomMemberRole.MEMBER,
  })
  role: RoomMemberRole;
}

export class RoomDetailsDto extends CreatedRoomDto {
  @ApiProperty({
    type: [RoomMemberDto],
  })
  members: RoomMemberDto[];
}
