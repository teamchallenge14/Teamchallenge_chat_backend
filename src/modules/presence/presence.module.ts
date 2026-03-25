import { Module } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceCron } from './presence.cron';

@Module({
  providers: [PresenceService, PresenceCron],
  exports: [PresenceService],
})
export class PresenceModule {}
