import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ChangelogParser } from './changelog.parser';

@Injectable()
export class ChangelogService {
  private readonly logger = new Logger(ChangelogService.name);
  private raw?: string;
  private loadFailed = false;

  async getForSwagger(): Promise<string> {
    if (!this.raw && !this.loadFailed) {
      try {
        this.raw = await fs.readFile(join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
      } catch {
        this.loadFailed = true;

        this.logger.warn(
          'CHANGELOG.md not found or unreadable, Swagger will be generated without changelog',
        );

        return '';
      }
    }

    if (!this.raw) {
      return '';
    }

    return ChangelogParser.toCollapsibleSections(this.raw, 3);
  }
}
