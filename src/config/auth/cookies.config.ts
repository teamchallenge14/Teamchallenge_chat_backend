import { get } from 'env-var';

type SameSite = 'strict' | 'lax' | 'none';

export const cookiesConfig = {
  secure: get('COOKIES_SECURE').default('true').asBool(),

  sameSite: get('COOKIES_SAMESITE').default('strict').asEnum<SameSite>(['strict', 'lax', 'none']),

  accessMaxAge: get('ACCESS_COOKIE_MAX_AGE')
    .default('900000') // 15 min
    .asInt(),

  refreshMaxAge: get('REFRESH_COOKIE_MAX_AGE')
    .default('2592000000') // 30 days
    .asInt(),
} as const;
