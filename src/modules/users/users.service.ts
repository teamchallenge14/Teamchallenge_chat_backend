import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@db/prisma.service';
import { PaginationQueryDto } from '@src/common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '@src/common/dto/paginated-response.dto';
import { UserListItemDto } from './dto/user-list-item.dto';
import { FindOneUserQueryDto } from './dto/find-one-user.query.dto';
import { FullUserDto } from './dto/full-user.dto';
import { AccountStatus, Prisma } from '@prisma/client';
import { CreatedUserDto } from '@src/modules/users/dto/created-user.dto';
import { pickDefined } from '@src/common/utils/pick-defined';
import { UpdatedUserDto } from '@src/modules/users/dto/updated-user.dto';
import { UsersRepository } from '@src/modules/users/repository/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersDao: UsersRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<CreatedUserDto> {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.usersDao.createUser({
        email: dto.email,
        login: dto.login,
        passwordHash,
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          description: dto.description,
          avatar: dto.avatar,
          profileTheme: dto.profileTheme,
          age: dto.age,
          gender: dto.gender,
        },
      });

      return {
        id: user.id,
        email: user.authMethods[0]?.email ?? undefined,
        login: user.authMethods[0]?.login ?? undefined,
        provider: user.authMethods[0]?.provider,
        createdAt: user.createdAt,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('User already exists');
        }
      }
      throw e;
    }
  }

  // find all
  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<UserListItemDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const { users, total } = await this.usersDao.findAllPaginated({
      skip,
      take: limit,
    });

    const items: UserListItemDto[] = users.map((user) => {
      const localAuth = user.authMethods[0];

      return {
        id: user.id,
        login: localAuth?.login ?? undefined,
        email: localAuth?.email ?? undefined,
        provider: localAuth?.provider,
        createdAt: user.createdAt,
      };
    });

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // find one
  async findOne(query: FindOneUserQueryDto): Promise<FullUserDto> {
    const { id, login, email } = query;

    if (!id && !login && !email) {
      throw new BadRequestException('Provide at least one search parameter: id, login or email');
    }

    const user = await this.usersDao.findOne({ id, login, email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const localAuth = user.authMethods[0];

    return {
      id: user.id,
      login: localAuth?.login ?? undefined,
      email: localAuth?.email ?? undefined,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,

      firstName: user.data?.firstName ?? undefined,
      lastName: user.data?.lastName ?? undefined,
      description: user.data?.description ?? undefined,
      avatar: user.data?.avatar ?? undefined,
      profileTheme: user.data?.profileTheme ?? undefined,
      age: user.data?.age ?? undefined,
      gender: user.data?.gender ?? undefined,

      provider: localAuth?.provider,
      providerId: localAuth?.providerId,
      emailVerifiedAt: user.emailVerifiedAt ?? undefined,
      identityVerifiedAt: user.identityVerifiedAt ?? undefined,

      interests: user.userInterests.map((ui) => ui.interest),
    };
  }

  // update
  async update(id: string, dto: UpdateUserDto): Promise<UpdatedUserDto> {
    const authData = pickDefined({
      login: dto.login,
      email: dto.email,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
    });

    const profileData = pickDefined({
      firstName: dto.firstName,
      lastName: dto.lastName,
      description: dto.description,
      avatar: dto.avatar,
      profileTheme: dto.profileTheme,
      age: dto.age,
      gender: dto.gender,
    });

    const updatedUser = await this.usersDao.updateUser(id, {
      authData: Object.keys(authData).length ? authData : undefined,
      profileData: Object.keys(profileData).length ? profileData : undefined,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const localAuth = updatedUser.authMethods[0];

    return {
      id: updatedUser.id,

      email: localAuth?.email ?? undefined,
      login: localAuth?.login ?? undefined,

      accountStatus: updatedUser.accountStatus,
      createdAt: updatedUser.createdAt,

      firstName: updatedUser.data?.firstName ?? undefined,
      lastName: updatedUser.data?.lastName ?? undefined,
      description: updatedUser.data?.description ?? undefined,
      avatar: updatedUser.data?.avatar ?? undefined,
      profileTheme: updatedUser.data?.profileTheme ?? undefined,
      age: updatedUser.data?.age ?? undefined,
      gender: updatedUser.data?.gender ?? undefined,
    };
  }

  // delete
  async delete(id: string): Promise<{ success: boolean }> {
    const affected = await this.usersDao.softDelete(id);

    if (affected === 0) {
      throw new NotFoundException('User not found');
    }

    return { success: true };
  }

  async setUserInterests(userId: string, interestIds: string[]): Promise<{ success: true }> {
    const user = await this.usersDao.getUserAccountStatus(userId);

    if (!user || user.accountStatus === AccountStatus.DELETED) {
      throw new NotFoundException('User not found');
    }

    const uniqueInterestIds = [...new Set(interestIds)];

    if (uniqueInterestIds.length > 0) {
      const existingCount = await this.usersDao.countExistingInterests(uniqueInterestIds);

      if (existingCount !== uniqueInterestIds.length) {
        throw new NotFoundException('One or more interests not found');
      }
    }

    await this.usersDao.replaceUserInterests(userId, uniqueInterestIds);

    return { success: true };
  }

  // add user interests
  async addUserInterests(userId: string, interestIds: string[]): Promise<{ success: true }> {
    const user = await this.usersDao.getUserAccountStatus(userId);

    if (!user || user.accountStatus === AccountStatus.DELETED) {
      throw new NotFoundException('User not found');
    }

    const uniqueInterestIds = [...new Set(interestIds)];

    if (uniqueInterestIds.length > 0) {
      const count = await this.usersDao.countExistingInterests(uniqueInterestIds);

      if (count !== uniqueInterestIds.length) {
        throw new NotFoundException('One or more interests not found');
      }
    }

    await this.usersDao.addUserInterests(userId, uniqueInterestIds);

    return { success: true };
  }

  // remove user interests
  async removeUserInterests(userId: string, interestIds: string[]): Promise<{ success: true }> {
    const user = await this.usersDao.getUserAccountStatus(userId);

    if (!user || user.accountStatus === AccountStatus.DELETED) {
      throw new NotFoundException('User not found');
    }

    const uniqueInterestIds = [...new Set(interestIds)];

    await this.usersDao.removeUserInterests(userId, uniqueInterestIds);

    return { success: true };
  }
}
