import { DocumentBuilder } from '@nestjs/swagger';
import { type ChangelogService } from '../../common/changelog/changelog.service';
import { AUTH_COOKIES } from '@src/modules/auth/constants/auth-cookies.constants';
import { appConfig } from '@src/config';

export async function buildSwaggerConfig(changelogService: ChangelogService) {
  const changelog = await changelogService.getForSwagger();
  const baseUrl = appConfig.publicApiBaseUrl.replace(/\/$/, '');
  const asyncApiRawUrl = `${baseUrl}/docs/asyncapi/socket.asyncapi.yaml`;
  const asyncApiStudioUrl = `${baseUrl}/docs/asyncapi/studio`;

  return new DocumentBuilder()
    .setTitle('TeamChallengeChatApi')
    .setVersion('0.0.1')
    .setDescription(
      `
API for QTalk

Socket docs:
- AsyncAPI YAML: [${asyncApiRawUrl}](${asyncApiRawUrl})
- Open in Studio: [${asyncApiStudioUrl}](${asyncApiStudioUrl})

${changelog}
`,
    )
    .setExternalDoc('Socket API (Open in Studio)', asyncApiStudioUrl)
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
