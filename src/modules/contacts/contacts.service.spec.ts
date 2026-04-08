import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AccountStatus, AuthProvider, Prisma } from '@prisma/client';

import { ContactsService } from './contacts.service';
import { ContactsRepository } from './repository/contacts.repository';

type ContactsRepositoryMock = {
  findTenantUserContext: jest.Mock;
  createContact: jest.Mock;
  deleteContact: jest.Mock;
};

const buildTenantUserCtx = (params?: {
  tenantStatus?: AccountStatus;
  accountStatus?: AccountStatus;
  providers?: AuthProvider[];
  allowContactSave?: boolean | null;
}) => ({
  tenantStatus: params?.tenantStatus ?? AccountStatus.ACTIVE,
  user: {
    accountStatus: params?.accountStatus ?? AccountStatus.ACTIVE,
    authMethods: (params?.providers ?? [AuthProvider.LOCAL]).map((provider) => ({ provider })),
    data:
      params?.allowContactSave === null
        ? null
        : {
            allowContactSave: params?.allowContactSave ?? true,
          },
  },
});

const buildPrismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('error', {
    code,
    clientVersion: '0.0.0',
  });

describe('ContactsService', () => {
  let service: ContactsService;
  let contactsRepository: ContactsRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: ContactsRepository,
          useValue: {
            findTenantUserContext: jest.fn(),
            createContact: jest.fn(),
            deleteContact: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    contactsRepository = module.get(ContactsRepository);
  });

  it('saves contact when both users are valid and allowed', async () => {
    contactsRepository.findTenantUserContext
      .mockResolvedValueOnce(buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }))
      .mockResolvedValueOnce(buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }));
    contactsRepository.createContact.mockResolvedValue({ id: 'contact-id' });

    const result = await service.saveContact(
      '550e8400-e29b-41d4-a716-446655440000',
      'tenant-id',
      '11111111-1111-4111-8111-111111111111',
    );

    expect(result).toEqual({ success: true });
    expect(contactsRepository.createContact).toHaveBeenCalledWith({
      tenantId: 'tenant-id',
      ownerUserId: '550e8400-e29b-41d4-a716-446655440000',
      contactUserId: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('throws UnauthorizedException when owner user id is missing', async () => {
    await expect(
      service.saveContact(undefined, 'tenant-id', '11111111-1111-4111-8111-111111111111'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws ForbiddenException when tenant is missing', async () => {
    await expect(
      service.saveContact(
        '550e8400-e29b-41d4-a716-446655440000',
        undefined,
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException when user tries to add self', async () => {
    contactsRepository.findTenantUserContext.mockResolvedValueOnce(
      buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }),
    );

    await expect(
      service.saveContact(
        '550e8400-e29b-41d4-a716-446655440000',
        'tenant-id',
        '550e8400-e29b-41d4-a716-446655440000',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ForbiddenException when owner is anonymous guest', async () => {
    contactsRepository.findTenantUserContext.mockResolvedValueOnce(
      buildTenantUserCtx({ providers: [AuthProvider.GUEST] }),
    );

    await expect(
      service.saveContact(
        '550e8400-e29b-41d4-a716-446655440000',
        'tenant-id',
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when contact is not found in tenant', async () => {
    contactsRepository.findTenantUserContext
      .mockResolvedValueOnce(buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }))
      .mockResolvedValueOnce(null);

    await expect(
      service.saveContact(
        '550e8400-e29b-41d4-a716-446655440000',
        'tenant-id',
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws UnprocessableEntityException when contact is anonymous guest', async () => {
    contactsRepository.findTenantUserContext
      .mockResolvedValueOnce(buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }))
      .mockResolvedValueOnce(buildTenantUserCtx({ providers: [AuthProvider.GUEST] }));

    await expect(
      service.saveContact(
        '550e8400-e29b-41d4-a716-446655440000',
        'tenant-id',
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws ForbiddenException when contact privacy blocks saves', async () => {
    contactsRepository.findTenantUserContext
      .mockResolvedValueOnce(buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }))
      .mockResolvedValueOnce(
        buildTenantUserCtx({ providers: [AuthProvider.LOCAL], allowContactSave: false }),
      );

    await expect(
      service.saveContact(
        '550e8400-e29b-41d4-a716-446655440000',
        'tenant-id',
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ConflictException on duplicate contact (P2002)', async () => {
    contactsRepository.findTenantUserContext
      .mockResolvedValueOnce(buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }))
      .mockResolvedValueOnce(buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }));
    contactsRepository.createContact.mockRejectedValue(buildPrismaError('P2002'));

    await expect(
      service.saveContact(
        '550e8400-e29b-41d4-a716-446655440000',
        'tenant-id',
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow(ConflictException);
  });

  describe('removeContact', () => {
    it('removes saved contact successfully', async () => {
      contactsRepository.findTenantUserContext.mockResolvedValueOnce(
        buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }),
      );
      contactsRepository.deleteContact.mockResolvedValue(1);

      const result = await service.removeContact(
        '550e8400-e29b-41d4-a716-446655440000',
        'tenant-id',
        '11111111-1111-4111-8111-111111111111',
      );

      expect(result).toEqual({ success: true });
      expect(contactsRepository.deleteContact).toHaveBeenCalledWith({
        tenantId: 'tenant-id',
        ownerUserId: '550e8400-e29b-41d4-a716-446655440000',
        contactUserId: '11111111-1111-4111-8111-111111111111',
      });
    });

    it('throws UnauthorizedException when owner user id is missing', async () => {
      await expect(
        service.removeContact(undefined, 'tenant-id', '11111111-1111-4111-8111-111111111111'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException when tenant is missing', async () => {
      await expect(
        service.removeContact(
          '550e8400-e29b-41d4-a716-446655440000',
          undefined,
          '11111111-1111-4111-8111-111111111111',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when user tries to remove self', async () => {
      contactsRepository.findTenantUserContext.mockResolvedValueOnce(
        buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }),
      );

      await expect(
        service.removeContact(
          '550e8400-e29b-41d4-a716-446655440000',
          'tenant-id',
          '550e8400-e29b-41d4-a716-446655440000',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when owner is anonymous guest', async () => {
      contactsRepository.findTenantUserContext.mockResolvedValueOnce(
        buildTenantUserCtx({ providers: [AuthProvider.GUEST] }),
      );

      await expect(
        service.removeContact(
          '550e8400-e29b-41d4-a716-446655440000',
          'tenant-id',
          '11111111-1111-4111-8111-111111111111',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when contact relation does not exist', async () => {
      contactsRepository.findTenantUserContext.mockResolvedValueOnce(
        buildTenantUserCtx({ providers: [AuthProvider.LOCAL] }),
      );
      contactsRepository.deleteContact.mockResolvedValue(0);

      await expect(
        service.removeContact(
          '550e8400-e29b-41d4-a716-446655440000',
          'tenant-id',
          '11111111-1111-4111-8111-111111111111',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
