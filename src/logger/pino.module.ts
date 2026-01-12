import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import pretty from 'pino-pretty';
import { appConfig, loggerConfig } from 'src/config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => {
        const nodeEnv = appConfig.nodeEnv;
        const isProduction = nodeEnv === 'production';

        // Production: JSON to stdout, no files, minimal logging
        if (isProduction) {
          return {
            pinoHttp: {
              level: 'warn',
              autoLogging: false, // Disable automatic request logging in production

              serializers: {
                req(req) {
                  return {
                    method: req.method,
                    url: req.url,
                  };
                },

                res(res) {
                  return {
                    statusCode: res.statusCode,
                  };
                },

                err(err) {
                  return {
                    type: err.type,
                    message: err.message,
                    stack: err.stack,
                  };
                },
              },
              redact: ['req.headers.authorization', 'req.headers["set-cookie"]'],
            },
          };
        }

        // Development: Pretty console + file logging
        const logDirFromEnv = loggerConfig.dir;
        const logDir = path.resolve(process.cwd(), logDirFromEnv);
        fs.mkdirSync(logDir, { recursive: true });

        const simpleLog = path.join(logDir, 'pino.log');
        const detailedLog = path.join(logDir, 'pino-detailed.log');
        const errorLog = path.join(logDir, 'pino-error.log');

        const streams: pino.StreamEntry[] = [
          {
            level: 'info',
            stream: pretty({
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname,req.headers,res.headers',
            }),
          },

          {
            level: 'info',
            stream: pino.destination({
              dest: simpleLog,
              sync: false,
            }),
          },
          {
            level: 'debug',
            stream: pino.destination({
              dest: detailedLog,
              sync: false,
            }),
          },

          {
            level: 'error',
            stream: pino.destination({
              dest: errorLog,
              sync: false,
            }),
          },
        ];

        return {
          pinoHttp: {
            level: 'debug',
            autoLogging: true,

            stream: pino.multistream(streams),

            serializers: {
              req(req) {
                return {
                  method: req.method,
                  url: req.url,
                  cookies: req.headers?.cookie,
                };
              },

              res(res) {
                return {
                  statusCode: res.statusCode,
                };
              },

              err(err) {
                return {
                  type: err.type,
                  message: err.message,
                  stack: err.stack,
                };
              },
            },
            redact: ['req.headers.authorization', 'req.headers["set-cookie"]'],
          },
        };
      },
    }),
  ],
})
export class PinoLoggerModule {}
