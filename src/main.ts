import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { initSentry } from './sentry/sentry.config';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { SentryExceptionFilter } from './sentry/sentry.filter';
import { Logger } from 'nestjs-pino';
import { createLogStream } from './logger/log-stream';

import './config';
import { appConfig, corsConfig, loggerConfig } from './config';
import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // LOGGER
  const logger = app.get(Logger);
  app.useLogger(logger);

  // SENTRY INIT
  initSentry();

  // GLOBAL INTERCEPTORS
  app.useGlobalInterceptors(new RequestIdInterceptor());

  // GLOBAL PIPES
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // GLOBAL FILTERS
  app.useGlobalFilters(new SentryExceptionFilter(), new HttpExceptionFilter());

  // EXPRESS MIDDLEWARE
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: corsConfig.origins,
    credentials: true,
  });

  // MORGAN
  const accessLogStream = createLogStream(loggerConfig.dir, loggerConfig.morgan.accessLog);

  const errorLogStream = createLogStream(loggerConfig.dir, loggerConfig.morgan.errorLog);

  app.use(
    morgan('dev', {
      stream: accessLogStream,
    }),
  );

  app.use(
    morgan('dev', {
      skip: (_, res) => res.statusCode < 500,
      stream: errorLogStream,
    }),
  );

  // SWAGGER
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TeamChallengeChatApi')
    .setDescription('API for TeamChallengeChat')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(appConfig.swaggerPath, app, document, {
    swaggerOptions: {
      requestInterceptor: (req) => {
        req.headers['accept'] = 'application/json';
        return req;
      },
    },
  });

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
