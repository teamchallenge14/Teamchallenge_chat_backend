import {
  Ack,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayInit,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseFilters } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { SocketAuthService } from './socket-auth.service';
import { AuthenticatedSocket } from './socket.types';
import { JoinRoomPayloadDto } from './dto/join-room.payload';
import { CreateRoomPayloadDto } from './dto/create-room.payload';
import { WsValidationPipe } from './ws-validation.pipe';
import { WsExceptionFilter } from './ws-exception.filter';

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly socketService: SocketService,
    private readonly socketAuthService: SocketAuthService,
  ) {}

  afterInit(server: Server) {
    this.socketService.setServer(server);
  }

  async handleConnection(client: Socket) {
    const userId = await this.socketAuthService.authenticate(client);

    if (!userId) {
      client.disconnect();
      return;
    }

    const authClient = client as AuthenticatedSocket;
    authClient.userId = userId;

    void this.socketService.joinUserRoom(authClient, userId);
    void this.socketService.rejoinUserRooms(authClient, userId);

    void client.join(`notifications:${userId}`);
    void client.join('notifications:global');
  }

  handleDisconnect(_client: Socket) {}

  // presence subscribe
  @SubscribeMessage('presence:subscribe')
  subscribe(@ConnectedSocket() client: Socket, @MessageBody() userIds: number[]) {
    for (const id of userIds) {
      void client.join(`presence:${id}`);
    }
  }

  // presence unsubscribe
  @SubscribeMessage('presence:unsubscribe')
  unsubscribe(@ConnectedSocket() client: Socket, @MessageBody() userIds: number[]) {
    for (const id of userIds) {
      void client.leave(`presence:${id}`);
    }
  }

  @SubscribeMessage('notifications:subscribe')
  subscribeNotifications(@ConnectedSocket() client: Socket) {
    const userId = (client as AuthenticatedSocket).userId;
    void client.join(`notifications:${userId}`);
  }

  @SubscribeMessage('notifications:unsubscribe')
  unsubscribeNotifications(@ConnectedSocket() client: Socket) {
    const userId = (client as AuthenticatedSocket).userId;
    void client.leave(`notifications:${userId}`);
  }

  @SubscribeMessage('room:join')
  joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: JoinRoomPayloadDto,
    @Ack()
    ack?: (response: { ok: boolean; data?: unknown; message?: string }) => void,
  ) {
    return this.socketService.handleJoinRoom(client as AuthenticatedSocket, payload, ack);
  }

  @SubscribeMessage('room:create')
  createRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(new WsValidationPipe()) payload: CreateRoomPayloadDto,
    @Ack()
    ack?: (response: { ok: boolean; data?: unknown; message?: string }) => void,
  ) {
    return this.socketService.handleCreateRoom(client as AuthenticatedSocket, payload, ack);
  }

  // emit online
  emitOnline(userId: string) {
    this.server.to(`presence:${userId}`).emit('USER_ONLINE', { userId });
  }

  // emit offline
  emitOffline(userId: string, lastSeen: number) {
    this.server.to(`presence:${userId}`).emit('USER_OFFLINE', {
      userId,
      lastSeen,
    });
  }

  // emit notification
  emitNotification(userId: string, payload: any) {
    this.server.to(`notifications:${userId}`).emit('NEW_NOTIFICATION', payload);
  }

  // global
  emitGlobalNotification(payload: any) {
    this.server.to('notifications:global').emit('GLOBAL_NOTIFICATION', payload);
  }
}
