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
import { CreateGuestRequestDto } from '@src/modules/users/dto/create-guest-request.dto';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly authCookiesService: AuthCookiesService,
  ) {}

  async register(dto: CreateUserDto, tenantId: string) {
    const user = await this.usersService.create(dto, tenantId);

    if (!user.login) {
      throw new UnauthorizedException('User login is missing');
    }

    const accessToken = this.accessTokenService.generate({
      sub: user.id,
      login: user.login,
    });

    const refreshToken = await this.refreshTokenService.createRefreshToken(user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
  async registerGuest(dto: CreateGuestRequestDto, tenantId: string) {
    const user = await this.usersService.createGuest(dto, tenantId);

    if (!user.login) {
      throw new UnauthorizedException('User login is missing');
    }

    const accessToken = this.accessTokenService.generate({
      sub: user.id,
      login: user.login,
    });

    const refreshToken = await this.refreshTokenService.createRefreshToken(user.id);

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

    // validate refresh JWT + check hash in Mongo
    const userId = await this.refreshTokenService.validate(refreshToken);

    // get user
    const user = await this.usersService.findOne({
      id: userId,
    });

    if (!user || !user.login) {
      throw new UnauthorizedException('User not found');
    }

    // generate new access token
    const accessToken = this.accessTokenService.generate({
      sub: user.id,
      login: user.login,
    });

    // rotate refresh token
    const newRefreshToken = await this.refreshTokenService.rotate(refreshToken);

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

    const user = {
      id: authMethod.user.id,
      login: authMethod.login,
      email: authMethod.email,
      provider: authMethod.provider,
      createdAt: authMethod.createdAt,
    };

    return user;
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

    const refreshToken = await this.refreshTokenService.createRefreshToken(payload.id);

    this.authCookiesService.setAuthCookies(res, {
      accessToken,
      refreshToken,
    });

    return accessToken;
  }
}
