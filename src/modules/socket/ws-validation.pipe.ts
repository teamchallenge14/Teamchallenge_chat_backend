import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { plainToInstance } from 'class-transformer';
import { type ValidationError, validate } from 'class-validator';

type ClassType = new (...args: never[]) => object;

@Injectable()
export class WsValidationPipe implements PipeTransform<unknown> {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    const metatype = metadata.metatype;

    if (!metatype || !this.shouldValidate(metatype)) {
      return value;
    }

    const payload = this.isObject(value) ? value : {};
    const instance = plainToInstance(metatype, payload);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length === 0) {
      return instance;
    }

    const message = this.collectMessages(errors).join('; ') || 'Invalid payload';
    throw new WsException({
      code: 'BAD_REQUEST',
      message,
    });
  }

  private shouldValidate(metatype: unknown): metatype is ClassType {
    const primitiveTypes: unknown[] = [String, Boolean, Number, Array, Object];
    return !primitiveTypes.includes(metatype);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private collectMessages(errors: ValidationError[], messages: string[] = []): string[] {
    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }

      if (error.children?.length) {
        this.collectMessages(error.children, messages);
      }
    }

    return Array.from(new Set(messages.map((message) => message.trim()).filter(Boolean)));
  }
}
