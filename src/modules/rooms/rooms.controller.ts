import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { routesV1 } from '@src/config';
import { RoomsService } from './rooms.service';
import { PaginatedRoomsDto, RoomDetailsDto } from './dto/responses';
import { GetRoomDocs, GetRoomsDocs, ReportRoomDocs } from './swagger-docs';
import { GetRoomsQueryDto } from './dto/get-rooms.query.dto';
import { RequirePermissions } from '@src/common/decorators';
import { Permission } from '@prisma/client';
import { ReportRoomDto } from './dto/report-room.dto';
import { ApproveRequestDto } from '@src/modules/rooms/dto/approve-request.dto';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';

@ApiTags(routesV1.rooms.root)
@Controller(routesV1.version)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get(routesV1.rooms.findOne)
  @RequirePermissions([Permission.USER_READ])
  @GetRoomDocs()
  findOne(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<RoomDetailsDto> {
    const user = req.user as { id: string };
    return this.roomsService.findOne(user.id, id);
  }

  @Get(routesV1.rooms.findAll)
  @RequirePermissions([Permission.USER_READ])
  @GetRoomsDocs()
  findAll(@Req() req: Request, @Query() query: GetRoomsQueryDto): Promise<PaginatedRoomsDto> {
    const user = req.user as { id: string };
    return this.roomsService.findAll(user?.id, query);
  }

  @Post(routesV1.rooms.report)
  @RequirePermissions([Permission.USER_READ])
  @ReportRoomDocs()
  report(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReportRoomDto,
  ): Promise<{ success: true }> {
    const user = req.user as { id: string };
    return this.roomsService.reportRoom(user?.id, id, dto);
  }

  @Post(routesV1.rooms.approve)
  @RequirePermissions([Permission.CHAT_READ])
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Approve or reject join request (owner only)' })
  async approveRequest(@Body() dto: ApproveRequestDto, @Req() req: any) {
    return this.roomsService.approveRequest(dto.requestId, req.user.id, dto.action);
  }

  @Delete(routesV1.rooms.leave)
  @RequirePermissions([Permission.CHAT_READ])
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Leave room' })
  async leaveRoom(@Param('roomId') roomId: string, @Req() req: any) {
    return this.roomsService.leaveRoom(roomId, req.user.id);
  }
}
