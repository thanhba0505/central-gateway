import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '../.env.local' });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { APP_VERSION } from './common/version';
import { AppModule } from './app.module';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const defaultOrigins = [
    'http://localhost:5100',
    'http://localhost:5000',
    'http://localhost:4100',
    'http://localhost:3000',
    'https://central-gateway-client.vercel.app',
    'https://wonderlab-client.vercel.app',
    'https://wonderlab.io.vn',
    'https://www.wonderlab.io.vn',
  ];

  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [];

  const corsOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Central Gateway API & SSO IAM')
    .setDescription(
      'Centralized Single Sign-On IAM Hub, notifications, and platform services for the Prism ecosystem',
    )
    .setVersion(APP_VERSION)
    .addBearerAuth()
    .addCookieAuth('gateway_session')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const port = process.env.SERVER_PORT || process.env.PORT || 5101;
  await app.listen(port);
  console.log(`🚀 Central Gateway Server running on http://localhost:${port}/api/v1`);
  console.log(`📑 Swagger Documentation available at http://localhost:${port}/api/docs`);
}

if (!process.env.VERCEL) {
  bootstrap();
}
