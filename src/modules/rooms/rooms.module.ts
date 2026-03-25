import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomsRepository } from './repository/rooms.repository';
import { CloudinaryModule } from '@src/infra/cloudinary/cloudinary.module';
import { MailModule } from '@src/modules/mail/mail.module';

@Module({
  imports: [CloudinaryModule, MailModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository],
  exports: [RoomsService],
})
export class RoomsModule {}
