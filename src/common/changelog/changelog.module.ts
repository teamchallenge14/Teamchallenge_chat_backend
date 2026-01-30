import { Module } from '@nestjs/common';
import { ChangelogService } from './changelog.service';

@Module({
  providers: [ChangelogService],
  exports: [ChangelogService],
})
export class ChangelogModule {}
