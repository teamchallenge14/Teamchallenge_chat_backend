import { DocumentBuilder } from '@nestjs/swagger';
import { type ChangelogService } from '../../common/changelog/changelog.service';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';

export async function buildSwaggerConfig(changelogService: ChangelogService) {
  const changelog = await changelogService.getForSwagger();

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
