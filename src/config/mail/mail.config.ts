import * as Joi from 'joi';
import { validateEnv } from '../_env-validator';

const schema = Joi.object({
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),
}).unknown(true);

const env = validateEnv(schema, 'mail');

export const mailConfig = {
  host: env.MAIL_HOST as string,
  port: env.MAIL_PORT as number,
  user: env.MAIL_USER as string,
  pass: env.MAIL_PASS as string,
  from: env.MAIL_FROM as string,
} as const;
