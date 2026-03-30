import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { SdJwtService } from './sd-jwt.service';
import { KeyManagerService } from './key-manager.service';

@Module({
  providers: [CryptoService, SdJwtService, KeyManagerService],
  exports: [CryptoService, SdJwtService, KeyManagerService],
})
export class CryptoModule {}
