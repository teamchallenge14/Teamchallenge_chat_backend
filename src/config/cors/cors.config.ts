import { get } from 'env-var';

export const corsConfig = {
  origins: get('CORS_ORIGINS')
    .required()
    .asString()
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;
