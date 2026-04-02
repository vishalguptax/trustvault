import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Oid4vciClientService } from './oid4vci-client.service';
import { ConsentService } from './consent.service';
import { DidModule } from '../did/did.module';
import { CryptoModule } from '../crypto/crypto.module';
import { VerifierModule } from '../verifier/verifier.module';

@Module({
  imports: [DidModule, CryptoModule, forwardRef(() => VerifierModule)],
  providers: [WalletService, Oid4vciClientService, ConsentService],
  controllers: [WalletController],
  exports: [WalletService, Oid4vciClientService],
})
export class WalletModule {}
