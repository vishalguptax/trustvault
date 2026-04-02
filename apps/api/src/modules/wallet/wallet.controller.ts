import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { Roles } from '../auth/decorators/roles.decorator';

class ReceiveCredentialDto {
  @ApiProperty({ example: 'openid-credential-offer://...' })
  @IsString()
  credentialOfferUri!: string;

  @ApiProperty({ example: 'user-1' })
  @IsString()
  holderId!: string;
}

class CreatePresentationDto {
  @ApiProperty()
  @IsString()
  verificationRequestId!: string;

  @ApiProperty({ example: 'user-1' })
  @IsString()
  holderId!: string;

  @ApiProperty({ example: ['cred-id-1'] })
  @IsArray()
  selectedCredentials!: string[];

  @ApiProperty({ example: { 'cred-id-1': ['degree', 'institution'] } })
  @IsObject()
  disclosedClaims!: Record<string, string[]>;

  @ApiProperty({ example: true })
  @IsBoolean()
  consent!: boolean;
}

class CreateWalletDidDto {
  @ApiProperty({ example: 'user-1' })
  @IsString()
  holderId!: string;

  @ApiPropertyOptional({ example: 'key' })
  @IsOptional()
  @IsString()
  method?: string;
}

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@Roles('holder', 'admin')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('credentials/receive')
  @ApiOperation({ summary: 'Receive credential via OID4VCI' })
  @ApiResponse({ status: 201, description: 'Credential received and stored' })
  @ApiResponse({ status: 400, description: 'Invalid credential offer' })
  async receiveCredential(@Body() dto: ReceiveCredentialDto) {
    const result = await this.walletService.receiveCredential(dto.credentialOfferUri, dto.holderId);
    return { data: result };
  }

  @Get('credentials')
  @ApiOperation({ summary: 'List wallet credentials' })
  @ApiQuery({ name: 'holderId', required: true })
  @ApiResponse({ status: 200, description: 'List of credentials' })
  async listCredentials(@Query('holderId') holderId: string) {
    const result = await this.walletService.listCredentials(holderId);
    return { data: result };
  }

  @Get('credentials/:id')
  @ApiOperation({ summary: 'Get credential details' })
  @ApiResponse({ status: 200, description: 'Credential details' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async getCredential(@Param('id') id: string) {
    const credential = await this.walletService.getCredential(id);
    return { data: credential };
  }

  @Get('credentials/:id/claims')
  @ApiOperation({ summary: 'Get credential claims (fixed/selective)' })
  @ApiResponse({ status: 200, description: 'Credential claims' })
  async getCredentialClaims(@Param('id') id: string) {
    const claims = await this.walletService.getCredentialClaims(id);
    return { data: claims };
  }

  @Delete('credentials/:id')
  @ApiOperation({ summary: 'Delete credential from wallet' })
  @ApiResponse({ status: 200, description: 'Credential deleted' })
  async deleteCredential(@Param('id') id: string) {
    const result = await this.walletService.deleteCredential(id);
    return { data: result };
  }

  @Post('presentations/create')
  @ApiOperation({ summary: 'Create verifiable presentation' })
  @ApiResponse({ status: 201, description: 'Presentation created' })
  @ApiResponse({ status: 400, description: 'Consent required or invalid data' })
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
    return { data: records };
  }

  @Post('dids')
  @ApiOperation({ summary: 'Create wallet DID' })
  @ApiResponse({ status: 201, description: 'DID created' })
  async createDid(@Body() dto: CreateWalletDidDto) {
    const result = await this.walletService.createHolderDid(dto.holderId, dto.method);
    return { data: result };
  }
}
