import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { resolve } from 'path';
import { configuration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { DidModule } from './modules/did/did.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { IssuerModule } from './modules/issuer/issuer.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { StatusModule } from './modules/status/status.module';
import { TrustModule } from './modules/trust/trust.module';
import { VerifierModule } from './modules/verifier/verifier.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '../../.env'),
      ],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    PrismaModule,
    DidModule,
    CryptoModule,
    IssuerModule,
    WalletModule,
    StatusModule,
    TrustModule,
    VerifierModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, LoggingMiddleware)
      .forRoutes('*');
  }
}
