import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PresenceService } from './presence.service';
import { UsersRepository } from '@src/modules/users/repository/users.repository';

@Injectable()
export class PresenceCron {
  constructor(
    private presence: PresenceService,
    private userRepo: UsersRepository,
  ) {}

  @Interval(30000)
  async checkOfflineUsers() {
    const now = Date.now();

    for (const [userId, lastActivity] of this.presence.getLastActivityEntries()) {
      const isOffline = now - lastActivity > 60000;

      if (isOffline) {
        await this.userRepo.updateLastSeen(userId, new Date(lastActivity));

        this.presence.removeUser(userId);
      }
    }
  }
}
