import { ExtractJwt, Strategy } from 'passport-jwt';
import { accessTokenCookieExtractor } from '../extractors/access-token-cookie.extractor';
import { jwtConfig } from '@src/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        accessTokenCookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: jwtConfig.secret,
    });
  }

  validate(payload: { sub: string; login: string }) {
    return {
      id: payload.sub,
      login: payload.login,
    };
  }
}
