import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { DidModule } from './modules/did/did.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { IssuerModule } from './modules/issuer/issuer.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { StatusModule } from './modules/status/status.module';
import { TrustModule } from './modules/trust/trust.module';
import { VerifierModule } from './modules/verifier/verifier.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    DidModule,
    CryptoModule,
    IssuerModule,
    WalletModule,
    StatusModule,
    TrustModule,
    VerifierModule,
  ],
})
export class AppModule {}
