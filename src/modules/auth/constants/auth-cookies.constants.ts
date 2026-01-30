export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'access-token',
  REFRESH_TOKEN: 'refresh-token',
} as const;

export type AuthCookieName = (typeof AUTH_COOKIES)[keyof typeof AUTH_COOKIES];
