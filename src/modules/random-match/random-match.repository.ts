import { PrismaService } from '@db/prisma.service';
import { Injectable } from '@nestjs/common';
import { AccountStatus, Gender, Prisma, RoomLanguage } from '@prisma/client';

export interface RandomMatchFilters {
  genders?: Gender[];
  languages?: RoomLanguage[];
  interestIds?: string[];
  birthDateMin?: Date;
  birthDateMax?: Date;
}

@Injectable()
export class RandomMatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserForMatch(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountStatus: true,
        data: {
          select: {
            language: true,
          },
        },
        userInterests: {
          select: {
            interestId: true,
          },
        },
      },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.randomMatchPreference.findUnique({
      where: { userId },
      select: {
        minAge: true,
        maxAge: true,
        genders: true,
        languages: true,
        interests: {
          select: { interestId: true },
        },
      },
    });
  }

  async countInterestsByIds(ids: string[]): Promise<number> {
    if (!ids.length) return 0;

    return this.prisma.interest.count({
      where: { id: { in: ids } },
    });
  }

  async upsertPreferences(params: {
    userId: string;
    minAge?: number;
    maxAge?: number;
    genders: Gender[];
    languages: RoomLanguage[];
    interestIds: string[];
  }) {
    const { userId, minAge, maxAge, genders, languages, interestIds } = params;

    await this.prisma.$transaction(async (tx) => {
      const preference = await tx.randomMatchPreference.upsert({
        where: { userId },
        update: {
          minAge: minAge ?? null,
          maxAge: maxAge ?? null,
          genders,
          languages,
        },
        create: {
          userId,
          minAge: minAge ?? null,
          maxAge: maxAge ?? null,
          genders,
          languages,
        },
        select: { id: true },
      });

      await tx.randomMatchPreferenceInterest.deleteMany({
        where: { preferenceId: preference.id },
      });

      if (interestIds.length) {
        await tx.randomMatchPreferenceInterest.createMany({
          data: interestIds.map((interestId) => ({
            preferenceId: preference.id,
            interestId,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  async findRandomMatch(params: { userId: string; tenantId: string; filters: RandomMatchFilters }) {
    const { userId, tenantId, filters } = params;

    const dataWhere: Prisma.UserDataWhereInput = {};

    if (filters.genders?.length) {
      dataWhere.gender = { in: filters.genders };
    }

    if (filters.languages?.length) {
      dataWhere.language = { in: filters.languages };
    }

    if (filters.birthDateMin || filters.birthDateMax) {
      dataWhere.birthDate = {
        ...(filters.birthDateMin ? { gte: filters.birthDateMin } : {}),
        ...(filters.birthDateMax ? { lte: filters.birthDateMax } : {}),
      };
    }

    const where: Prisma.UserWhereInput = {
      id: { not: userId },
      accountStatus: AccountStatus.ACTIVE,
      tenants: {
        some: {
          tenantId,
          tenantStatus: AccountStatus.ACTIVE,
        },
      },
      ...(Object.keys(dataWhere).length ? { data: { is: dataWhere } } : {}),
      ...(filters.interestIds?.length
        ? {
            userInterests: {
              some: {
                interestId: { in: filters.interestIds },
              },
            },
          }
        : {}),
    };

    const total = await this.prisma.user.count({ where });
    if (!total) return null;

    const skip = Math.floor(Math.random() * total);

    const [match] = await this.prisma.user.findMany({
      where,
      skip,
      take: 1,
      select: {
        id: true,
        data: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
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

    return match ?? null;
  }
}
