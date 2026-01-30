import { get } from 'env-var';

export const mailConfig = {
  host: get('MAIL_HOST').required().asString(),
  port: get('MAIL_PORT').required().asPortNumber(),
  user: get('MAIL_USER').required().asString(),
  pass: get('MAIL_PASS').required().asString(),
  from: get('MAIL_FROM').required().asString(),
} as const;
