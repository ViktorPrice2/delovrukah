import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = 3001; // Задаем порт в переменную
  await app.listen(port);
  // Вот эта строка - самая важная для нас сейчас
  console.log(`API is running on: http://localhost:${port}`);
}

void bootstrap();
