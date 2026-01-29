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
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { routesV1 } from '@src/config/app/app.routes';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@src/common/dto/pagination-query.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { FindOneUserQueryDto } from './dto/find-one-user.query.dto';
import { FullUserDto } from './dto/full-user.dto';
import { SetUserInterestsDto } from './dto/set-user-interests.dto';
import { CreatedUserDto } from '@src/modules/users/dto/created-user.dto';
import { UpdatedUserDto } from '@src/modules/users/dto/updated-user.dto';
import { UserInterestDto } from '@src/modules/users/dto/user-interest.dto';
import {
  AddUserInterestResponseDto,
  DeleteUserInterestResponseDto,
} from '@src/modules/users/dto/user-interest.response.dto';

@ApiTags(routesV1.user.root)
@Controller(routesV1.version)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // create

  @ApiBearerAuth('access-token')
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
  create(@Body() createUserDto: CreateUserDto): Promise<CreatedUserDto> {
    return this.usersService.create(createUserDto);
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
  @ApiBearerAuth('access-token')
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
  @ApiBearerAuth('access-token')
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
  @ApiBearerAuth('access-token')
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
  @ApiBearerAuth('access-token')
  @Put(routesV1.user.interest)
  @ApiOperation({ summary: 'Set user interests (replace)' })
  @ApiParam({
    name: 'id',
    example: 'a3f1e1a0-3b0c-4c9f-8f5a-3c6b1f7d9e21',
    description: 'User UUID',
  })
  setUserInterests(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: SetUserInterestsDto,
  ) {
    return this.usersService.setUserInterests(userId, dto.interestIds);
  }

  // Add interests
  @Post(routesV1.user.interestAdd)
  @ApiOperation({
    summary: 'Add interests to user',
    description: 'Adds one or more interests to a user without removing existing ones',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    format: 'uuid',
    description: 'User ID',
  })
  @ApiBody({ type: UserInterestDto })
  @ApiOkResponse({
    description: 'Interests successfully added',
    type: AddUserInterestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User or one of interests not found',
  })
  addInterests(@Param('userId') userId: string, @Body() dto: UserInterestDto) {
    return this.usersService.addUserInterests(userId, dto.interestIds);
  }

  // Delete interests
  @Delete(routesV1.user.interestDelete)
  @ApiOperation({
    summary: 'Remove interests from user',
    description: 'Removes specific interests from a user without affecting others',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    format: 'uuid',
    description: 'User ID',
  })
  @ApiBody({ type: UserInterestDto })
  @ApiOkResponse({
    description: 'Interests successfully removed',
    type: DeleteUserInterestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  deleteInterests(@Param('userId') userId: string, @Body() dto: UserInterestDto) {
    return this.usersService.removeUserInterests(userId, dto.interestIds);
  }
}
