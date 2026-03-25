import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { type Socket } from 'socket.io';
import { type SocketAck } from './socket.types';

type WsErrorPayload = {
  code: string;
  message: string;
};

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'ws') {
      throw exception;
    }

    const ws = host.switchToWs();
    const client = ws.getClient<Socket>();
    const ack = host.getArgByIndex<SocketAck | undefined>(2);

    const payload = this.normalizeException(exception);

    if (typeof ack === 'function') {
      ack({
        ok: false,
        message: payload.message,
      });
    }

    client.emit('ws:error', payload);
  }

  private normalizeException(exception: unknown): WsErrorPayload {
    if (exception instanceof WsException) {
      return this.normalizeWsExceptionError(exception.getError());
    }

    if (exception instanceof HttpException) {
      return {
        code: this.mapHttpStatusToCode(exception.getStatus()),
        message: this.extractHttpExceptionMessage(exception),
      };
    }

    if (exception instanceof Error) {
      return {
        code: 'INTERNAL_ERROR',
        message: exception.message || 'Unexpected error occurred',
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred',
    };
  }

  private normalizeWsExceptionError(error: string | object): WsErrorPayload {
    if (typeof error === 'string') {
      return {
        code: 'BAD_REQUEST',
        message: error,
      };
    }

    if (
      this.isObject(error) &&
      typeof error.code === 'string' &&
      typeof error.message === 'string'
    ) {
      return {
        code: error.code,
        message: error.message,
      };
    }

    if (this.isObject(error) && Array.isArray(error.message)) {
      const message = error.message.filter((item) => typeof item === 'string').join('; ');
      return {
        code: 'BAD_REQUEST',
        message: message || 'Invalid payload',
      };
    }

    if (this.isObject(error) && typeof error.message === 'string') {
      return {
        code: 'BAD_REQUEST',
        message: error.message,
      };
    }

    return {
      code: 'BAD_REQUEST',
      message: 'Invalid payload',
    };
  }

  private extractHttpExceptionMessage(exception: HttpException): string {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (!this.isObject(response)) {
      return exception.message;
    }

    if (Array.isArray(response.message)) {
      const message = response.message.filter((item) => typeof item === 'string').join('; ');
      return message || exception.message;
    }

    if (typeof response.message === 'string') {
      return response.message;
    }

    return exception.message;
  }

  private mapHttpStatusToCode(status: number): string {
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    return 'INTERNAL_ERROR';
  }

  private isObject(value: unknown): value is { code?: unknown; message?: unknown } {
    return typeof value === 'object' && value !== null;
  }
}
