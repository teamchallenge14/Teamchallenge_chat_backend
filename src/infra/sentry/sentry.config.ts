import * as Sentry from '@sentry/nestjs';
import { appConfig, sentryConfig } from '@src/config';

export function initSentry() {
  if (!sentryConfig.enabled) {
    return;
  }
  const dsn = sentryConfig.dsn;
  const env = appConfig.nodeEnv;

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === 'production' ? 0.2 : 1.0,
  });
}
