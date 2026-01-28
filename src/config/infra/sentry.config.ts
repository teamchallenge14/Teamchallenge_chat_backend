import * as Joi from 'joi';
import { validateEnv } from '../_env-validator';

const schema = Joi.object({
  SENTRY_DSN: Joi.string().uri().required(),
  SENTRY_ENV: Joi.string().required(),
  SENTRY_ENABLED: Joi.boolean().required(),
}).unknown(true);

const env = validateEnv(schema, 'sentry');

export const sentryConfig = {
  dsn: env.SENTRY_DSN as string,
  environment: env.SENTRY_ENV as string,
  enabled: env.SENTRY_ENABLED,
} as const;
