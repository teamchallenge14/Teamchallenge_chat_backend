import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  private userNotificationsRoom(userId: string) {
    return `notifications:${userId}`;
  }

  private presenceRoom(userId: string) {
    return `presence:${userId}`;
  }

  private emit(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  joinUserRoom(client: any, userId: string) {
    client.join(this.getUserRoom(userId));
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
}
