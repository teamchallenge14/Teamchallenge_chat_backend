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
import { routesV1 } from '@src/config/app.routes';
import {
  ApiBadRequestResponse,
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
import { FullUserDto } from './dto/full-User.dto';
import { SetUserInterestsDto } from './dto/set-user-interests.dto';
import { CreatedUserDto } from '@src/users/dto/created-user.dto';
import { UpdatedUserDto } from '@src/users/dto/updated-user.dto';

@ApiTags(routesV1.user.root)
@Controller(routesV1.version)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // create
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
  @ApiOperation({
    summary: 'Update user',
    description: 'can update any field of user',
  })
  @Patch(routesV1.user.update)
  @ApiOkResponse({ type: FullUserDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UpdatedUserDto> {
    return this.usersService.update(id, dto);
  }

  // delete
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user and returns void',
  })
  @Delete(routesV1.user.delete)
  @ApiOkResponse({
    description: 'User successfully deleted',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.usersService.delete(id);
  }

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
}
