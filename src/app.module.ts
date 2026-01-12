import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { InterestModule } from './interest/interest.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from 'prisma/prisma.module';
import { PinoLoggerModule } from './logger/pino.module';
import { dbConfig } from './config';

@Module({
  imports: [
    // LOGGER
    PinoLoggerModule,

    // DATABASES
    PrismaModule,

    MongooseModule.forRoot(dbConfig.mongo.url),

    // FEATURES
    UsersModule,
    AuthModule,
    InterestModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
