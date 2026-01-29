import { get } from 'env-var';

export const appConfig = {
  nodeEnv: get('NODE_ENV').required().asEnum(['development', 'production', 'test']),

  port: get('PORT').required().asPortNumber(),

  swaggerPath: get('SWAGGER_PATH').default('/api').asString(),

  frontendUrl: get('FRONTEND_URL').required().asUrlString(),
} as const;
