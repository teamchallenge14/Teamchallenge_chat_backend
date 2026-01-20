import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthProvider } from '@prisma/client';
import { Strategy } from 'passport-github2';
import { appConfig, oauthConfig } from '@src/config';
import { routesV1 } from '@src/config/app.routes';

interface GithubProfile {
  id: string;
  username: string;
  emails?: Array<{ value: string }>;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: oauthConfig.github.clientId,
      clientSecret: oauthConfig.github.clientSecret,
      callbackURL: `${appConfig.frontendUrl}/${routesV1.version}${routesV1.auth.github}/callback`,
      scope: ['user:email'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: GithubProfile) {
    return {
      provider: AuthProvider.GITHUB,
      providerId: profile.id,
      login: profile.username,
      email: profile.emails?.[0]?.value,
    };
  }
}
