import * as Sentry from '@sentry/nestjs';
import { sentryConfig } from 'src/config';

export function initSentry() {
  if (!sentryConfig.enabled) {
    return;
  }
  const dsn = sentryConfig.dsn;
  const env = sentryConfig.environment;

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === 'production' ? 0.2 : 1.0,
  });
}
