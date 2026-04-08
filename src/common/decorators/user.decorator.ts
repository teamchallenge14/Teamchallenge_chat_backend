import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const UserDecorator = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<{
      user?: Record<string, unknown>;
    }>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }

    if (!field) {
      return user;
    }

    const value = user[field];

    if (value === undefined || value === null) {
      throw new UnauthorizedException(`User field "${field}" is missing`);
    }

    return value;
  },
);
