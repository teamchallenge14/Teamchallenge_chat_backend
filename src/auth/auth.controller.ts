import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UnauthorizedException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { routesV1 } from '@src/config/app.routes';
import { CreateUserDto } from '@src/users/dto/create-user.dto';
import type { Response, Request } from 'express';
import { AuthProvider } from '@prisma/client';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PublicUserDto } from '@src/users/dto/public-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { appConfig } from '@src/config';
import { CreatedUserDto } from '@src/users/dto/created-user.dto';

@ApiTags(routesV1.auth.root)
@Controller(routesV1.version)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // =========================
  // REGISTER (LOCAL)
  // =========================
  @Post(routesV1.auth.root)
  @ApiOperation({
    summary: 'Register user (local)',
    description:
      'Creates a new user with local credentials. Access and refresh tokens are returned via HttpOnly cookies.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: CreatedUserDto,
  })
  @ApiUnauthorizedResponse({ description: 'Registration failed' })
  @ApiCookieAuth('access_token')
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CreatedUserDto> {
    const { user, accessToken, refreshToken } = await this.authService.register(dto);

    this.setAuthCookies(res, accessToken, refreshToken);
    return user;
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Issues a new access token using a valid refresh token from cookies.',
  })
  @ApiCookieAuth('refresh_token')
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: PublicUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUserDto> {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    } = await this.authService.refresh(refreshToken);

    this.setAuthCookies(res, accessToken, newRefreshToken);
    return user;
  }

  // =========================
  // LOGIN (LOCAL)
  // =========================
  @Post(`${routesV1.auth.root}/login`)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({
    summary: 'Login with local credentials',
    description:
      'Authenticates user using login and password. Access and refresh tokens are returned via HttpOnly cookies.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Successfully authenticated',
    type: PublicUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid login or password',
  })
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { id: string; identifier: string };
    await this.authService.issueTokens(user, res);
    return user;
  }

  // =========================
  // GOOGLE AUTH
  // =========================
  @Get(`${routesV1.auth.google}`)
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth redirect',
    description: 'Redirects user to Google OAuth consent screen.',
  })
  // @ApiExcludeEndpoint()
  google() {}

  @Get(`${routesV1.auth.google}/callback`)
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Handles Google OAuth response, logs in or creates user, sets cookies and redirects to frontend.',
  })
  // @ApiExcludeEndpoint()
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { provider: AuthProvider; providerId: string; email?: string };
    const user = await this.authService.loginSocial(profile);

    await this.authService.issueTokens(
      {
        id: user.id,
        identifier: profile.email ?? user.id,
      },
      res,
    );

    res.redirect(appConfig.frontendUrl);
  }

  // =========================
  // GITHUB AUTH
  // =========================
  @Get(`${routesV1.auth.github}`)
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth redirect',
    description: 'Redirects user to GitHub OAuth consent screen.',
  })
  // @ApiExcludeEndpoint()
  github() {}

  @Get(`${routesV1.auth.github}/callback`)
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth callback',
    description:
      'Handles GitHub OAuth response, logs in or creates user, sets cookies and redirects.',
  })
  // @ApiExcludeEndpoint()
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as {
      provider: AuthProvider;
      providerId: string;
      email?: string;
      login?: string;
    };
    const user = await this.authService.loginSocial(profile);

    await this.authService.issueTokens(
      {
        id: user.id,
        identifier: profile.email ?? profile.login ?? user.id,
      },
      res,
    );

    res.redirect(appConfig.frontendUrl);
  }

  // =========================
  // FACEBOOK AUTH
  // =========================
  @Get(`${routesV1.auth.facebook}`)
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook OAuth redirect',
    description: 'Redirects user to Facebook OAuth consent screen.',
  })
  // @ApiExcludeEndpoint()
  facebook() {}

  @Get(`${routesV1.auth.facebook}/callback`)
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook OAuth callback',
    description:
      'Handles Facebook OAuth response, logs in or creates user, sets cookies and redirects.',
  })
  // @ApiExcludeEndpoint()
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { provider: AuthProvider; providerId: string; email?: string };
    const user = await this.authService.loginSocial(profile);

    await this.authService.issueTokens(
      {
        id: user.id,
        identifier: profile.email ?? user.id,
      },
      res,
    );

    res.redirect(appConfig.frontendUrl);
  }

  // =========================
  // HELPERS
  // =========================
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}
