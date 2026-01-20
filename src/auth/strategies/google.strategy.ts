import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthProvider } from '@prisma/client';
import { Strategy } from 'passport-google-oauth20';
import { appConfig, oauthConfig } from '@src/config';
import { routesV1 } from '@src/config/app.routes';

interface GoogleProfile {
  id: string;
  emails?: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: oauthConfig.google.clientId,
      clientSecret: oauthConfig.google.clientSecret,
      callbackURL: `${appConfig.frontendUrl}/${routesV1.version}${routesV1.auth.google}/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: GoogleProfile) {
    return {
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
    };
  }
}
