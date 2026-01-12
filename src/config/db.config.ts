import * as Joi from 'joi';
import { validateEnv } from './_env-validator';

const schema = Joi.object({
  POSTGRES_DATABASE_URL: Joi.string().uri().required(),
  MONGO_DATABASE_URL: Joi.string().uri().required(),
}).unknown(true);

const env = validateEnv(schema, 'db');

export const dbConfig = {
  postgres: {
    url: env.POSTGRES_DATABASE_URL as string,
  },

  mongo: {
    url: env.MONGO_DATABASE_URL as string,
  },
} as const;
