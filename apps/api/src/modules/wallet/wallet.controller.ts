import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';

class ReceiveCredentialDto {
  credentialOfferUri!: string;
  holderId!: string;
}

class CreatePresentationDto {
  verificationRequestId!: string;
  holderId!: string;
  selectedCredentials!: string[];
  disclosedClaims!: Record<string, string[]>;
  consent!: boolean;
}

class CreateWalletDidDto {
  holderId!: string;
  method?: string;
}

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('credentials/receive')
  @ApiOperation({ summary: 'Receive credential via OID4VCI' })
  @ApiResponse({ status: 201, description: 'Credential received and stored' })
  async receiveCredential(@Body() dto: ReceiveCredentialDto) {
    const result = await this.walletService.receiveCredential(dto.credentialOfferUri, dto.holderId);
    return { data: result };
  }

  @Get('credentials')
  @ApiOperation({ summary: 'List wallet credentials' })
  @ApiQuery({ name: 'holderId', required: true })
  @ApiResponse({ status: 200, description: 'List of credentials' })
  async listCredentials(@Query('holderId') holderId: string) {
    return this.walletService.listCredentials(holderId);
  }

  @Get('credentials/:id')
  @ApiOperation({ summary: 'Get credential details' })
  @ApiResponse({ status: 200, description: 'Credential details' })
  async getCredential(@Param('id') id: string) {
    const credential = await this.walletService.getCredential(id);
    return { data: credential };
  }

  @Get('credentials/:id/claims')
  @ApiOperation({ summary: 'Get credential claims (disclosed/undisclosed)' })
  @ApiResponse({ status: 200, description: 'Credential claims' })
  async getCredentialClaims(@Param('id') id: string) {
    return this.walletService.getCredentialClaims(id);
  }

  @Delete('credentials/:id')
  @ApiOperation({ summary: 'Delete credential from wallet' })
  @ApiResponse({ status: 200, description: 'Credential deleted' })
  async deleteCredential(@Param('id') id: string) {
    return this.walletService.deleteCredential(id);
  }

  @Post('presentations/create')
  @ApiOperation({ summary: 'Create verifiable presentation' })
  @ApiResponse({ status: 201, description: 'Presentation created' })
  async createPresentation(@Body() dto: CreatePresentationDto) {
    const result = await this.walletService.createPresentation(
      dto.verificationRequestId,
      dto.holderId,
      dto.selectedCredentials,
      dto.disclosedClaims,
      dto.consent,
    );
    return { data: result };
  }

  @Get('consent/history')
  @ApiOperation({ summary: 'Get consent history' })
  @ApiQuery({ name: 'holderId', required: true })
  @ApiResponse({ status: 200, description: 'Consent records' })
  async getConsentHistory(@Query('holderId') holderId: string) {
    const records = await this.walletService.getConsentHistory(holderId);
    return { records };
  }

  @Post('dids')
  @ApiOperation({ summary: 'Create wallet DID' })
  @ApiResponse({ status: 201, description: 'DID created' })
  async createDid(@Body() dto: CreateWalletDidDto) {
    return this.walletService.createHolderDid(dto.holderId, dto.method);
  }
}
