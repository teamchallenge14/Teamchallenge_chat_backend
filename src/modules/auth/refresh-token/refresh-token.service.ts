import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly model: Model<RefreshTokenDocument>,
  ) {}

  generate(): string {
    return randomBytes(64).toString('hex');
  }

  async save(userId: string, token: string): Promise<void> {
    const hash = await bcrypt.hash(token, 10);

    await this.model.create({
      userId,
      tokenHash: hash,
    });
  }
  async validate(token: string): Promise<RefreshToken> {
    const records = await this.model.find();

    for (const record of records) {
      const isMatch = await bcrypt.compare(token, record.tokenHash);
      if (isMatch) return record;
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async rotate(oldToken: string, userId: string): Promise<string> {
    await this.model.deleteOne({ userId });

    const newToken = this.generate();
    await this.save(userId, newToken);

    return newToken;
  }

  async removeByUserId(userId: number): Promise<void> {
    await this.model.deleteMany({ userId });
  }
}
