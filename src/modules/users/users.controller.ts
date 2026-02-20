import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { routesV1 } from '@src/config/app/app.routes';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@src/common/dto/pagination-query.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { FindOneUserQueryDto } from './dto/find-one-user.query.dto';
import { FullUserDto } from './dto/full-user.dto';
import { CreatedUserDto } from '@src/modules/users/dto/created-user.dto';
import { UpdatedUserDto } from '@src/modules/users/dto/updated-user.dto';

import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import { UpdateUserInterestsDto } from '@src/modules/users/dto/update-user-interests.dto';
import { TenantId } from '@src/common/decorators/tenant-id.decorator';
import { Public } from '@src/common/decorators';
import { GuestResponseDto } from '@src/modules/users/dto/guest-response.dto';
import { CreateGuestRequestDto } from '@src/modules/users/dto/create-guest-request.dto';

@ApiTags(routesV1.user.root)
@Public()
@Controller(routesV1.version)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // create

  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a user and returns public user data',
  })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: CreatedUserDto,
  })
  @ApiConflictResponse({
    description: 'User already exists (duplicate login or email)',
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
  })
  @Post(routesV1.user.create)
  create(
    @Body() createUserDto: CreateUserDto,
    @TenantId() tenantId: string,
  ): Promise<CreatedUserDto> {
    return this.usersService.create(createUserDto, tenantId);
  }

  // create guest
  @Post(routesV1.user.createGuest)
  @ApiOperation({ summary: 'Register guest user' })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: GuestResponseDto,
  })
  @ApiConflictResponse({
    description: 'User already exists (duplicate login or email)',
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
  })
  async createGuest(@Body() dto: CreateGuestRequestDto, @TenantId() tenantId: string) {
    return this.usersService.createGuest(dto, tenantId);
  }

  // get all users
  @ApiOperation({
    summary: 'Find list of all users',
    description: 'Return list of users with pagination',
  })
  @Get(routesV1.user.findAll)
  @ApiOkResponse({ type: PaginatedUsersDto })
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedUsersDto> {
    return this.usersService.findAll(query);
  }

  // find one
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({
    summary: 'Get full user info',
    description: 'return all public user info',
  })
  @Get(routesV1.user.findOne)
  @ApiOkResponse({ type: FullUserDto })
  async findOne(@Query() query: FindOneUserQueryDto): Promise<FullUserDto> {
    return this.usersService.findOne(query);
  }

  // update
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({
    summary: 'Update user',
    description: 'can update any field of user',
  })
  @Patch(routesV1.user.update)
  @ApiOkResponse({ type: UpdatedUserDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UpdatedUserDto> {
    return this.usersService.update(id, dto);
  }

  // delete
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user',
  })
  @Delete(routesV1.user.delete)
  @ApiOkResponse({
    description: 'User successfully deleted',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ success: boolean }> {
    return await this.usersService.delete(id);
  }

  // set interests

  @Patch(routesV1.user.interest)
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiOperation({
    summary: 'Add and/or remove user interests',
    description: 'Allows adding and removing user interests in a single request',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'e9c9c4b5-1d23-4f5a-9b8e-abcdef123456',
  })
  @ApiBearerAuth(AUTH_COOKIES.ACCESS_TOKEN)
  @ApiResponse({
    status: 200,
    description: 'User interests updated successfully',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or one or more interests not found',
  })
  updateUserInterests(@Param('id') userId: string, @Body() dto: UpdateUserInterestsDto) {
    return this.usersService.updateUserInterests(userId, dto);
  }
}
