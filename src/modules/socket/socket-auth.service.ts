import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class SocketAuthService {
  constructor(private readonly jwtService: JwtService) {}

  async authenticate(client: Socket): Promise<string | null> {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!token) return null;

      const payload = await this.jwtService.verifyAsync(token);

      return payload.sub;
    } catch {
      return null;
    }
  }
}
