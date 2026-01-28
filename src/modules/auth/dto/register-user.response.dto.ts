import { ApiProperty } from '@nestjs/swagger';
import { CreatedUserDto } from '@src/modules/users/dto/created-user.dto';

export class RegisterUserResponseDto {
  @ApiProperty({ type: CreatedUserDto })
  user: CreatedUserDto;

  @ApiProperty({
    description: 'JWT access token (Bearer)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
