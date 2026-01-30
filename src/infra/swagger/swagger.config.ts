import { DocumentBuilder } from '@nestjs/swagger';
import { ChangelogService } from '../../common/changelog/changelog.service';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';

export function buildSwaggerConfig() {
  const changelog = new ChangelogService().getForSwagger();

  return new DocumentBuilder()
    .setTitle('TeamChallengeChatApi')
    .setVersion('0.0.1')
    .setDescription(
      `
API for QTalk

${changelog}
`,
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste access token here',
      },
      AUTH_COOKIES.ACCESS_TOKEN,
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste access token here',
      },
      AUTH_COOKIES.REFRESH_TOKEN,
    )
    .build();
}
