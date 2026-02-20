import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AuthProvider } from '@prisma/client';

export class GuestResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  login: string;

  @ApiProperty({ enum: AuthProvider })
  @Expose()
  provider: AuthProvider;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
