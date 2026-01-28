import { Injectable } from '@nestjs/common';
import { cookiesConfig } from '@src/config';
import { routesV1 } from '@src/config/app/app.routes';
import type { Response, Request } from 'express';

@Injectable()
export class AuthCookiesService {
  constructor() {}

  setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: cookiesConfig.secure,
      sameSite: cookiesConfig.sameSite,
      maxAge: cookiesConfig.accessMaxAge,
      path: '/',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: cookiesConfig.secure,
      sameSite: cookiesConfig.sameSite,
      maxAge: cookiesConfig.refreshMaxAge,
      path: routesV1.auth.root + '/refresh',
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
