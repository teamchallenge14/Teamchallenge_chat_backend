import { PrismaService } from '@db/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  InterestCategory,
  JoinRequestStatus,
  Prisma,
  RoomLanguage,
  RoomMemberRole,
  RoomStatus,
  RoomType,
} from '@prisma/client';
import { CreateRoomDto } from '../dto/create-room.dto';

@Injectable()
export class RoomsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserAccountStatus(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountStatus: true },
    });
  }

  async countInterestsByIds(interestIds: string[]) {
    return this.prisma.interest.count({
      where: { id: { in: interestIds } },
    });
  }

  async createRoomWithRelations(params: {
    userId: string;
    dto: CreateRoomDto;
    minAge: number;
    maxAge: number;
    languages: RoomLanguage[];
    interestIds: string[];
    photoUrl?: string | null;
    media?: {
      originalName?: string | null;
      resourceType: string;
      format: string;
      bytes: number;
      publicId: string;
      url: string;
      secureUrl: string;
    }[];
  }) {
    const { userId, dto, minAge, maxAge, languages, interestIds, photoUrl, media } = params;

    const result = await this.prisma.room.create({
      data: {
        name: dto.name.trim(),
        type: dto.type,
        status: RoomStatus.ACTIVE,
        minAge,
        maxAge,
        languages,
        ownerId: userId,
        photoUrl: photoUrl ?? undefined,
        members: {
          create: {
            userId,
            role: RoomMemberRole.OWNER,
          },
        },
        interests: interestIds.length
          ? {
              create: interestIds.map((interestId) => ({
                interestId,
              })),
            }
          : undefined,
        media: media?.length
          ? {
              create: media,
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        minAge: true,
        maxAge: true,
        languages: true,
        ownerId: true,
        createdAt: true,
        interests: {
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
        media: {
          select: {
            id: true,
            originalName: true,
            resourceType: true,
            format: true,
            bytes: true,
            publicId: true,
            url: true,
            secureUrl: true,
            createdAt: true,
          },
        },
      },
    });

    return result as {
      id: string;
      name: string;
      type: RoomType;
      status: RoomStatus;
      minAge: number;
      maxAge: number;
      languages: RoomLanguage[];
      ownerId: string;
      createdAt: Date;
      interests: {
        interest: {
          id: string;
          name: string;
          category: InterestCategory;
        };
      }[];
      media: {
        id: string;
        originalName: string | null;
        resourceType: string;
        format: string;
        bytes: number;
        publicId: string;
        url: string;
        secureUrl: string;
        createdAt: Date;
      }[];
    };
  }

  async findRoomWithMembers(roomId: string) {
    return this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        minAge: true,
        maxAge: true,
        languages: true,
        ownerId: true,
        createdAt: true,
        interests: {
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
        media: {
          select: {
            id: true,
            originalName: true,
            resourceType: true,
            format: true,
            bytes: true,
            publicId: true,
            url: true,
            secureUrl: true,
            createdAt: true,
          },
        },
        members: {
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                data: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    birthDate: true,
                    gender: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async countReportsByUserSince(userId: string, since: Date) {
    return this.prisma.roomReport.count({
      where: {
        reporterId: userId,
        createdAt: { gte: since },
      },
    });
  }

  async createRoomReport(params: {
    roomId: string;
    reporterId: string;
    reason: string;
    details?: string;
  }) {
    return this.prisma.roomReport.create({
      data: {
        roomId: params.roomId,
        reporterId: params.reporterId,
        reason: params.reason,
        details: params.details,
      },
    });
  }

  async findUserEmail(userId: string) {
    return this.prisma.authMethod.findFirst({
      where: {
        userId,
        email: { not: null },
      },
      select: { email: true },
    });
  }

  async findAllPaginated(params: {
    userId: string;
    skip: number;
    take: number;
    orderBy: Prisma.RoomOrderByWithRelationInput | Prisma.RoomOrderByWithRelationInput[];
  }) {
    const { userId, skip, take, orderBy } = params;
    const where = {
      members: {
        some: {
          userId,
        },
      },
    };

    const [rooms, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          minAge: true,
          maxAge: true,
          languages: true,
          photoUrl: true,
          createdAt: true,
          members: {
            select: {
              role: true,
              user: {
                select: {
                  data: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    return { rooms, total };
  }

  async findRoomById(roomId: string) {
    return this.prisma.room.findUnique({
      where: { id: roomId },
    });
  }

  async isMember(roomId: string, userId: string) {
    return this.prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
    });
  }

  async createMember(roomId: string, userId: string) {
    return this.prisma.roomMember.create({
      data: {
        roomId,
        userId,
      },
    });
  }

  async removeMember(roomId: string, userId: string) {
    return this.prisma.roomMember.delete({
      where: {
        roomId_userId: { roomId, userId },
      },
    });
  }

  async createJoinRequest(roomId: string, userId: string) {
    return this.prisma.roomJoinRequest.create({
      data: {
        roomId,
        userId,
      },
    });
  }

  async findJoinRequestById(id: string) {
    return this.prisma.roomJoinRequest.findUnique({
      where: { id },
    });
  }

  async updateJoinRequest(id: string, status: JoinRequestStatus) {
    return this.prisma.roomJoinRequest.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });
  }

  async getAdmins(roomId: string): Promise<string[]> {
    const admins = await this.prisma.roomMember.findMany({
      where: {
        roomId,
        role: { in: [RoomMemberRole.ADMIN, RoomMemberRole.OWNER] },
      },
      select: { userId: true },
    });

    return admins.map((a) => a.userId);
  }
}
