import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  RequiredPermissionConfig,
} from '../decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AccountStatus, Permission } from '@prisma/client';
import { UsersRepository } from '@src/modules/users/repository/users.repository';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private UserRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const config = this.reflector.getAllAndOverride<RequiredPermissionConfig>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!config) {
      throw new ForbiddenException('No permissions defined');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    if (!user?.id) {
      throw new UnauthorizedException();
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant missing');
    }

    // check if permissions exist
    if (!request.permissions) {
      const TenantUser = await this.UserRepository.getTenantUserWithPermissions(user.id, tenantId);

      if (!TenantUser?.permissions) {
        throw new ForbiddenException('User not in tenant');
      }
      if (TenantUser.tenantStatus !== AccountStatus.ACTIVE) {
        throw new ForbiddenException('User blocked');
      }

      const permissions = TenantUser.permissions.map((p) => p.permission);

      request.permissions = permissions;
    }

    const userPermissions: Permission[] = request.permissions;

    const { permissions, selfParam } = config;

    // check full permissions
    const hasFullPermission = permissions.some((perm) => userPermissions.includes(perm));

    if (hasFullPermission) {
      return true;
    }

    //  Self permissions
    if (selfParam) {
      const paramValue = request.params?.[selfParam];

      if (!paramValue) {
        throw new ForbiddenException('Self param missing');
      }

      const isSelf = String(paramValue) === String(user.id);

      if (isSelf) {
        const selfPermissions = permissions.filter((perm) => perm.endsWith('.self'));

        const hasSelfPermission = selfPermissions.some((perm) => userPermissions.includes(perm));

        if (hasSelfPermission) {
          return true;
        }
      }
    }

    throw new ForbiddenException('Permission denied');
  }
}
