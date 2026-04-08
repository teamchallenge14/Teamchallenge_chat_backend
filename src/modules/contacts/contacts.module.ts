import { Module } from '@nestjs/common';

import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './repository/contacts.repository';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, ContactsRepository],
})
export class ContactsModule {}
