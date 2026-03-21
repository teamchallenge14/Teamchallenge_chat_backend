import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomsRepository } from './repository/rooms.repository';
import { CloudinaryModule } from '@src/infra/cloudinary/cloudinary.module';
import { MailModule } from '@src/modules/mail/mail.module';
import { SocketModule } from '@src/modules/socket/socket.module';

@Module({
  imports: [CloudinaryModule, MailModule, SocketModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository],
})
export class RoomsModule {}
