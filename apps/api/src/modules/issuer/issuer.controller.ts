import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IssuerService } from './issuer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { TokenRequestDto } from './dto/token-request.dto';
import { CredentialRequestDto } from './dto/credential-request.dto';

@ApiTags('Issuer')
@Controller('issuer')
export class IssuerController {
  constructor(private readonly issuerService: IssuerService) {}

  @Get('.well-known/openid-credential-issuer')
  @ApiOperation({ summary: 'Get issuer metadata (OID4VCI)' })
  @ApiResponse({ status: 200, description: 'Issuer metadata' })
  async getMetadata() {
    return this.issuerService.getIssuerMetadata();
  }

  @Post('offers')
  @ApiOperation({ summary: 'Create credential offer' })
  @ApiResponse({ status: 201, description: 'Credential offer created' })
  async createOffer(@Body() dto: CreateOfferDto) {
    const result = await this.issuerService.createOffer(
      dto.schemaTypeUri,
      dto.subjectDid,
      dto.claims,
      dto.pinRequired,
    );
    return { data: result };
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange pre-authorized code for access token' })
  @ApiResponse({ status: 200, description: 'Token response' })
  async exchangeToken(@Body() dto: TokenRequestDto) {
    if (dto.grant_type !== 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
      return {
        error: 'unsupported_grant_type',
        error_description: 'Only pre-authorized_code grant type is supported',
      };
    }
    return this.issuerService.exchangeToken(dto['pre-authorized_code'], dto.pin);
  }

  @Post('credential')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue verifiable credential' })
  @ApiResponse({ status: 200, description: 'Credential issued' })
  async issueCredential(
    @Headers('authorization') authHeader: string,
    @Body() dto: CredentialRequestDto,
  ) {
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) {
      return { error: 'invalid_token', error_description: 'Missing access token' };
    }

    return this.issuerService.issueCredential(
      accessToken,
      dto.format,
      dto.credential_definition,
      dto.proof,
    );
  }

  @Get('schemas')
  @ApiOperation({ summary: 'List credential schemas' })
  @ApiResponse({ status: 200, description: 'List of credential schemas' })
  async listSchemas() {
    const schemas = await this.issuerService.listSchemas();
    return { data: schemas };
  }

  @Get('schemas/:id')
  @ApiOperation({ summary: 'Get credential schema by ID' })
  @ApiResponse({ status: 200, description: 'Credential schema details' })
  async getSchema(@Param('id') id: string) {
    const schema = await this.issuerService.getSchema(id);
    return { data: schema };
  }

  @Get('credentials')
  @ApiOperation({ summary: 'List issued credentials' })
  @ApiResponse({ status: 200, description: 'List of issued credentials' })
  async listCredentials() {
    const credentials = await this.issuerService.listIssuedCredentials();
    return { data: credentials };
  }
}
