import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountStatus, Prisma, RoomLanguage } from '@prisma/client';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatedRoomDto, RoomDetailsDto } from './dto/responses';
import { RoomsRepository } from './repository/rooms.repository';
import { CloudinaryService } from '@src/infra/cloudinary/cloudinary.service';
import { MediaCreateInput, UploadResult } from './types';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private readonly roomsRepository: RoomsRepository,
    private readonly cloudinaryService: CloudinaryService,
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

  async findOne(userId: string | undefined, roomId: string): Promise<RoomDetailsDto> {
    if (!userId) {
      this.logger.warn('Room fetch attempt without authentication');
      throw new UnauthorizedException('User is not authenticated');
    }

    const user = await this.roomsRepository.findUserAccountStatus(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('User is not allowed to access rooms');
    }

    const room = await this.roomsRepository.findRoomWithMembers(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isMember = room.members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new ForbiddenException('User is not a room member');
    }

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
