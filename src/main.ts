import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { initSentry } from './sentry/sentry.config';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { SentryExceptionFilter } from './sentry/sentry.filter';
import { Logger } from 'nestjs-pino';
import { createLogStream } from './logger/log-stream';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const env = config.getOrThrow<string>('NODE_ENV');
  const port = config.getOrThrow<number>('PORT');
  const swaggerPath = config.getOrThrow<string>('SWAGGER_PATH');
  const corsOrigins = config.getOrThrow<string>('CORS_ORIGINS').split(',');
  const logDir = config.getOrThrow<string>('LOG_DIR');

  // SENTRY
  initSentry(config);

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
    origin: corsOrigins,
    credentials: true,
  });

  // logs
  const accessLogStream = createLogStream(logDir, config.getOrThrow<string>('MORGAN_ACCESS_LOG'));

  const errorLogStream = createLogStream(logDir, config.getOrThrow<string>('MORGAN_ERROR_LOG'));
  // MORGAN
  if (env !== 'production') {
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
  SwaggerModule.setup(swaggerPath, app, document);

  const logger = app.get(Logger);

  await app.listen(port);

  logger.log(
    {
      env,
      port,
    },
    'Application started',
  );
}

void bootstrap();
