import { Injectable } from '@nestjs/common';
import { SocketService } from './modules/socket/socket.service';

@Injectable()
export class AppService {
  constructor(private readonly socketService: SocketService) {}
  getHello(): string {
    this.socketService.emitToUser('7113d47d-2c14-4d08-b758-c14169660498', 'notification', {
      message: 'order created',
    });
    this.socketService.sendGlobal({
      message: 'hello global',
    });
    return 'Hello World!';
  }
}
