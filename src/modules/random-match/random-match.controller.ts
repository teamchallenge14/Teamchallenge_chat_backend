import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { routesV1 } from '@src/config';
import { RequirePermissions, TenantId, UserDecorator } from '@src/common/decorators';
import { Permission } from '@prisma/client';

import { RandomMatchService } from './random-match.service';
import { StartRandomMatchDto } from './dto/start-random-match.dto';
import { RandomMatchResponseDto } from './dto/random-match-response.dto';
import { StartRandomMatchDocs } from './swagger-docs';

@ApiTags(routesV1.randomMatch.root)
@Controller(routesV1.version)
export class RandomMatchController {
  constructor(private readonly randomMatchService: RandomMatchService) {}

  @Post(routesV1.randomMatch.start)
  @RequirePermissions([Permission.CHAT_READ])
  @StartRandomMatchDocs()
  @HttpCode(HttpStatus.OK)
  startMatch(
    @UserDecorator('id') userId: string,
    @TenantId() tenantId: string,
    @Body() dto: StartRandomMatchDto,
  ): Promise<RandomMatchResponseDto> {
    return this.randomMatchService.startMatch(userId, tenantId, dto);
  }
}
