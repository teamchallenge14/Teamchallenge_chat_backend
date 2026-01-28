import { DocumentBuilder } from '@nestjs/swagger';
import { ChangelogService } from '../../common/changelog/changelog.service';

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
    .addBearerAuth()
    .build();
}
