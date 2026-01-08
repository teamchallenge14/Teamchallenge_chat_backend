import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { InterestModule } from './interest/interest.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from 'prisma/prisma.module';
import { PinoLoggerModule } from './logger/pino.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // LOGGER
    PinoLoggerModule,

    // DATABASES
    PrismaModule,

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_DATABASE_URL'),
      }),
    }),

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
