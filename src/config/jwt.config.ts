import * as Joi from 'joi';
import { validateEnv } from './_env-validator';
import { type StringValue } from 'ms';

const schema = Joi.object({
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().required(),
}).unknown(true);

const env = validateEnv(schema, 'jwt');

export const jwtConfig = {
  secret: env.JWT_SECRET as string,
  expiresIn: env.JWT_EXPIRES_IN as StringValue,
  refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN as StringValue,
} as const;
