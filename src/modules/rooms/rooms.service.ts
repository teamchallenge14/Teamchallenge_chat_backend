import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountStatus, Prisma, RoomLanguage } from '@prisma/client';
import { CreateRoomDto } from './dto/create-room.dto';
import { GetRoomsQueryDto, SortOrder } from './dto/get-rooms.query.dto';
import { CreatedRoomDto, PaginatedRoomsDto, RoomDetailsDto } from './dto/responses';
import { RoomsRepository } from './repository/rooms.repository';
import { CloudinaryService } from '@src/infra/cloudinary/cloudinary.service';
import { MediaCreateInput, UploadResult } from './types';
import { ReportRoomDto } from './dto/report-room.dto';
import { MailService } from '@src/modules/mail/mail.service';
import { MailType } from '@src/modules/mail/mail.types';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private readonly roomsRepository: RoomsRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService,
  ) {}

  async create(
    userId: string | undefined,
    dto: CreateRoomDto,
    file: Express.Multer.File | undefined,
  ): Promise<CreatedRoomDto> {
    const { ensuredUserId, minAge, maxAge, languages, interestIds } =
      await this.validateCreateInput(userId, dto);

    this.logger.log(`Room creation started: userId=${ensuredUserId}, name="${dto.name}"`);

    try {
      const uploadResult = await this.uploadRoomPhoto(file);
      const mediaData = this.buildMediaData(file, uploadResult);

      const created = await this.roomsRepository.createRoomWithRelations({
        userId: ensuredUserId,
        dto,
        minAge,
        maxAge,
        languages,
        interestIds,
        photoUrl: uploadResult?.secure_url ?? null,
        media: mediaData,
      });

      this.logger.log(`Room created: roomId=${created.id}, ownerId=${created.ownerId}`);

      return {
        id: created.id,
        name: created.name,
        type: created.type,
        status: created.status,
        minAge: created.minAge,
        maxAge: created.maxAge,
        languages: created.languages,
        interests: created.interests.map((ri) => ri.interest),
        media: created.media,
        createdAt: created.createdAt,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.warn(`Room creation prisma error: code=${error.code}, userId=${userId}`);

        if (error.code === 'P2002') {
          throw new ConflictException('Room already exists');
        }

        if (error.code === 'P2003') {
          throw new NotFoundException('User or interest not found');
        }
      }

      this.logger.error(
        `Room creation failed: userId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  private async validateCreateInput(userId: string | undefined, dto: CreateRoomDto) {
    if (!userId) {
      this.logger.warn('Room creation attempt without authentication');
      throw new UnauthorizedException('User is not authenticated');
    }

    const user = await this.roomsRepository.findUserAccountStatus(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('User is not allowed to create rooms');
    }

    const minAge = dto.minAge ?? 12;
    const maxAge = dto.maxAge ?? 100;

    if (minAge > maxAge) {
      throw new BadRequestException('minAge cannot be greater than maxAge');
    }

    const languages: RoomLanguage[] = [...new Set(dto.languages)];
    const interestIds = [...new Set(dto.interestIds ?? [])];

    if (interestIds.length > 0) {
      const count = await this.roomsRepository.countInterestsByIds(interestIds);

      if (count !== interestIds.length) {
        throw new NotFoundException('One or more interests not found');
      }
    }

    return {
      ensuredUserId: userId,
      minAge,
      maxAge,
      languages,
      interestIds,
    };
  }

  private async uploadRoomPhoto(
    file: Express.Multer.File | undefined,
  ): Promise<UploadResult | null> {
    if (!file) return null;
    return this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'rooms/photos',
      resource_type: 'image',
    });
  }

  private buildMediaData(
    file: Express.Multer.File | undefined,
    uploadResult: UploadResult | null,
  ): MediaCreateInput[] {
    if (!file || !uploadResult) return [];

    return [
      {
        originalName: file.originalname,
        resourceType: uploadResult.resource_type,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
      },
    ];
  }

  private async getMemberRoomOrThrow(userId: string, roomId: string) {
    const room = await this.roomsRepository.findRoomWithMembers(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isMember = room.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenException('User is not a room member');
    }

    return room;
  }

  async findOne(userId: string, roomId: string): Promise<RoomDetailsDto> {
    const room = await this.getMemberRoomOrThrow(userId, roomId);

    return {
      id: room.id,
      name: room.name,
      type: room.type,
      status: room.status,
      minAge: room.minAge,
      maxAge: room.maxAge,
      languages: room.languages,
      interests: room.interests.map((ri) => ri.interest),
      media: room.media,
      createdAt: room.createdAt,
      members: room.members.map((member) => ({
        firstName: member.user.data?.firstName ?? undefined,
        lastName: member.user.data?.lastName ?? undefined,
        avatar: member.user.data?.avatar ?? undefined,
        age: calculateAge(member.user.data?.birthDate),
        gender: member.user.data?.gender ?? undefined,
        role: member.role,
      })),
    };
  }

  async findAll(userId: string, query: GetRoomsQueryDto): Promise<PaginatedRoomsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.RoomOrderByWithRelationInput[] = [];
    const pushOrderBy = (value?: Prisma.RoomOrderByWithRelationInput) => {
      if (value) {
        orderBy.push(value);
      }
    };

    pushOrderBy(query.membersCount ? { members: { _count: query.membersCount } } : undefined);
    if (!orderBy.length) {
      orderBy.push({ members: { _count: SortOrder.desc } });
    }

    const { rooms, total } = await this.roomsRepository.findAllPaginated({
      userId,
      skip,
      take: limit,
      orderBy,
    });

    return {
      items: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        status: room.status,
        minAge: room.minAge,
        maxAge: room.maxAge,
        languages: room.languages,
        photoUrl: room.photoUrl ?? undefined,
        membersCount: room._count.members,
        members: room.members.map((member) => ({
          firstName: member.user.data?.firstName ?? undefined,
          lastName: member.user.data?.lastName ?? undefined,
          avatar: member.user.data?.avatar ?? undefined,
          role: member.role,
        })),
        createdAt: room.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reportRoom(userId: string, roomId: string, dto: ReportRoomDto): Promise<{ success: true }> {
    this.logger.log(`Room report started: roomId=${roomId}, reporterId=${userId}`);

    try {
      const room = await this.getMemberRoomOrThrow(userId, roomId);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentReports = await this.roomsRepository.countReportsByUserSince(userId, oneHourAgo);

      if (recentReports >= 3) {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }

      const userEmail = await this.roomsRepository.findUserEmail(userId);

      if (!userEmail?.email) {
        throw new BadRequestException('User email not found');
      }

      const reason = dto.reason.trim();
      const trimmedDetails = dto.details?.trim();
      const details = trimmedDetails ? trimmedDetails : undefined;

      const basePayload = {
        roomId,
        reason,
        details,
      };

      const reportPayload = {
        ...basePayload,
        reporterId: userId,
      };

      const mailPayload = {
        ...basePayload,
        email: userEmail.email,
        roomName: room.name,
        roomOwnerId: room.ownerId,
      };

      await this.roomsRepository.createRoomReport(reportPayload);
      await this.mailService.send(MailType.ROOM_REPORT, mailPayload);

      this.logger.log(`Room report completed: roomId=${room.id}, reporterId=${userId}`);

      return { success: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.warn(
          `Room report prisma error: code=${error.code}, roomId=${roomId}, reporterId=${userId}`,
        );

        if (error.code === 'P2003') {
          throw new NotFoundException('Room or reporter not found');
        }
      }

      if (error instanceof HttpException) {
        this.logger.warn(
          `Room report failed: roomId=${roomId}, reporterId=${userId}, status=${error.getStatus()}`,
        );
        throw error;
      }

      this.logger.error(
        `Room report failed: roomId=${roomId}, reporterId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }
  async joinRoom(roomId: string, userId: string) {
    const room = await this.roomsRepository.findRoomById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    const existingMember = await this.roomsRepository.isMember(roomId, userId);
    if (existingMember) throw new BadRequestException('Already a member');

    if (room.type === 'PUBLIC') {
      return this.roomsRepository.createMember(roomId, userId);
    }

    return this.roomsRepository.createJoinRequest(roomId, userId);
  }

  async approveRequest(requestId: string, ownerId: string, action: string) {
    const request = await this.roomsRepository.findJoinRequestById(requestId);
    if (!request) throw new NotFoundException('Request not found');

    const room = await this.roomsRepository.findRoomById(request.roomId);
    if (room?.ownerId !== ownerId) throw new ForbiddenException('Not room owner');

    if (action === 'APPROVE') {
      await this.roomsRepository.createMember(request.roomId, request.userId);
      return this.roomsRepository.updateJoinRequest(requestId, 'APPROVED');
    }

    return this.roomsRepository.updateJoinRequest(requestId, 'REJECTED');
  }

  async leaveRoom(roomId: string, userId: string) {
    const member = await this.roomsRepository.isMember(roomId, userId);
    if (!member) throw new BadRequestException('Not a member');

    return this.roomsRepository.removeMember(roomId, userId);
  }
}

function calculateAge(birthDate?: Date | null): number | undefined {
  if (!birthDate) return undefined;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
