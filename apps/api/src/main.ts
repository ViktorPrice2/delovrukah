import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './adapters/socket-io.adapter';
import { AppLogger } from './logger/app-logger';

async function bootstrap() {
  const logger = new AppLogger('ApiBootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);
  app.flushLogs();
  const configService = app.get(ConfigService);
  app.useWebSocketAdapter(new SocketIoAdapter(app, configService));
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = 3001; // Задаем порт в переменную
  await app.listen(port);
  logger.log(`API is running on: http://localhost:${port}`);
}

void bootstrap();
