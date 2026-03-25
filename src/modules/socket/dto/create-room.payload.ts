import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RoomLanguage, RoomType } from '@prisma/client';
import type { CreateRoomInput } from '@src/modules/rooms/contracts/create-room.input';

export class CreateRoomPayloadDto implements CreateRoomInput {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsEnum(RoomType)
  type: RoomType;

  @Type(() => Number)
  @IsInt()
  @Min(12)
  @Max(100)
  @IsOptional()
  minAge?: number;

  @Type(() => Number)
  @IsInt()
  @Min(12)
  @Max(100)
  @IsOptional()
  maxAge?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(RoomLanguage, { each: true })
  languages: RoomLanguage[];

  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  interestIds?: string[];
}
