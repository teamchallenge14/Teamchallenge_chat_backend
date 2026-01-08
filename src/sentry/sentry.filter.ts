import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();

      if (statusCode < 500) {
        throw exception;
      }
    }

    Sentry.captureException(exception);

    throw exception;
  }
}
