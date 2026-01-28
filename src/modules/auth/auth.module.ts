import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { UsersModule } from '@src/modules/users/users.module';

import { AccessTokenService } from './access-token/access-token.service';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';

/* strategies */
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { jwtConfig } from '@src/config';
import { AuthCookiesService } from '@src/modules/auth/cookies/auth-cookies.service';

@Module({
  imports: [
    UsersModule,
    RefreshTokenModule,

    PassportModule.register({
      session: false,
    }),

    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtConfig.secret,
        signOptions: {
          expiresIn: jwtConfig.expiresIn,
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,

    /* token services */
    AccessTokenService,
    AuthCookiesService,

    /* passport strategies */
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    FacebookStrategy,
  ],

  exports: [AuthService, JwtModule],
})
export class AuthModule {}
