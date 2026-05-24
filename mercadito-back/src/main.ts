import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // 👈 Habilitar CORS para evitar el Network Error en el frontend

  app.setGlobalPrefix('api'); // 👈 prefijo global, aquí se guardan todas las rutas

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // lanza error 400 si envían campos extra no permitidos
      transform: true,            // convierte automáticamente tipos (ej. string "1" → number)
    }),
  );

  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ];
  
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on port ${port}`);
}
bootstrap();