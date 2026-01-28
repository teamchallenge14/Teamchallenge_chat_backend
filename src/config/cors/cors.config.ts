import * as Joi from 'joi';
import { validateEnv } from '../_env-validator';

const schema = Joi.object({
  CORS_ORIGINS: Joi.string().required(),
}).unknown(true);

const env = validateEnv(schema, 'cors');

export const corsConfig = {
  origins: env.CORS_ORIGINS.split(',').map((o: string) => o.trim()),
} as const;
