import { get } from 'env-var';

export const sentryConfig = {
  dsn: get('SENTRY_DSN').required().asUrlString(),

  environment: get('SENTRY_ENV').required().asString(),

  enabled: get('SENTRY_ENABLED').required().asBool(),
} as const;
