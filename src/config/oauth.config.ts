import * as Joi from 'joi';
import { validateEnv } from './_env-validator';

const schema = Joi.object({
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),

  GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),

  FACEBOOK_APP_ID: Joi.string().required(),
  FACEBOOK_APP_SECRET: Joi.string().required(),
}).unknown(true);

const env = validateEnv(schema, 'oauth');

export const oauthConfig = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID as string,
    clientSecret: env.GOOGLE_CLIENT_SECRET as string,
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID as string,
    clientSecret: env.GITHUB_CLIENT_SECRET as string,
  },
  facebook: {
    appId: env.FACEBOOK_APP_ID as string,
    appSecret: env.FACEBOOK_APP_SECRET as string,
  },
} as const;
