import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { InterestCategory } from '@prisma/client';
import { InterestService } from './interest.service';
import { routesV1 } from '@src/config';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';

@ApiTags(routesV1.interests.root)
@Controller(routesV1.version)
export class InterestController {
  constructor(private readonly interestsService: InterestService) {}

  @Post(routesV1.interests.create)
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Create interest' })
  create(@Body() dto: CreateInterestDto) {
    return this.interestsService.create(dto);
  }

  @Get(routesV1.interests.findAll)
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({ summary: 'Get all interests' })
  @ApiQuery({ name: 'category', enum: InterestCategory, required: false })
  findAll(@Query('category') category?: InterestCategory) {
    return this.interestsService.findAll(category);
  }

  @Get(routesV1.interests.findOne)
  @ApiOperation({ summary: 'Get interest by id' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.interestsService.findOne(id);
  }

  @Patch(routesV1.interests.update)
  @ApiOperation({ summary: 'Update interest' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateInterestDto) {
    return this.interestsService.update(id, dto);
  }

  @Delete(routesV1.interests.delete)
  @ApiOperation({ summary: 'Delete interest' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.interestsService.remove(id);
  }
}
