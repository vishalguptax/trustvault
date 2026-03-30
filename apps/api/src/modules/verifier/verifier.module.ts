import { Module } from '@nestjs/common';
import { VerifierService } from './verifier.service';
import { VerifierController } from './verifier.controller';
import { ValidationPipelineService } from './validation-pipeline.service';
import { PolicyEngineService } from './policy-engine.service';
import { DidModule } from '../did/did.module';
import { CryptoModule } from '../crypto/crypto.module';
import { TrustModule } from '../trust/trust.module';
import { StatusModule } from '../status/status.module';

@Module({
  imports: [DidModule, CryptoModule, TrustModule, StatusModule],
  providers: [VerifierService, ValidationPipelineService, PolicyEngineService],
  controllers: [VerifierController],
  exports: [VerifierService],
})
export class VerifierModule {}
