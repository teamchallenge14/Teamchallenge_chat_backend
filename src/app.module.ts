import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InterestsModule } from './modules/interests/interests.module';
import { MailModule } from './modules/mail/mail.module';
import { PrismaModule } from '@db/prisma.module';
import { PinoLoggerModule } from './infra/logger/pino.module';
import { dbConfig } from './config';
import { HealthModule } from './modules/health/health.module';
import { ChangelogModule } from '@src/common/changelog/changelog.module';

@Module({
  imports: [
    // LOGGER
    PinoLoggerModule,

    // CHANGELOG
    ChangelogModule,

    // DATABASES
    PrismaModule,

    MongooseModule.forRoot(dbConfig.mongo.url),

    // FEATURES
    UsersModule,
    AuthModule,
    InterestsModule,
    MailModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
