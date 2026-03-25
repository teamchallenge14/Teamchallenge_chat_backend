import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { SocketAuthService } from './socket-auth.service';
import { jwtConfig } from '@src/config';
import { RoomsModule } from '@src/modules/rooms/rooms.module';
import { RedisModule } from '@src/infra/redis/redis.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtConfig.secret,
      }),
    }),
    RedisModule,
    RoomsModule,
  ],
  providers: [SocketGateway, SocketService, SocketAuthService],
  exports: [SocketService],
})
export class SocketModule {}
