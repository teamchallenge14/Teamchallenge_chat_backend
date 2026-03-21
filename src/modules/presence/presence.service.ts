import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  private onlineUsers = new Map<string, number>();
  private lastActivity = new Map<string, number>();

  onConnect(userId: string) {
    const count = this.onlineUsers.get(userId) || 0;
    this.onlineUsers.set(userId, count + 1);
    this.lastActivity.set(userId, Date.now());
  }

  onDisconnect(userId: string) {
    const count = this.onlineUsers.get(userId) || 0;

    if (count <= 1) {
      this.onlineUsers.delete(userId);
    } else {
      this.onlineUsers.set(userId, count - 1);
    }
  }

  heartbeat(userId: string) {
    this.lastActivity.set(userId, Date.now());
  }

  isReallyOffline(userId: string, timeoutMs = 60000): boolean {
    const last = this.lastActivity.get(userId);
    if (!last) return true;

    return Date.now() - last > timeoutMs;
  }

  getLastActivityEntries(): IterableIterator<[string, number]> {
    return this.lastActivity.entries();
  }

  removeUser(userId: string) {
    this.onlineUsers.delete(userId);
    this.lastActivity.delete(userId);
  }
}
