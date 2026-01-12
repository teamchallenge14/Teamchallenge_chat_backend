import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) throw new UnauthorizedException();

    Sentry.setUser({
      id: user.id,
      email: user.email,
    });

    return true;
  }
}
