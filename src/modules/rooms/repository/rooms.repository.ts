import { PrismaService } from '@db/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  RoomLanguage,
  RoomMemberRole,
  RoomStatus,
  RoomType,
  InterestCategory,
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
}
