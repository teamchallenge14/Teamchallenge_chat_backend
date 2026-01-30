import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ChangelogParser } from './changelog.parser';

@Injectable()
export class ChangelogService {
  private raw?: string;

  async getForSwagger(): Promise<string> {
    if (!this.raw) {
      try {
        this.raw = await fs.readFile(join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
      } catch {
        // сервер може бути без файлу — не падаємо
        return '';
      }
    }

    return ChangelogParser.toCollapsibleSections(this.raw, 3);
  }
}
