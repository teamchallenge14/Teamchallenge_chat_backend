import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { randomUUID } from 'crypto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const type = host.getType();

    // http
    if (type === 'http') {
      const ctx = host.switchToHttp();
      const res = ctx.getResponse<Response>();
      const req = ctx.getRequest<Request>();

      const timestamp = new Date().toISOString();
      const path = req.url;

      if (exception instanceof HttpException) {
        const status = exception.getStatus();
        const response = exception.getResponse();

        return res.status(status).json({
          statusCode: status,
          error: exception.name,
          message: typeof response === 'string' ? response : (response as any).message,
          path,
          timestamp,
        });
      }

      // 5xx
      const traceId = `ERR-${randomUUID().slice(0, 8)}`;

      Sentry.captureException(exception, {
        tags: { traceId },
      });

      return res.status(500).json({
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected error occurred',
        traceId,
        path,
        timestamp,
      });
    }

    // ws
    if (type === 'ws') {
      Sentry.captureException(exception, {
        tags: { transport: 'ws', notImplemented: 'true' },
      });

      throw exception;
    }

    throw exception;
  }
}
