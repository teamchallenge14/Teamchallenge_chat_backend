import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '@db/prisma.service';
import { UsersDao } from '@src/modules/users/dao/users.dao';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, UsersDao],
  exports: [UsersService],
})
export class UsersModule {}
