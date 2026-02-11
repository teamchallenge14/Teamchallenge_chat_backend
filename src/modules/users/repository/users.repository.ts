import { PrismaService } from '@db/prisma.service';
import { Injectable } from '@nestjs/common';
import { AuthProvider, AccountStatus, Gender, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(params: {
    email: string;
    login: string;
    passwordHash: string;
    data: {
      firstName?: string;
      lastName?: string;
      description?: string;
      avatar?: string;
      profileTheme?: string;
      birthDate?: Date;
      gender?: Gender;
    };
  }) {
    return this.prisma.user.create({
      data: {
        accountStatus: AccountStatus.ACTIVE,
        authMethods: {
          create: {
            provider: AuthProvider.LOCAL,
            login: params.login,
            providerId: params.email,
            email: params.email,
            passwordHash: params.passwordHash,
          },
        },
        data: {
          create: {
            ...params.data,
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
            birthDate: true,
            gender: true,
            updatedAt: true,
          },
        },
        authMethods: {
          where: { provider: AuthProvider.LOCAL },
          take: 1,
          select: {
            email: true,
            login: true,
            provider: true,
          },
        },
      },
    });
  }

  // find all paginated
  async findAllPaginated(params: { skip: number; take: number }) {
    const { skip, take } = params;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        where: {
          accountStatus: {
            not: AccountStatus.DELETED,
          },
        },
        select: {
          id: true,
          createdAt: true,
          authMethods: {
            where: { provider: AuthProvider.LOCAL },
            take: 1,
            select: {
              email: true,
              login: true,
              provider: true,
            },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          accountStatus: {
            not: AccountStatus.DELETED,
          },
        },
      }),
    ]);

    return { users, total };
  }

  //   find one
  async findOne(params: { id?: string; login?: string; email?: string }) {
    const { id, login, email } = params;

    return this.prisma.user.findFirst({
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
          where: { provider: AuthProvider.LOCAL },
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
            birthDate: true,
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
  }

  //   update
  async updateUser(
    id: string,
    params: {
      authData?: {
        login?: string;
        email?: string;
        passwordHash?: string;
      };
      profileData?: {
        firstName?: string;
        lastName?: string;
        description?: string;
        avatar?: string;
        profileTheme?: string;
        birthDate?: Date;
        gender?: Gender;
      };
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const exists = await tx.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!exists) {
        return null;
      }

      if (params.authData && Object.keys(params.authData).length > 0) {
        await tx.authMethod.upsert({
          where: {
            userId_provider: {
              userId: id,
              provider: AuthProvider.LOCAL,
            },
          },
          update: params.authData,
          create: {
            userId: id,
            provider: AuthProvider.LOCAL,
            providerId: params.authData.email ?? params.authData.login ?? id,
            ...params.authData,
          },
        });
      }

      if (params.profileData && Object.keys(params.profileData).length > 0) {
        await tx.userData.upsert({
          where: { userId: id },
          update: params.profileData,
          create: {
            userId: id,
            ...params.profileData,
          },
        });
      }

      return tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          accountStatus: true,
          createdAt: true,

          authMethods: {
            where: { provider: AuthProvider.LOCAL },
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
              birthDate: true,
              gender: true,
            },
          },
        },
      });
    });
  }

  //   soft delete
  async softDelete(id: string): Promise<number> {
    const result = await this.prisma.user.updateMany({
      where: {
        id,
        accountStatus: { not: AccountStatus.DELETED },
      },
      data: {
        accountStatus: AccountStatus.DELETED,
      },
    });

    return result.count;
  }

  async getUserAccountStatus(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountStatus: true },
    });
  }

  async countExistingInterests(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    return this.prisma.interest.count({
      where: { id: { in: ids } },
    });
  }

  async replaceUserInterests(userId: string, interestIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userInterest.deleteMany({
        where: { userId },
      });

      if (interestIds.length > 0) {
        await tx.userInterest.createMany({
          data: interestIds.map((interestId) => ({
            userId,
            interestId,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  async updateUserInterests(
    userId: string,
    params: { add: string[]; remove: string[] },
  ): Promise<void> {
    const { add, remove } = params;

    await this.prisma.$transaction([
      ...(add.length
        ? [
            this.prisma.userInterest.createMany({
              data: add.map((interestId) => ({
                userId,
                interestId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),

      ...(remove.length
        ? [
            this.prisma.userInterest.deleteMany({
              where: {
                userId,
                interestId: { in: remove },
              },
            }),
          ]
        : []),
    ]);
  }
}
