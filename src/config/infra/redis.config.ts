import * as Joi from 'joi';
import { validateEnv } from '../_env-validator';

const schema = Joi.object({
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
}).unknown(true);

const env = validateEnv(schema, 'redis');

export const redisConfig = {
  host: env.REDIS_HOST as string,
  port: env.REDIS_PORT as number,
  password: env.REDIS_PASSWORD as string | undefined,
} as const;
