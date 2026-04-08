import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AccountStatus, AuthProvider, Prisma } from '@prisma/client';

import { ContactsRepository } from './repository/contacts.repository';
import { CONTACT_ERROR_CODES } from './constants/contact-error-codes.constants';
import { CreateContactResponseDto } from './dto/create-contact.response.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly contactsRepository: ContactsRepository) {}

  async saveContact(
    ownerUserId: string | undefined,
    tenantId: string | undefined,
    contactUserId: string,
  ): Promise<CreateContactResponseDto> {
    const ensured = await this.ensureOwnerCanManageContacts(ownerUserId, tenantId);

    if (ensured.ownerUserId === contactUserId) {
      throw new BadRequestException({
        message: 'You cannot add yourself to contacts',
        code: CONTACT_ERROR_CODES.SELF_ADD,
      });
    }

    const contactCtx = await this.contactsRepository.findTenantUserContext(
      contactUserId,
      ensured.tenantId,
    );

    if (
      !contactCtx ||
      contactCtx.tenantStatus !== AccountStatus.ACTIVE ||
      contactCtx.user.accountStatus !== AccountStatus.ACTIVE
    ) {
      throw new NotFoundException({
        message: 'Contact not found',
        code: CONTACT_ERROR_CODES.CONTACT_NOT_FOUND,
      });
    }

    if (this.isAnonymousUser(contactCtx.user.authMethods.map((method) => method.provider))) {
      throw new UnprocessableEntityException({
        message: `This user doesn't have an account and can't be added to your contacts`,
        code: CONTACT_ERROR_CODES.CONTACT_ANONYMOUS,
      });
    }

    if (contactCtx.user.data?.allowContactSave === false) {
      throw new ForbiddenException({
        message: 'This user does not allow adding to contacts',
        code: CONTACT_ERROR_CODES.CONTACT_PRIVACY_RESTRICTED,
      });
    }

    try {
      await this.contactsRepository.createContact({
        tenantId: ensured.tenantId,
        ownerUserId: ensured.ownerUserId,
        contactUserId,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          message: 'Contact already added',
          code: CONTACT_ERROR_CODES.CONTACT_DUPLICATE,
        });
      }

      throw error;
    }
  }

  async removeContact(
    ownerUserId: string | undefined,
    tenantId: string | undefined,
    contactUserId: string,
  ): Promise<CreateContactResponseDto> {
    const ensured = await this.ensureOwnerCanManageContacts(ownerUserId, tenantId);

    if (ensured.ownerUserId === contactUserId) {
      throw new BadRequestException({
        message: 'You cannot remove yourself from contacts',
        code: CONTACT_ERROR_CODES.SELF_REMOVE,
      });
    }

    const deleted = await this.contactsRepository.deleteContact({
      tenantId: ensured.tenantId,
      ownerUserId: ensured.ownerUserId,
      contactUserId,
    });

    if (deleted === 0) {
      throw new NotFoundException({
        message: 'Contact is not in your list',
        code: CONTACT_ERROR_CODES.CONTACT_RELATION_NOT_FOUND,
      });
    }

    return { success: true };
  }

  private async ensureOwnerCanManageContacts(
    ownerUserId: string | undefined,
    tenantId: string | undefined,
  ): Promise<{ ownerUserId: string; tenantId: string }> {
    if (!ownerUserId) {
      throw new UnauthorizedException('User is not authenticated');
    }

    if (!tenantId) {
      throw new ForbiddenException({
        message: 'Tenant missing',
        code: CONTACT_ERROR_CODES.TENANT_MISSING,
      });
    }

    const ownerCtx = await this.contactsRepository.findTenantUserContext(ownerUserId, tenantId);

    if (!ownerCtx) {
      throw new UnauthorizedException('User is not authenticated');
    }

    if (
      ownerCtx.tenantStatus !== AccountStatus.ACTIVE ||
      ownerCtx.user.accountStatus !== AccountStatus.ACTIVE
    ) {
      throw new ForbiddenException('User is not allowed to manage contacts');
    }

    if (this.isAnonymousUser(ownerCtx.user.authMethods.map((method) => method.provider))) {
      throw new ForbiddenException({
        message: 'Sign Up to save contact',
        code: CONTACT_ERROR_CODES.OWNER_ANONYMOUS,
      });
    }

    return {
      ownerUserId,
      tenantId,
    };
  }

  private isAnonymousUser(providers: AuthProvider[]): boolean {
    if (!providers.length) {
      return true;
    }

    return providers.every((provider) => provider === AuthProvider.GUEST);
  }
}
