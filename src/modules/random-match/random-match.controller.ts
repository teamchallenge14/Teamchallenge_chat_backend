import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { routesV1 } from '@src/config';
import { RequirePermissions } from '@src/common/decorators';
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
    @Req() req: Request,
    @Body() dto: StartRandomMatchDto,
  ): Promise<RandomMatchResponseDto> {
    const user = req.user as { id: string };
    const tenantId = (req as Request & { tenantId: string }).tenantId;

    return this.randomMatchService.startMatch(user?.id, tenantId, dto);
  }
}
