import { Body, Controller, Delete, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';

import { routesV1 } from '@src/config';
import { RequirePermissions, TenantId, UserDecorator } from '@src/common/decorators';

import { ContactsService } from './contacts.service';
import { CreateContactDto, CreateContactResponseDto } from './dto';
import { RemoveContactDocs, SaveContactDocs } from './swagger-docs';

@ApiTags(routesV1.contacts.root)
@Controller(routesV1.version)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post(routesV1.contacts.create)
  @RequirePermissions([Permission.USER_UPDATE])
  @SaveContactDocs()
  saveContact(
    @UserDecorator('id') userId: string,
    @TenantId() tenantId: string,
    @Body() dto: CreateContactDto,
  ): Promise<CreateContactResponseDto> {
    return this.contactsService.saveContact(userId, tenantId, dto.contactUserId);
  }

  @Delete(routesV1.contacts.delete)
  @RequirePermissions([Permission.USER_UPDATE])
  @RemoveContactDocs()
  removeContact(
    @UserDecorator('id') userId: string,
    @TenantId() tenantId: string,
    @Param('contactUserId', new ParseUUIDPipe()) contactUserId: string,
  ): Promise<CreateContactResponseDto> {
    return this.contactsService.removeContact(userId, tenantId, contactUserId);
  }
}
