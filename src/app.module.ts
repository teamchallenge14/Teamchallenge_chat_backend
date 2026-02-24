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
import { RoomsModule } from './modules/rooms/rooms.module';
import { MediaModule } from './modules/media/media.module';
import { RandomMatchModule } from './modules/random-match/random-match.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@src/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@src/common/guards/permission.guard';
import { TenantModule } from '@src/modules/tenant/tenant.module';
import { TenantGuard } from '@src/common/guards/tenant.guard';

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
    RoomsModule,
    MediaModule,
    RandomMatchModule,
    HealthModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
