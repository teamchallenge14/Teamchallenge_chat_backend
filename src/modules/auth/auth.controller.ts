import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UnauthorizedException,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { routesV1 } from '@src/config/app/app.routes';
import { CreateUserDto } from '@src/modules/users/dto/create-user.dto';
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
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { appConfig } from '@src/config';
import { AuthCookiesService } from '@src/modules/auth/cookies/auth-cookies.service';
import { RegisterUserResponseDto } from '@src/modules/auth/dto/register-user.response.dto';
import { RefreshResponseDto } from '@src/modules/auth/dto/refresh.response.dto';
import { CreatedUserDto } from '@src/modules/users/dto/created-user.dto';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import { Public } from '@src/common/decorators/public.decorator';
import { TenantId } from '@src/common/decorators/tenant-id.decorator';
import { CreateGuestRequestDto } from '@src/modules/users/dto/create-guest-request.dto';
import { RegisterGuestResponseDto } from '@src/modules/auth/dto/register-guest.response.dto';

@ApiTags(routesV1.auth.root)
@Controller(routesV1.version)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookiesService: AuthCookiesService,
  ) {}

  // =========================
  // REGISTER (LOCAL)
  // =========================
  @Public()
  @Post(routesV1.auth.registerUser)
  @ApiOperation({
    summary: 'Register user (local)',
    description:
      'Creates a new user with local credentials. Access and refresh tokens are returned via HttpOnly cookies.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: RegisterUserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Registration failed' })
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
    @TenantId() tenantId: string,
  ): Promise<RegisterUserResponseDto> {
    const { user, accessToken, refreshToken } = await this.authService.register(dto, tenantId);

    this.authCookiesService.setAuthCookies(res, { accessToken, refreshToken });
    return { user, accessToken };
  }

  // =========================
  // REGISTER (GUEST)
  // =========================
  @Public()
  @Post(routesV1.auth.registerGuest)
  @ApiOperation({
    summary: 'Register guest ',
    description:
      'Creates a new guest with local credentials. Access and refresh tokens are returned via HttpOnly cookies.',
  })
  @ApiBody({ type: CreateGuestRequestDto })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: RegisterUserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Registration failed' })
  async registerGuest(
    @Body() dto: CreateGuestRequestDto,
    @Res({ passthrough: true }) res: Response,
    @TenantId() tenantId: string,
  ): Promise<RegisterGuestResponseDto> {
    const { user, accessToken, refreshToken } = await this.authService.registerGuest(dto, tenantId);

    this.authCookiesService.setAuthCookies(res, { accessToken, refreshToken });
    return { user, accessToken };
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  @Public()
  @Post(routesV1.auth.refresh)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(AUTH_COOKIES.REFRESH_TOKEN)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Issues a new access token using a valid refresh token from cookies.',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = req.cookies[AUTH_COOKIES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    this.authCookiesService.setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });
    return { accessToken: accessToken };
  }

  // =========================
  // LOGIN (LOCAL)
  // =========================
  @Public()
  @Post(routesV1.auth.login)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({
    summary: 'Login with local credentials',
    description:
      'Authenticates user using login and password. Access and refresh tokens are returned via HttpOnly cookies.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Successfully authenticated',
    type: RegisterUserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid login or password',
  })
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterUserResponseDto> {
    const user = req.user as CreatedUserDto | undefined;

    if (!user || (!user.email && !user.login)) {
      throw new UnauthorizedException();
    }

    const identifier = user.email ?? user.login;
    if (!identifier) {
      throw new UnauthorizedException();
    }

    const accessToken = await this.authService.issueTokens(
      {
        id: user.id,
        identifier,
      },
      res,
    );

    return {
      user,
      accessToken,
    };
  }

  // =========================
  // GOOGLE AUTH
  // =========================
  @Public()
  @Get(routesV1.auth.google)
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth redirect',
    description: 'Redirects user to Google OAuth consent screen.',
  })
  // @ApiExcludeEndpoint()
  google() {}

  // google callback
  @Public()
  @Get(routesV1.auth.googleCallback)
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
  @Public()
  @Get(routesV1.auth.github)
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth redirect',
    description: 'Redirects user to GitHub OAuth consent screen.',
  })
  // @ApiExcludeEndpoint()
  github() {}

  @Get(routesV1.auth.githubCallback)
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth callback',
    description:
      'Handles GitHub OAuth response, logs in or creates user, sets cookies and redirects.',
  })
  // @ApiExcludeEndpoint()

  // github callback
  @Public()
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
  @Public()
  @Get(routesV1.auth.facebook)
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook OAuth redirect',
    description: 'Redirects user to Facebook OAuth consent screen.',
  })
  // @ApiExcludeEndpoint()
  facebook() {}

  // facebook callback
  @Public()
  @Get(routesV1.auth.facebookCallback)
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
}
