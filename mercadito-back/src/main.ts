import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // 👈 prefijo global, aquí se guardan todas las rutas 

  await app.listen(3000);
}
bootstrap();