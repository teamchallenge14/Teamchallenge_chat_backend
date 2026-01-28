import * as Joi from 'joi';
import { validateEnv } from '../_env-validator';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().required(),
  SWAGGER_PATH: Joi.string().default('/api'),
  FRONTEND_URL: Joi.string().uri().required(),
}).unknown(true);

const env = validateEnv(schema, 'app');

export const appConfig = {
  nodeEnv: env.NODE_ENV as 'development' | 'production' | 'test',
  port: env.PORT as number,
  swaggerPath: env.SWAGGER_PATH as string,
  frontendUrl: env.FRONTEND_URL as string,
} as const;
