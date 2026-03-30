import { Module } from '@nestjs/common';
import { DidService } from './did.service';
import { DidKeyProvider } from './providers/did-key.provider';

@Module({
  providers: [DidService, DidKeyProvider],
  exports: [DidService],
})
export class DidModule {}
