import { get } from 'env-var';

export const oauthConfig = {
  google: {
    clientId: get('GOOGLE_CLIENT_ID').required().asString(),

    clientSecret: get('GOOGLE_CLIENT_SECRET').required().asString(),
  },

  github: {
    clientId: get('GITHUB_CLIENT_ID').required().asString(),

    clientSecret: get('GITHUB_CLIENT_SECRET').required().asString(),
  },

  facebook: {
    appId: get('FACEBOOK_APP_ID').required().asString(),

    appSecret: get('FACEBOOK_APP_SECRET').required().asString(),
  },
} as const;
