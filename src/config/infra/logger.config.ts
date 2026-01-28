import * as Joi from 'joi';
import { validateEnv } from '../_env-validator';

const schema = Joi.object({
  LOG_DIR: Joi.string().default('logs'),

  // Morgan
  MORGAN_ACCESS_LOG: Joi.string().default('access.log'),
  MORGAN_ERROR_LOG: Joi.string().default('error.log'),

  // Pino
  PINO_LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
}).unknown(true);

const env = validateEnv(schema, 'logger');

export const loggerConfig = {
  dir: env.LOG_DIR,

  morgan: {
    accessLog: env.MORGAN_ACCESS_LOG,
    errorLog: env.MORGAN_ERROR_LOG,
  },

  pino: {
    level: env.PINO_LOG_LEVEL,
  },
} as const;
