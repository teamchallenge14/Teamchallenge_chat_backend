import fs from 'fs';
import path from 'path';

export function createLogStream(logDir: string, fileName: string) {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return fs.createWriteStream(path.join(logDir, fileName), {
    flags: 'a',
  });
}
