import { PrismaService } from '@db/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTenantUserContext(userId: string, tenantId: string) {
    return this.prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      select: {
        tenantStatus: true,
        user: {
          select: {
            accountStatus: true,
            authMethods: {
              select: {
                provider: true,
              },
            },
            data: {
              select: {
                allowContactSave: true,
              },
            },
          },
        },
      },
    });
  }

  createContact(params: { tenantId: string; ownerUserId: string; contactUserId: string }) {
    const { tenantId, ownerUserId, contactUserId } = params;

    return this.prisma.userContact.create({
      data: {
        tenantId,
        ownerUserId,
        contactUserId,
      },
      select: {
        id: true,
      },
    });
  }

  async deleteContact(params: { tenantId: string; ownerUserId: string; contactUserId: string }) {
    const { tenantId, ownerUserId, contactUserId } = params;

    const result = await this.prisma.userContact.deleteMany({
      where: {
        tenantId,
        ownerUserId,
        contactUserId,
      },
    });

    return result.count;
  }
}
