import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { type RedisOptions } from 'ioredis';
import { redisConfig } from '@src/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    this.client = this.createClient();
    this.attachEventListeners();
  }

  private createClient(): Redis {
    if (redisConfig.url) {
      return new Redis(redisConfig.url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
    }

    const options: RedisOptions = {
      host: redisConfig.host,
      port: redisConfig.port,
      username: redisConfig.username,
      password: redisConfig.password,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      tls: redisConfig.tls ? {} : undefined,
    };

    return new Redis(options);
  }

  private attachEventListeners() {
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('ready', () => this.logger.log('Redis ready'));
    this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting'));
    this.client.on('close', () => this.logger.warn('Redis connection closed'));
    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  async onModuleInit() {
    if (this.client.status === 'ready' || this.client.status === 'connecting') {
      return;
    }

    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error(
        `Redis initial connect failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect(false);
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  isReady(): boolean {
    return this.client.status === 'ready';
  }
}
