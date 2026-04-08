import { ApiProperty } from '@nestjs/swagger';

export class CreateContactResponseDto {
  @ApiProperty({
    example: true,
  })
  success: true;
}
