import { get } from 'env-var';

export const dbConfig = {
  postgres: {
    url: get('POSTGRES_DATABASE_URL').required().asUrlString(),
  },

  mongo: {
    url: get('MONGO_DATABASE_URL').required().asUrlString(),
  },
} as const;
