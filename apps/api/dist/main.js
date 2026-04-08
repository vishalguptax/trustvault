"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const database_service_1 = require("./database/database.service");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });
    // --- Database connection ---
    const db = app.get(database_service_1.DatabaseService);
    await db.connect();
    if (!db.isConnected()) {
        logger.error('Database is not connected. Exiting.');
        logger.error('Ensure DATABASE_URL is set in apps/api/.env');
        await app.close();
        process.exit(1);
    }
    // --- Security headers ---
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: false,
    }));
    // --- Response compression (skip responses < 1KB) ---
    app.use((0, compression_1.default)({ threshold: 1024 }));
    // --- Global pipes, filters, interceptors ---
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // --- CORS ---
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
        credentials: true,
    });
    // --- Swagger ---
    const port = process.env.PORT || 8000;
    const config = new swagger_1.DocumentBuilder()
        .setTitle('TrustiLock API')
        .setDescription('Verifiable Credential ecosystem — issuer, wallet, verifier, trust registry.\n\n' +
        '**Protocols:** OID4VCI, OID4VP, SD-JWT-VC, Bitstring Status List\n\n' +
        '**Credential Types:** Education, Income, Identity')
        .setVersion('0.1.0')
        .addBearerAuth()
        .addServer(process.env.API_BASE_URL || `http://localhost:${port}`, 'Local development')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    // --- Graceful shutdown ---
    app.enableShutdownHooks();
    // --- Start ---
    await app.listen(port, '0.0.0.0');
    logger.log('===========================================');
    logger.log(`  TrustiLock API v0.1.0`);
    logger.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`  Port: ${port}`);
    logger.log(`  Database: connected`);
    logger.log(`  API: http://localhost:${port}`);
    logger.log(`  Swagger: http://localhost:${port}/api/docs`);
    logger.log('===========================================');
    const shutdown = async (signal) => {
        logger.warn(`${signal} received. Shutting down...`);
        await app.close();
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
bootstrap().catch((err) => {
    const logger = new common_1.Logger('Bootstrap');
    logger.error('Failed to start application', err.stack || err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map