import { get } from 'env-var';

export const redisConfig = {
  url: get('REDIS_URL').default('').asString() || undefined,
  host: get('REDIS_HOST').default('localhost').asString(),
  port: get('REDIS_PORT').default('6379').asPortNumber(),
  username: get('REDIS_USERNAME').default('').asString() || undefined,
  password: get('REDIS_PASSWORD').default('').asString() || undefined,
  tls: get('REDIS_TLS').default('false').asBool(),
} as const;
