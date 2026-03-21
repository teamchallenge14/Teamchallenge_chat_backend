/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  AccountStatus,
  Gender,
  InterestCategory,
  RoomLanguage,
  RoomMemberRole,
  RoomStatus,
  RoomType,
  Prisma,
} from '@prisma/client';
import { CloudinaryService } from '@src/infra/cloudinary/cloudinary.service';
import { type CreateRoomDto } from './dto/create-room.dto';
import { SortOrder } from './dto/get-rooms.query.dto';
import { RoomsRepository } from './repository/rooms.repository';
import { RoomsService } from './rooms.service';
import { MailService } from '@src/modules/mail/mail.service';
import { SocketService } from '@src/modules/socket/socket.service';

type RoomsRepositoryMock = {
  createRoomWithRelations: jest.Mock;
  countInterestsByIds: jest.Mock;
  findAllPaginated: jest.Mock;
  findUserAccountStatus: jest.Mock;
  findRoomWithMembers: jest.Mock;
  countReportsByUserSince: jest.Mock;
  createRoomReport: jest.Mock;
  findUserEmail: jest.Mock;
};

type CloudinaryServiceMock = {
  uploadBuffer: jest.Mock;
};

type MailServiceMock = {
  send: jest.Mock;
};

const baseDto: CreateRoomDto = {
  name: 'Gaming Night',
  type: RoomType.PUBLIC,
  languages: [RoomLanguage.EN, RoomLanguage.EN],
  interestIds: ['interest-1', 'interest-2', 'interest-2'],
};

const buildCreatedRoom = () => ({
  id: 'room-id',
  name: 'Gaming Night',
  type: RoomType.PUBLIC,
  status: RoomStatus.ACTIVE,
  minAge: 12,
  maxAge: 100,
  languages: [RoomLanguage.EN],
  ownerId: 'user-id',
  createdAt: new Date('2026-02-01T10:00:00.000Z'),
  interests: [
    {
      interest: {
        id: 'interest-1',
        name: 'Chess',
        category: InterestCategory.OTHER,
      },
    },
  ],
  media: [],
});

const buildRoom = (members: Array<{ userId: string }>) =>
  ({
    id: 'room-id',
    name: 'Room',
    type: RoomType.PUBLIC,
    status: RoomStatus.ACTIVE,
    minAge: 12,
    maxAge: 100,
    languages: [RoomLanguage.EN],
    ownerId: 'owner-id',
    createdAt: new Date('2026-02-01T10:00:00.000Z'),
    interests: [],
    media: [],
    members: members.map((member) => ({
      userId: member.userId,
      role: RoomMemberRole.MEMBER,
      user: {
        data: {},
      },
    })),
  }) as any;

const buildPrismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('error', {
    code,
    clientVersion: '0.0.0',
  });

describe('RoomsService', () => {
  let service: RoomsService;
  let roomsRepository: RoomsRepositoryMock;
  let cloudinaryService: CloudinaryServiceMock;
  let mailService: MailServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: RoomsRepository,
          useValue: {
            createRoomWithRelations: jest.fn(),
            countInterestsByIds: jest.fn(),
            findAllPaginated: jest.fn(),
            findUserAccountStatus: jest.fn(),
            findRoomWithMembers: jest.fn(),
            countReportsByUserSince: jest.fn(),
            createRoomReport: jest.fn(),
            findUserEmail: jest.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadBuffer: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: SocketService,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    roomsRepository = module.get(RoomsRepository);
    cloudinaryService = module.get(CloudinaryService);
    mailService = module.get(MailService);
  });

  describe('create', () => {
    it('creates room without photo', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue({
        accountStatus: AccountStatus.ACTIVE,
      });
      roomsRepository.countInterestsByIds.mockResolvedValue(2);
      roomsRepository.createRoomWithRelations.mockResolvedValue(buildCreatedRoom());

      const result = await service.create('user-id', baseDto, undefined);

      expect(roomsRepository.countInterestsByIds).toHaveBeenCalledWith([
        'interest-1',
        'interest-2',
      ]);
      expect(roomsRepository.createRoomWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-id',
          minAge: 12,
          maxAge: 100,
          languages: [RoomLanguage.EN],
          interestIds: ['interest-1', 'interest-2'],
          photoUrl: null,
          media: [],
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'room-id',
          name: 'Gaming Night',
          status: RoomStatus.ACTIVE,
        }),
      );
      expect(cloudinaryService.uploadBuffer).not.toHaveBeenCalled();
    });

    it('creates room with photo and media', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue({
        accountStatus: AccountStatus.ACTIVE,
      });
      roomsRepository.countInterestsByIds.mockResolvedValue(2);
      roomsRepository.createRoomWithRelations.mockResolvedValue(buildCreatedRoom());
      cloudinaryService.uploadBuffer.mockResolvedValue({
        resource_type: 'image',
        format: 'png',
        bytes: 123,
        public_id: 'public-id',
        url: 'http://cdn/room.png',
        secure_url: 'https://cdn/room.png',
      } as any);

      const file = {
        originalname: 'room.png',
        buffer: Buffer.from('file'),
      } as Express.Multer.File;

      await service.create('user-id', baseDto, file);

      expect(cloudinaryService.uploadBuffer).toHaveBeenCalledWith(file.buffer, {
        folder: 'rooms/photos',
        resource_type: 'image',
      });
      expect(roomsRepository.createRoomWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          photoUrl: 'https://cdn/room.png',
          media: [
            expect.objectContaining({
              originalName: 'room.png',
              resourceType: 'image',
              format: 'png',
              bytes: 123,
              publicId: 'public-id',
              url: 'http://cdn/room.png',
              secureUrl: 'https://cdn/room.png',
            }),
          ],
        }),
      );
    });

    it('throws UnauthorizedException when userId is missing', async () => {
      await expect(service.create(undefined, baseDto, undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws NotFoundException when user is not found', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue(null);

      await expect(service.create('user-id', baseDto, undefined)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is blocked', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue({
        accountStatus: AccountStatus.BLOCKED,
      });

      await expect(service.create('user-id', baseDto, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when minAge is greater than maxAge', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue({
        accountStatus: AccountStatus.ACTIVE,
      });

      await expect(
        service.create(
          'user-id',
          {
            ...baseDto,
            minAge: 30,
            maxAge: 20,
          },
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when interests are missing', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue({
        accountStatus: AccountStatus.ACTIVE,
      });
      roomsRepository.countInterestsByIds.mockResolvedValue(0);

      await expect(service.create('user-id', baseDto, undefined)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('skips interests lookup when interestIds are not provided', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue({
        accountStatus: AccountStatus.ACTIVE,
      });
      roomsRepository.createRoomWithRelations.mockResolvedValue(buildCreatedRoom());

      const dto: CreateRoomDto = {
        name: baseDto.name,
        type: baseDto.type,
        languages: baseDto.languages,
      };

      await service.create('user-id', dto, undefined);

      expect(roomsRepository.countInterestsByIds).not.toHaveBeenCalled();
      expect(roomsRepository.createRoomWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          interestIds: [],
        }),
      );
    });

    it('throws ConflictException on unique constraint error', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue({
        accountStatus: AccountStatus.ACTIVE,
      });
      roomsRepository.countInterestsByIds.mockResolvedValue(2);
      roomsRepository.createRoomWithRelations.mockRejectedValue(buildPrismaError('P2002'));

      await expect(service.create('user-id', baseDto, undefined)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException on foreign key error', async () => {
      roomsRepository.findUserAccountStatus.mockResolvedValue({
        accountStatus: AccountStatus.ACTIVE,
      });
      roomsRepository.countInterestsByIds.mockResolvedValue(2);
      roomsRepository.createRoomWithRelations.mockRejectedValue(buildPrismaError('P2003'));

      await expect(service.create('user-id', baseDto, undefined)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('builds orderBy with membersCount when provided', async () => {
      roomsRepository.findAllPaginated.mockResolvedValue({ rooms: [], total: 0 });

      await service.findAll('user-id', {
        page: 1,
        limit: 10,
        membersCount: SortOrder.asc,
      });

      expect(roomsRepository.findAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ members: { _count: SortOrder.asc } }],
        }),
      );
    });

    it('defaults to membersCount desc when no sorting provided', async () => {
      roomsRepository.findAllPaginated.mockResolvedValue({ rooms: [], total: 0 });

      await service.findAll('user-id', { page: 1, limit: 10 });

      expect(roomsRepository.findAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ members: { _count: SortOrder.desc } }],
        }),
      );
    });

    it('passes pagination params to repository', async () => {
      roomsRepository.findAllPaginated.mockResolvedValue({ rooms: [], total: 0 });

      await service.findAll('user-id', { page: 2, limit: 5 });

      expect(roomsRepository.findAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-id',
          skip: 5,
          take: 5,
        }),
      );
    });

    it('maps members with minimal user data', async () => {
      roomsRepository.findAllPaginated.mockResolvedValue({
        rooms: [
          {
            id: 'room-id',
            name: 'Room',
            type: RoomType.PUBLIC,
            status: RoomStatus.ACTIVE,
            minAge: 12,
            maxAge: 100,
            languages: [RoomLanguage.EN],
            photoUrl: null,
            createdAt: new Date('2026-02-01T10:00:00.000Z'),
            _count: { members: 2 },
            members: [
              {
                role: RoomMemberRole.OWNER,
                user: { data: { firstName: 'Ada', lastName: 'Lovelace', avatar: 'a.png' } },
              },
              {
                role: RoomMemberRole.MEMBER,
                user: { data: { firstName: 'Alan', lastName: 'Turing', avatar: null } },
              },
            ],
          },
        ],
        total: 1,
      } as any);

      const result = await service.findAll('user-id', { page: 1, limit: 10 });

      expect(result.items[0].members).toEqual([
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          avatar: 'a.png',
          role: RoomMemberRole.OWNER,
        },
        {
          firstName: 'Alan',
          lastName: 'Turing',
          avatar: undefined,
          role: RoomMemberRole.MEMBER,
        },
      ]);
    });

    it('calculates totalPages from total and limit', async () => {
      roomsRepository.findAllPaginated.mockResolvedValue({ rooms: [], total: 11 });

      const result = await service.findAll('user-id', { page: 1, limit: 10 });

      expect(result.totalPages).toBe(2);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when room is not found', async () => {
      roomsRepository.findRoomWithMembers.mockResolvedValue(null);

      await expect(service.findOne('user-id', 'room-id')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not a member', async () => {
      roomsRepository.findRoomWithMembers.mockResolvedValue(buildRoom([{ userId: 'other-user' }]));

      await expect(service.findOne('user-id', 'room-id')).rejects.toThrow(ForbiddenException);
    });

    it('maps member details including age and gender', async () => {
      const now = new Date('2026-02-18T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      try {
        roomsRepository.findRoomWithMembers.mockResolvedValue({
          id: 'room-id',
          name: 'Room',
          type: RoomType.PUBLIC,
          status: RoomStatus.ACTIVE,
          minAge: 12,
          maxAge: 100,
          languages: [RoomLanguage.EN],
          interests: [],
          media: [],
          createdAt: new Date('2026-02-01T10:00:00.000Z'),
          members: [
            {
              userId: 'user-id',
              role: RoomMemberRole.MEMBER,
              user: {
                data: {
                  firstName: 'Ada',
                  lastName: 'Lovelace',
                  avatar: 'a.png',
                  birthDate: new Date('2006-02-18T00:00:00.000Z'),
                  gender: Gender.FEMALE,
                },
              },
            },
          ],
        } as any);

        const result = await service.findOne('user-id', 'room-id');

        expect(result.members).toEqual([
          {
            firstName: 'Ada',
            lastName: 'Lovelace',
            avatar: 'a.png',
            age: 20,
            gender: Gender.FEMALE,
            role: RoomMemberRole.MEMBER,
          },
        ]);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
