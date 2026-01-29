import { get } from 'env-var';

export const loggerConfig = {
  dir: get('LOG_DIR').default('logs').asString(),

  morgan: {
    accessLog: get('MORGAN_ACCESS_LOG').default('access.log').asString(),

    errorLog: get('MORGAN_ERROR_LOG').default('error.log').asString(),
  },

  pino: {
    level: get('PINO_LOG_LEVEL')
      .default('info')
      .asEnum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  },
} as const;
