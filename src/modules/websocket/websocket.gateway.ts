import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@src/common/guards/jwt-auth.guard';
import { RoomsRepository } from '../rooms/repository/rooms.repository';
import type { AuthenticatedSocket } from './socket.types';

interface JoinRoomResponse {
  status: 'ok';
  roomId: string;
}

interface UserEventPayload {
  userId: string;
  roomId: string;
}

@UseGuards(JwtAuthGuard)
@WebSocketGateway({
  namespace: '/rooms',
  cors: {
    origin: '*',
  },
})
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly repo: RoomsRepository,
    private readonly logger = new Logger(RoomsGateway.name),
  ) {}

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ): Promise<JoinRoomResponse> {
    if (!roomId) {
      throw new WsException('Room ID is required');
    }

    const userId = socket.user?.id;

    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const isMember = await this.repo.isMember(roomId, userId);

    if (!isMember) {
      throw new WsException('Not a member of this room');
    }

    await socket.join(roomId);

    this.emitUserJoined(roomId, { userId, roomId });

    return { status: 'ok', roomId };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    if (!roomId) {
      throw new WsException('Room ID is required');
    }

    const userId = socket.user?.id;

    await socket.leave(roomId);

    this.emitUserLeft(roomId, { userId, roomId });
  }

  emitUserJoined(roomId: string, payload: UserEventPayload) {
    this.server.to(roomId).emit('user_joined', payload);
  }

  emitUserLeft(roomId: string, payload: UserEventPayload) {
    this.server.to(roomId).emit('user_left', payload);
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.user?.id;
    if (userId) {
      this.logger.log(`User disconnected: ${userId}`);
    }
  }
}
