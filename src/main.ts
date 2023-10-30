import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { GlobalExceptionFilter } from './unit/global-exception-filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3000;
  app.useGlobalPipes(new ValidationPipe());
  // app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(PORT);
}
bootstrap();
