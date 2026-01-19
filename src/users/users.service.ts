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
// import { Prisma } from '../../generated/prisma/client';
// import { AccountStatus } from '@src/generated/enums';
import { PaginationQueryDto } from '@src/common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '@src/common/dto/paginated-response.dto';
import { UserListItemDto } from './dto/user-list-item.dto';
import { FindOneUserQueryDto } from './dto/find-one-user.query.dto';
import { FullUserDto } from './dto/full-User.dto';
import { AccountStatus, AuthProvider, Prisma } from '@prisma/client';
import { CreatedUserDto } from '@src/users/dto/created-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<CreatedUserDto> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          accountStatus: AccountStatus.ACTIVE,
          authMethods: {
            create: {
              provider: AuthProvider.LOCAL,
              login: dto.login,
              providerId: dto.email,
              email: dto.email,
              passwordHash: hashedPassword,
            },
          },
          data: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              description: dto.description,
              avatar: dto.avatar,
              profileTheme: dto.profileTheme,
              age: dto.age,
              gender: dto.gender,
              updatedAt: new Date(),
            },
          },
        },
        select: {
          id: true,
          accountStatus: true,
          createdAt: true,
          data: {
            select: {
              firstName: true,
              lastName: true,
              description: true,
              avatar: true,
              profileTheme: true,
              age: true,
              gender: true,
              updatedAt: true,
            },
          },
          authMethods: {
            select: {
              email: true,
              login: true,
              provider: true,
            },
            where: {
              provider: AuthProvider.LOCAL,
            },
            take: 1,
          },
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

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          accountStatus: {
            not: AccountStatus.DELETED,
          },
        },
        select: {
          id: true,
          createdAt: true,
          authMethods: {
            where: {
              provider: AuthProvider.LOCAL,
            },
            take: 1,
            select: {
              email: true,
              login: true,
              provider: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    const items: UserListItemDto[] = users.map((user) => {
      const localAuth = user.authMethods[0];

      return {
        id: user.id,
        login: localAuth?.login ?? undefined,
        email: localAuth?.email ?? undefined,
        provider: localAuth.provider,
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

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          id ? { id } : undefined,
          login
            ? {
                authMethods: {
                  some: {
                    provider: AuthProvider.LOCAL,
                    login,
                  },
                },
              }
            : undefined,
          email
            ? {
                authMethods: {
                  some: {
                    provider: AuthProvider.LOCAL,
                    email,
                  },
                },
              }
            : undefined,
        ].filter(Boolean) as Prisma.UserWhereInput[],
      },
      select: {
        id: true,
        accountStatus: true,
        emailVerifiedAt: true,
        identityVerifiedAt: true,
        createdAt: true,

        authMethods: {
          take: 1,
          select: {
            email: true,
            login: true,
            provider: true,
            providerId: true,
          },
        },

        data: {
          select: {
            firstName: true,
            lastName: true,
            description: true,
            avatar: true,
            profileTheme: true,
            age: true,
            gender: true,
          },
        },

        userInterests: {
          select: {
            interest: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

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

      provider: localAuth.provider,
      providerId: localAuth.providerId,
      emailVerifiedAt: user.emailVerifiedAt ?? undefined,
      identityVerifiedAt: user.identityVerifiedAt ?? undefined,

      interests: user.userInterests.map((ui) => ui.interest),
    };
  }

  // update
  async update(id: string, dto: UpdateUserDto): Promise<FullUserDto> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (dto.login || dto.email) {
        await tx.authMethod.upsert({
          where: {
            provider_providerId: {
              provider: AuthProvider.LOCAL,
              providerId: dto.email ?? dto.login!,
            },
          },
          update: {
            login: dto.login,
            email: dto.email,
          },
          create: {
            provider: AuthProvider.LOCAL,
            providerId: dto.email ?? dto.login!,
            login: dto.login,
            email: dto.email,
            userId: id,
          },
        });
      }

      if (
        dto.firstName !== undefined ||
        dto.lastName !== undefined ||
        dto.description !== undefined ||
        dto.avatar !== undefined ||
        dto.profileTheme !== undefined ||
        dto.age !== undefined ||
        dto.gender !== undefined
      ) {
        await tx.userData.upsert({
          where: { userId: id },
          update: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            description: dto.description,
            avatar: dto.avatar,
            profileTheme: dto.profileTheme,
            age: dto.age,
            gender: dto.gender,
          },
          create: {
            userId: id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            description: dto.description,
            avatar: dto.avatar,
            profileTheme: dto.profileTheme,
            age: dto.age,
            gender: dto.gender,
          },
        });
      }

      if (dto.interestIds) {
        await tx.userInterest.deleteMany({
          where: { userId: id },
        });

        if (dto.interestIds.length > 0) {
          await tx.userInterest.createMany({
            data: dto.interestIds.map((interestId) => ({
              userId: id,
              interestId,
            })),
          });
        }
      }

      const updatedUser = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          accountStatus: true,
          createdAt: true,

          authMethods: {
            where: {
              provider: AuthProvider.LOCAL,
            },
            take: 1,
            select: {
              email: true,
              login: true,
            },
          },

          data: {
            select: {
              firstName: true,
              lastName: true,
              description: true,
              avatar: true,
              profileTheme: true,
              age: true,
              gender: true,
            },
          },

          userInterests: {
            select: {
              interest: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!updatedUser) {
        throw new NotFoundException('User not found after update');
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

        interests: updatedUser.userInterests.map((ui) => ui.interest),
      };
    });
  }

  // delete
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          accountStatus: AccountStatus.DELETED,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
      }
      throw e;
    }
  }

  // set interest
  async setUserInterests(userId: string, interestIds: string[]): Promise<{ success: true }> {
    const userExists = await this.prisma.user.findFirst({
      where: {
        id: userId,
        accountStatus: {
          not: AccountStatus.DELETED,
        },
      },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    if (interestIds.length === 0) {
      await this.prisma.userInterest.deleteMany({
        where: { userId },
      });

      return { success: true };
    }

    const validCount = await this.prisma.interest.count({
      where: {
        id: {
          in: interestIds,
        },
      },
    });

    if (validCount !== interestIds.length) {
      throw new NotFoundException('One or more interests not found');
    }

    await this.prisma.$transaction([
      this.prisma.userInterest.deleteMany({
        where: { userId },
      }),
      this.prisma.userInterest.createMany({
        data: interestIds.map((interestId) => ({
          userId,
          interestId,
        })),
      }),
    ]);

    return { success: true };
  }
}
