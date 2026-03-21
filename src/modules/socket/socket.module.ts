import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { SocketAuthService } from './socket-auth.service';
import { jwtConfig } from '@src/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtConfig.secret,
      }),
    }),
  ],
  providers: [SocketGateway, SocketService, SocketAuthService],
  exports: [SocketService],
})
export class SocketModule {}
