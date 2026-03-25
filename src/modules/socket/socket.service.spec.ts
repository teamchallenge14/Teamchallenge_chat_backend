/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { RedisService } from '@src/infra/redis/redis.service';
import { RoomsService } from '@src/modules/rooms/rooms.service';
import { SocketService } from './socket.service';
import { type AuthenticatedSocket, type SocketAck } from './socket.types';

describe('SocketService', () => {
  let service: SocketService;
  let roomsService: { joinPublicRoom: jest.Mock; create: jest.Mock };
  let redisClient: {
    sadd: jest.Mock;
    srem: jest.Mock;
    smembers: jest.Mock;
  };

  beforeEach(async () => {
    redisClient = {
      sadd: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketService,
        {
          provide: RoomsService,
          useValue: {
            joinPublicRoom: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue(redisClient),
          },
        },
      ],
    }).compile();

    service = module.get(SocketService);
    roomsService = module.get(RoomsService);
  });

  const buildClient = (userId = 'user-id') => {
    const emitToRoom = jest.fn();
    const client = {
      userId,
      join: jest.fn().mockResolvedValue(undefined),
      to: jest.fn().mockReturnValue({ emit: emitToRoom }),
      emit: jest.fn(),
    } as unknown as AuthenticatedSocket;

    return { client, emitToRoom };
  };

  it('handles room:join success', async () => {
    const { client, emitToRoom } = buildClient();
    const ack = jest.fn<ReturnType<SocketAck>, Parameters<SocketAck>>();
    const joinedAt = new Date('2026-03-25T14:00:00.000Z');
    const roomId = '550e8400-e29b-41d4-a716-446655440000';

    roomsService.joinPublicRoom.mockResolvedValue({
      roomId,
      userId: 'user-id',
      role: 'MEMBER',
      joinedAt,
    });

    await service.handleJoinRoom(client, { roomId }, ack);

    expect(roomsService.joinPublicRoom).toHaveBeenCalledWith(roomId, 'user-id');
    expect(client.join as jest.Mock).toHaveBeenCalledWith(`room:${roomId}`);
    expect(redisClient.sadd).toHaveBeenNthCalledWith(1, 'userRooms:user-id', roomId);
    expect(redisClient.sadd).toHaveBeenNthCalledWith(2, `roomUsers:${roomId}`, 'user-id');
    expect(client.emit as jest.Mock).toHaveBeenCalledWith(
      'room:joined',
      expect.objectContaining({ roomId, userId: 'user-id' }),
    );
    expect(emitToRoom).toHaveBeenCalledWith(
      'room:user_joined',
      expect.objectContaining({ roomId, userId: 'user-id' }),
    );
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
      }),
    );
  });

  it('handles room:create success and auto-joins owner socket to room channel', async () => {
    const { client } = buildClient();
    const ack = jest.fn<ReturnType<SocketAck>, Parameters<SocketAck>>();
    const roomId = '550e8400-e29b-41d4-a716-446655440000';

    roomsService.create.mockResolvedValue({
      id: roomId,
      name: 'New Room',
      type: 'PUBLIC',
      status: 'ACTIVE',
      minAge: 12,
      maxAge: 100,
      languages: ['EN'],
      interests: [],
      media: [],
      createdAt: new Date('2026-03-25T14:00:00.000Z'),
    });

    await service.handleCreateRoom(
      client,
      {
        name: 'New Room',
        type: 'PUBLIC',
        languages: ['EN'],
      } as any,
      ack,
    );

    expect(roomsService.create).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({
        name: 'New Room',
        type: 'PUBLIC',
      }),
      undefined,
    );
    expect(client.join as jest.Mock).toHaveBeenCalledWith(`room:${roomId}`);
    expect(redisClient.sadd).toHaveBeenNthCalledWith(1, 'userRooms:user-id', roomId);
    expect(redisClient.sadd).toHaveBeenNthCalledWith(2, `roomUsers:${roomId}`, 'user-id');
    expect(client.emit as jest.Mock).toHaveBeenCalledWith(
      'room:created',
      expect.objectContaining({ id: roomId, name: 'New Room' }),
    );
    expect(client.emit as jest.Mock).toHaveBeenCalledWith(
      'room:joined',
      expect.objectContaining({
        roomId,
        userId: 'user-id',
        role: 'OWNER',
      }),
    );
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
      }),
    );
  });

  it('maps room:create domain conflict to socket conflict', async () => {
    const { client } = buildClient();
    const ack = jest.fn<ReturnType<SocketAck>, Parameters<SocketAck>>();

    roomsService.create.mockRejectedValue(new ConflictException('Room already exists'));

    await service.handleCreateRoom(
      client,
      {
        name: 'New Room',
        type: 'PUBLIC',
        languages: ['EN'],
      } as any,
      ack,
    );

    expect(client.emit as jest.Mock).toHaveBeenCalledWith(
      'ws:error',
      expect.objectContaining({ code: 'CONFLICT' }),
    );
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Room already exists',
      }),
    );
  });

  it('returns bad request for invalid room:create payload', async () => {
    const { client } = buildClient();
    const ack = jest.fn<ReturnType<SocketAck>, Parameters<SocketAck>>();

    await service.handleCreateRoom(client, {} as any, ack);

    expect(roomsService.create).not.toHaveBeenCalled();
    expect(client.emit as jest.Mock).toHaveBeenCalledWith(
      'ws:error',
      expect.objectContaining({ code: 'BAD_REQUEST' }),
    );
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Invalid room:create payload',
      }),
    );
  });

  it('returns bad request for invalid roomId', async () => {
    const { client } = buildClient();
    const ack = jest.fn<ReturnType<SocketAck>, Parameters<SocketAck>>();

    await service.handleJoinRoom(client, { roomId: 'not-uuid' }, ack);

    expect(roomsService.joinPublicRoom).not.toHaveBeenCalled();
    expect(client.emit as jest.Mock).toHaveBeenCalledWith(
      'ws:error',
      expect.objectContaining({ code: 'BAD_REQUEST' }),
    );
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'roomId must be a valid UUID',
      }),
    );
  });

  it('maps domain conflict to socket conflict', async () => {
    const { client } = buildClient();
    const ack = jest.fn<ReturnType<SocketAck>, Parameters<SocketAck>>();
    const roomId = '550e8400-e29b-41d4-a716-446655440000';

    roomsService.joinPublicRoom.mockRejectedValue(new ConflictException('Already a member'));

    await service.handleJoinRoom(client, { roomId }, ack);

    expect(client.emit as jest.Mock).toHaveBeenCalledWith(
      'ws:error',
      expect.objectContaining({ code: 'CONFLICT' }),
    );
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Already a member',
      }),
    );
  });

  it('rejoins persisted rooms on reconnect', async () => {
    const { client } = buildClient();
    redisClient.smembers.mockResolvedValue(['room-1', 'room-2']);

    await service.rejoinUserRooms(client, 'user-id');

    expect(client.join as jest.Mock).toHaveBeenCalledWith('room:room-1');
    expect(client.join as jest.Mock).toHaveBeenCalledWith('room:room-2');
  });
});
