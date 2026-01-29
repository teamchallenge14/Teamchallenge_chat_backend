import { get } from 'env-var';
import { type StringValue } from 'ms';

export const jwtConfig = {
  secret: get('JWT_SECRET').required().asString(),

  expiresIn: get('JWT_EXPIRES_IN').required().asString() as StringValue,

  refreshExpiresIn: get('REFRESH_TOKEN_EXPIRES_IN').required().asString() as StringValue,
} as const;
