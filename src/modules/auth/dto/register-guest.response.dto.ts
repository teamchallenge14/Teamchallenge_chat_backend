import { ApiProperty } from '@nestjs/swagger';
import { GuestResponseDto } from '@src/modules/users/dto/guest-response.dto';

export class RegisterGuestResponseDto {
  @ApiProperty({ type: GuestResponseDto })
  user: GuestResponseDto;

  @ApiProperty({
    description: 'JWT access token (Bearer)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
