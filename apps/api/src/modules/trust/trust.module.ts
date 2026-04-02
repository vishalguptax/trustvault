import { Module } from '@nestjs/common';
import { TrustService } from './trust.service';
import { TrustController } from './trust.controller';
import { IssuerModule } from '../issuer/issuer.module';
import { AuthModule } from '../auth/auth.module';
import { DidModule } from '../did/did.module';

@Module({
  imports: [IssuerModule, AuthModule, DidModule],
  providers: [TrustService],
  controllers: [TrustController],
  exports: [TrustService],
})
export class TrustModule {}
