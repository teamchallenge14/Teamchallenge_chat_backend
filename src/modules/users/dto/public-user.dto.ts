import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '@prisma/client';

export class PublicUserDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'user' })
  login?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;

  @ApiProperty({
    example: '2025-12-19T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  accountStatus: AccountStatus;
}
