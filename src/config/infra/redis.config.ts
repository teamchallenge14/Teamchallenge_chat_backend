import { get } from 'env-var';

export const redisConfig = {
  host: get('REDIS_HOST').required().asString(),

  port: get('REDIS_PORT').required().asPortNumber(),

  password: get('REDIS_PASSWORD').default('').asString() || undefined,
} as const;
