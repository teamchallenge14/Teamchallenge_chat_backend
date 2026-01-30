import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '@db/prisma.service';
import { UsersRepository } from '@src/modules/users/repository/users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
