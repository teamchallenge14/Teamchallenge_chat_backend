import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { initSentry } from './infra/sentry/sentry.config';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { Logger } from 'nestjs-pino';
import { createLogStream } from './infra/logger/log-stream';

import './config';
import { appConfig, corsConfig, loggerConfig } from './config';
import { buildSwaggerConfig } from '@src/infra/swagger/swagger.config';
import { GlobalExceptionFilter } from '@src/common/filters/global-exception.filter';
import { ChangelogService } from '@src/common/changelog/changelog.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // SENTRY
  initSentry();

  // GLOBALS
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  // app.useGlobalFilters(new SentryExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: corsConfig.origins,
    credentials: true,
  });

  // logs
  // pino

  const logger = app.get(Logger);
  app.useLogger(logger);

  // MORGAN
  const accessLogStream = createLogStream(loggerConfig.dir, loggerConfig.morgan.accessLog);

  const errorLogStream = createLogStream(loggerConfig.dir, loggerConfig.morgan.errorLog);

  if (appConfig.nodeEnv) {
    // access log
    app.use(
      morgan('dev', {
        stream: accessLogStream,
      }),
    );

    // morgan error log
    app.use(
      morgan('dev', {
        skip: (_, res) => res.statusCode < 500,
        stream: errorLogStream,
      }),
    );
  } else {
    // morgan prod
    app.use(
      morgan('combined', {
        skip: (_, res) => res.statusCode < 500,
        stream: errorLogStream,
      }),
    );
  }

  // SWAGGER
  const changelogService = app.get(ChangelogService);

  const swaggerConfig = await buildSwaggerConfig(changelogService);

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(appConfig.swaggerPath, app, document);

  await app.listen(appConfig.port);

  logger.log(
    {
      nodeEnv: appConfig.nodeEnv,
      port: appConfig.port,
    },
    'Application started',
  );
}

void bootstrap();
