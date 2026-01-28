import { readFileSync } from 'fs';
import { join } from 'path';
import { ChangelogParser } from './changelog.parser';

export class ChangelogService {
  private readonly raw: string;

  constructor() {
    this.raw = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
  }

  getForSwagger(): string {
    return ChangelogParser.toCollapsibleSections(this.raw, 3);
  }
}
