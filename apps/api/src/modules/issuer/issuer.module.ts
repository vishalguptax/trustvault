import { Module } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { DidModule } from '../did/did.module';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [DidModule, CryptoModule],
  providers: [IssuerService],
  controllers: [IssuerController],
  exports: [IssuerService],
})
export class IssuerModule {}
