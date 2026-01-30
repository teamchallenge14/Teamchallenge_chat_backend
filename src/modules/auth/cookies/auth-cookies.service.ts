import { Injectable } from '@nestjs/common';
import { cookiesConfig } from '@src/config';
import { routesV1 } from '@src/config/app/app.routes';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import type { Response, Request } from 'express';

@Injectable()
export class AuthCookiesService {
  constructor() {}

  setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    res.cookie(AUTH_COOKIES.ACCESS_TOKEN, tokens.accessToken, {
      httpOnly: true,
      secure: cookiesConfig.secure,
      sameSite: cookiesConfig.sameSite,
      maxAge: cookiesConfig.accessMaxAge,
      path: '/',
    });

    res.cookie(AUTH_COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
      httpOnly: true,
      secure: cookiesConfig.secure,
      sameSite: cookiesConfig.sameSite,
      maxAge: cookiesConfig.refreshMaxAge,
      path: routesV1.auth.refresh,
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(AUTH_COOKIES.ACCESS_TOKEN);
    res.clearCookie(AUTH_COOKIES.REFRESH_TOKEN);
  }
}
