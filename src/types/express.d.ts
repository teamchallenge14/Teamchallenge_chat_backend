/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { type CreatedUserDto } from '@/modules/auth/dto/created-user.dto';
import { type AuthProvider } from '@/modules/auth/enums/auth-provider.enum';
import { type Permission } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?:
        | CreatedUserDto
        | {
            id?: string;
            provider?: AuthProvider;
            providerId?: string;
            email?: string;
            login?: string;
          };
      tenantId?: string;
      permissions?: Permission[];
    }
  }
}

export {};
