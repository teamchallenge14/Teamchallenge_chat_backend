import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { AccessTokenPayload } from './access-token.payload';

@Injectable()
export class AccessTokenService {
  constructor(private readonly jwtService: JwtService) {}

  generate(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload);
  }
}
