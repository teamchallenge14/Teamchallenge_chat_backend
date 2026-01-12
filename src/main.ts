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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // const env = config.getOrThrow<string>('NODE_ENV');
  // const port = config.getOrThrow<number>('PORT');
  // const swaggerPath = config.getOrThrow<string>('SWAGGER_PATH');
  // const corsOrigins = config.getOrThrow<string>('CORS_ORIGINS').split(',');
  // const logDir = config.getOrThrow<string>('LOG_DIR');

  // // SENTRY
  initSentry();

  // GLOBALS
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.useGlobalFilters(new SentryExceptionFilter());
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TeamChallengeChatApi')
    .setDescription('API for TeamChallengeChat')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

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
