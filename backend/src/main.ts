import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // ====================== SECURITY ======================
  app.use(
    helmet({
      contentSecurityPolicy: isProduction,
      crossOriginEmbedderPolicy: isProduction,
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'],
  });

  // ====================== GLOBAL SETTINGS ======================
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ====================== GLOBAL GUARDS ======================
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );

  // ====================== SWAGGER ======================
  if (!isProduction) {
    const config = new DocumentBuilder()
    .setTitle('Kira API')
    .setDescription(
      `## Kira — AI Food Delivery Platform\n\n` +
      `**Auth Flow:** Login → Access Token (Bearer) + Refresh Token (HttpOnly Cookie)\n` +
      `Use Postman/Insomnia for full testing of refresh tokens.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'BearerAuth',
    )
    .addTag('Auth')
    .addTag('Restaurants')
    .addTag('Restaurant Managers')
    .addTag('Restaurant Payments')
    .addTag('Restaurant Menus')
    .addTag('Cart')
    .addTag('Orders')
    .addTag('Payments')
    .addTag('Kitchen')
    .addTag('Delivery')
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
      },
    });

    console.log(`Swagger UI: http://localhost:${port}/docs`);
  }

  // ====================== START ======================
  await app.listen(port);
  console.log(`Kira API running on: http://localhost:${port}/api/v1`);
}

bootstrap();