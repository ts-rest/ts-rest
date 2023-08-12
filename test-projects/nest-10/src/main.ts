import { NestFactory } from '@nestjs/core';
import { initContract } from '@ts-rest/core';
import { AppModule } from './app.module';

const c = initContract();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
