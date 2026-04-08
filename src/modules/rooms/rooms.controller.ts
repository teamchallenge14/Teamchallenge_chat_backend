import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { routesV1 } from '@src/config';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatedRoomDto, PaginatedRoomsDto, RoomDetailsDto } from './dto/responses';
import { CreateRoomDocs, GetRoomDocs, GetRoomsDocs, ReportRoomDocs } from './swagger-docs';
import { GetRoomsQueryDto } from './dto/get-rooms.query.dto';
import { RequirePermissions, UserDecorator } from '@src/common/decorators';
import { Permission } from '@prisma/client';
import { ReportRoomDto } from './dto/report-room.dto';

@ApiTags(routesV1.rooms.root)
@Controller(routesV1.version)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post(routesV1.rooms.create)
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        files: 1,
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const isImage = file.mimetype?.startsWith('image/');
        if (!isImage) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        return cb(null, true);
      },
    }),
  )
  @CreateRoomDocs()
  create(
    @UserDecorator('id') userId: string,
    @Body() dto: CreateRoomDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<CreatedRoomDto> {
    return this.roomsService.create(userId, dto, file);
  }

  @Get(routesV1.rooms.findOne)
  @RequirePermissions([Permission.USER_READ])
  @GetRoomDocs()
  findOne(
    @UserDecorator('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<RoomDetailsDto> {
    return this.roomsService.findOne(userId, id);
  }

  @Get(routesV1.rooms.findAll)
  @RequirePermissions([Permission.USER_READ])
  @GetRoomsDocs()
  findAll(
    @UserDecorator('id') userId: string,
    @Query() query: GetRoomsQueryDto,
  ): Promise<PaginatedRoomsDto> {
    return this.roomsService.findAll(userId, query);
  }

  @Post(routesV1.rooms.report)
  @RequirePermissions([Permission.USER_READ])
  @ReportRoomDocs()
  report(
    @UserDecorator('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReportRoomDto,
  ): Promise<{ success: true }> {
    return this.roomsService.reportRoom(userId, id, dto);
  }
}
