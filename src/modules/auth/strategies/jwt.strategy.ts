import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '@src/config';
import { AccessTokenPayload } from '@src/modules/auth/interfaces/access-token.payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => {
          if (request?.handshake?.auth?.token) {
            return request.handshake.auth.token;
          }
          return null;
        },
      ]),
      secretOrKey: jwtConfig.secret,
      ignoreExpiration: false,
    });
  }

  validate(payload: AccessTokenPayload) {
    return {
      id: payload.sub,
      login: payload.login,
    };
  }
}
