import * as Sentry from '@sentry/nestjs';
import { type ConfigService } from '@nestjs/config';

export function initSentry(config: ConfigService) {
  const dsn = config.getOrThrow<string>('SENTRY_DSN');
  const env = config.getOrThrow<string>('NODE_ENV');

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === 'production' ? 0.2 : 1.0,
  });
}
