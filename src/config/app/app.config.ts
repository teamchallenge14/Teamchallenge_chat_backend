import { get } from 'env-var';

const defaultPublicApiBaseUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://dev-api.alicesocial.pp.ua'
    : 'http://localhost:3000';

export const appConfig = {
  nodeEnv: get('NODE_ENV').required().asEnum(['development', 'production', 'test']),

  port: get('PORT').required().asPortNumber(),

  swaggerPath: get('SWAGGER_PATH').default('/api').asString(),

  frontendUrl: get('FRONTEND_URL').required().asUrlString(),

  publicApiBaseUrl: get('PUBLIC_API_BASE_URL').default(defaultPublicApiBaseUrl).asUrlString(),
} as const;
