import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@src/modules/users/users.service';
import { AccessTokenService } from './access-token/access-token.service';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { CreateUserDto } from '@src/modules/users/dto/create-user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountStatus, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Response, Request } from 'express';
import { AuthCookiesService } from '@src/modules/auth/cookies/auth-cookies.service';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly authCookiesService: AuthCookiesService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);

    if (!user.login) {
      throw new UnauthorizedException('User login is missing');
    }

    const accessToken = this.accessTokenService.generate({
      sub: user.id,
      login: user.login,
    });

    const refreshToken = this.refreshTokenService.generate();

    await this.refreshTokenService.save(user.id, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  // refresh
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    // check refresh token in Mongo
    const stored = await this.refreshTokenService.validate(refreshToken);

    // get user
    const user = await this.usersService.findOne({
      id: stored.userId,
    });

    if (!user.login) {
      throw new UnauthorizedException('User login is missing');
    }

    // new access token
    const accessToken = this.accessTokenService.generate({
      sub: user.id,
      login: user.login,
    });

    // rotation refresh token
    const newRefreshToken = await this.refreshTokenService.rotate(refreshToken, user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // LOCAL
  async validateLocalUser(identifier: string, password: string) {
    const isEmail = identifier.includes('@');

    const authMethod = await this.prisma.authMethod.findFirst({
      where: {
        provider: AuthProvider.LOCAL,
        ...(isEmail ? { email: identifier.toLowerCase() } : { login: identifier }),
      },
      include: {
        user: true,
      },
    });

    if (!authMethod || !authMethod.passwordHash) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, authMethod.passwordHash);

    if (!passwordValid) {
      return null;
    }

    return authMethod.user;
  }

  // SOCIAL (Google / GitHub / Facebook)
  async loginSocial(profile: {
    provider: AuthProvider;
    providerId: string;
    email?: string;
    login?: string;
  }) {
    const auth = await this.prisma.authMethod.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      include: { user: true },
    });

    if (!auth) {
      const user = await this.prisma.user.create({
        data: {
          accountStatus: AccountStatus.ACTIVE,
          authMethods: {
            create: profile,
          },
        },
      });
      return user;
    }

    return auth.user;
  }

  async issueTokens(payload: { id: string; identifier: string }, res: Response) {
    if (!payload.id || !payload.identifier) {
      throw new UnauthorizedException();
    }

    const accessToken = this.accessTokenService.generate({
      sub: payload.id,
      login: payload.identifier,
    });

    const refreshToken = this.refreshTokenService.generate();

    await this.refreshTokenService.save(payload.id, refreshToken);

    this.authCookiesService.setAuthCookies(res, {
      accessToken,
      refreshToken,
    });

    return {
      accessToken,
    };
  }
}
