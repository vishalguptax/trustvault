import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // --- Database readiness check ---
  const prisma = app.get(PrismaService);
  const dbConnected = prisma.isConnected();
  if (!dbConnected) {
    logger.error('Database is not connected. Exiting.');
    logger.error('Ensure DATABASE_URL is set in apps/api/.env');
    await app.close();
    process.exit(1);
  }
  logger.log('Database connection verified');

  // --- Global pipes, filters, interceptors ---
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- CORS ---
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  });

  // --- Swagger ---
  const port = process.env.PORT || 8000;
  const config = new DocumentBuilder()
    .setTitle('TrustVault API')
    .setDescription(
      'Verifiable Credential ecosystem — issuer, wallet, verifier, trust registry.\n\n' +
      '**Protocols:** OID4VCI, OID4VP, SD-JWT-VC, Bitstring Status List\n\n' +
      '**Credential Types:** Education, Income, Identity',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}`, 'Local development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // --- Graceful shutdown ---
  app.enableShutdownHooks();

  // --- Start ---
  await app.listen(port);

  logger.log('===========================================');
  logger.log(`  TrustVault API v0.1.0`);
  logger.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`  Port: ${port}`);
  logger.log(`  Database: connected`);
  logger.log(`  API: http://localhost:${port}`);
  logger.log(`  Swagger: http://localhost:${port}/api/docs`);
  logger.log('===========================================');
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err.stack || err);
  process.exit(1);
});
