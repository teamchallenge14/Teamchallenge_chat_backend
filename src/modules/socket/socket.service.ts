import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RoomMemberRole } from '@prisma/client';
import { RedisService } from '@src/infra/redis/redis.service';
import type { CreateRoomInput } from '@src/modules/rooms/contracts/create-room.input';
import { RoomsService } from '@src/modules/rooms/rooms.service';
import { isUUID } from 'class-validator';
import { Server } from 'socket.io';
import { JoinRoomPayloadDto } from './dto/join-room.payload';
import { AuthenticatedSocket, SocketAck, SocketAckResponse } from './socket.types';

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);
  private server: Server;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly redisService: RedisService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  private userRoomsKey(userId: string) {
    return `userRooms:${userId}`;
  }

  private roomUsersKey(roomId: string) {
    return `roomUsers:${roomId}`;
  }

  private roomChannel(roomId: string) {
    return `room:${roomId}`;
  }

  private userNotificationsRoom(userId: string) {
    return `notifications:${userId}`;
  }

  private presenceRoom(userId: string) {
    return `presence:${userId}`;
  }

  private emit(room: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn(`Socket server is not initialized yet; skipped emit event=${event}`);
      return;
    }

    this.server.to(room).emit(event, data);
  }

  getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  joinUserRoom(client: any, userId: string) {
    client.join(this.getUserRoom(userId));
  }

  async rejoinUserRooms(client: AuthenticatedSocket, userId: string) {
    try {
      const roomIds = await this.redisService.getClient().smembers(this.userRoomsKey(userId));

      for (const roomId of roomIds) {
        await client.join(this.roomChannel(roomId));
      }
    } catch (error) {
      this.logger.warn(
        `Failed to restore room subscriptions for userId=${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async handleJoinRoom(
    client: AuthenticatedSocket,
    payload: JoinRoomPayloadDto,
    ack?: SocketAck,
  ): Promise<void> {
    const userId = client.userId;
    if (!userId) {
      this.emitRoomError(client, ack, 'UNAUTHORIZED', 'User is not authenticated');
      return;
    }

    const roomId = payload?.roomId;
    if (!roomId || !isUUID(roomId)) {
      this.emitRoomError(client, ack, 'BAD_REQUEST', 'roomId must be a valid UUID');
      return;
    }

    try {
      const member = await this.roomsService.joinPublicRoom(roomId, userId);
      await client.join(this.roomChannel(roomId));
      await this.persistRoomMembership(userId, roomId);

      const result = {
        roomId,
        userId,
        role: member.role,
        joinedAt: member.joinedAt,
      };

      client.emit('room:joined', result);
      client.to(this.roomChannel(roomId)).emit('room:user_joined', result);
      this.ackSuccess(ack, result);
    } catch (error) {
      const mappedError = this.mapSocketError(error);
      this.emitRoomError(client, ack, mappedError.code, mappedError.message);
    }
  }

  async handleCreateRoom(
    client: AuthenticatedSocket,
    payload: CreateRoomInput,
    ack?: SocketAck,
  ): Promise<void> {
    const userId = client.userId;
    if (!userId) {
      this.emitRoomError(client, ack, 'UNAUTHORIZED', 'User is not authenticated');
      return;
    }

    const hasRequiredPayload =
      typeof payload?.name === 'string' &&
      typeof payload?.type === 'string' &&
      Array.isArray(payload?.languages) &&
      payload.languages.length > 0;

    if (!hasRequiredPayload) {
      this.emitRoomError(client, ack, 'BAD_REQUEST', 'Invalid room:create payload');
      return;
    }

    try {
      const room = await this.roomsService.create(userId, payload, undefined);

      await client.join(this.roomChannel(room.id));
      await this.persistRoomMembership(userId, room.id);

      const joinedPayload = {
        roomId: room.id,
        userId,
        role: RoomMemberRole.OWNER,
        joinedAt: room.createdAt,
      };

      client.emit('room:created', room);
      client.emit('room:joined', joinedPayload);
      this.ackSuccess(ack, room);
    } catch (error) {
      const mappedError = this.mapSocketError(error);
      this.emitRoomError(client, ack, mappedError.code, mappedError.message);
    }
  }

  async persistRoomMembership(userId: string, roomId: string): Promise<void> {
    try {
      const redis = this.redisService.getClient();
      await redis.sadd(this.userRoomsKey(userId), roomId);
      await redis.sadd(this.roomUsersKey(roomId), userId);
    } catch (error) {
      this.logger.warn(
        `Failed to persist room membership in Redis: userId=${userId}, roomId=${roomId}, reason=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async removeRoomMembership(userId: string, roomId: string): Promise<void> {
    try {
      const redis = this.redisService.getClient();
      await redis.srem(this.userRoomsKey(userId), roomId);
      await redis.srem(this.roomUsersKey(roomId), userId);
    } catch (error) {
      this.logger.warn(
        `Failed to remove room membership from Redis: userId=${userId}, roomId=${roomId}, reason=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    this.emit(this.getUserRoom(userId), event, data);
  }

  // presence
  userOnline(userId: string) {
    this.emit(this.presenceRoom(userId), 'USER_ONLINE', { userId });
  }

  userOffline(userId: string, lastSeen: number) {
    this.emit(this.presenceRoom(userId), 'USER_OFFLINE', {
      userId,
      lastSeen,
    });
  }

  // Personal notification
  sendToUser(userId: string, payload: any) {
    this.emit(this.userNotificationsRoom(userId), 'NEW_NOTIFICATION', payload);
  }

  // global notification
  sendGlobal(payload: any) {
    this.emit('notifications:global', 'GLOBAL_NOTIFICATION', payload);
  }

  private emitRoomError(
    client: AuthenticatedSocket,
    ack: SocketAck | undefined,
    code: string,
    message: string,
  ) {
    client.emit('ws:error', { code, message });
    this.ackFailure(ack, message);
  }

  private ackSuccess(ack?: SocketAck, data?: unknown) {
    if (!ack) {
      return;
    }

    const response: SocketAckResponse =
      data === undefined
        ? {
            ok: true,
          }
        : {
            ok: true,
            data,
          };

    ack(response);
  }

  private ackFailure(ack?: SocketAck, message?: string) {
    if (!ack) {
      return;
    }

    ack({
      ok: false,
      message: message || 'Failed to perform action',
    });
  }

  private mapSocketError(error: unknown): { code: string; message: string } {
    if (error instanceof UnauthorizedException) {
      return { code: 'UNAUTHORIZED', message: this.getHttpExceptionMessage(error) };
    }

    if (error instanceof ForbiddenException) {
      return { code: 'FORBIDDEN', message: this.getHttpExceptionMessage(error) };
    }

    if (error instanceof NotFoundException) {
      return { code: 'NOT_FOUND', message: this.getHttpExceptionMessage(error) };
    }

    if (error instanceof ConflictException) {
      return { code: 'CONFLICT', message: this.getHttpExceptionMessage(error) };
    }

    if (error instanceof BadRequestException) {
      return { code: 'BAD_REQUEST', message: this.getHttpExceptionMessage(error) };
    }

    this.logger.error(
      `Unexpected socket error: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );

    return {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred',
    };
  }

  private getHttpExceptionMessage(error: HttpException): string {
    const response = error.getResponse();
    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object' && 'message' in response) {
      const message = (response as { message?: string | string[] }).message;
      if (Array.isArray(message)) {
        return message.join('; ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return error.message;
  }
}
