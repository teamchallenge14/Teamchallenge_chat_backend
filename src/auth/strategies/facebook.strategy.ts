import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthProvider } from '@prisma/client';
import { Strategy } from 'passport-facebook';
import { oauthConfig } from '@src/config';

interface FacebookProfile {
  id: string;
  emails?: Array<{ value: string }>;
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: oauthConfig.facebook.appId,
      clientSecret: oauthConfig.facebook.appSecret,
      callbackURL: 'https://teamchallenge-chat-backend.onrender.com/v1/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: FacebookProfile) {
    return {
      provider: AuthProvider.FACEBOOK,
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
    };
  }
}
