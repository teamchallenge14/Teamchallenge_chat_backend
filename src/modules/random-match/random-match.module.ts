import { Module } from '@nestjs/common';

import { RandomMatchController } from './random-match.controller';
import { RandomMatchService } from './random-match.service';
import { RandomMatchRepository } from './random-match.repository';

@Module({
  controllers: [RandomMatchController],
  providers: [RandomMatchService, RandomMatchRepository],
})
export class RandomMatchModule {}
