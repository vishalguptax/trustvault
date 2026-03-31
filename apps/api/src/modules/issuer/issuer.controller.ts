import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IssuerService } from './issuer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { TokenRequestDto } from './dto/token-request.dto';
import { CredentialRequestDto } from './dto/credential-request.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Issuer')
@Controller('issuer')
export class IssuerController {
  constructor(private readonly issuerService: IssuerService) {}

  @Get('.well-known/openid-credential-issuer')
  @Public()
  @ApiOperation({ summary: 'Get issuer metadata (OID4VCI)' })
  @ApiResponse({ status: 200, description: 'Issuer metadata' })
  async getMetadata() {
    return this.issuerService.getIssuerMetadata();
  }

  @Post('offers')
  @Roles('issuer', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create credential offer' })
  @ApiResponse({ status: 201, description: 'Credential offer created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires issuer or admin role' })
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
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange pre-authorized code for access token (OID4VCI)' })
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
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue verifiable credential (OID4VCI)' })
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
  @Public()
  @ApiOperation({ summary: 'List credential schemas' })
  @ApiResponse({ status: 200, description: 'List of credential schemas' })
  async listSchemas() {
    const schemas = await this.issuerService.listSchemas();
    return { data: schemas };
  }

  @Get('schemas/:id')
  @Public()
  @ApiOperation({ summary: 'Get credential schema by ID' })
  @ApiResponse({ status: 200, description: 'Credential schema details' })
  async getSchema(@Param('id') id: string) {
    const schema = await this.issuerService.getSchema(id);
    return { data: schema };
  }

  @Get('credentials')
  @Roles('issuer', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List issued credentials' })
  @ApiResponse({ status: 200, description: 'List of issued credentials' })
  async listCredentials() {
    const credentials = await this.issuerService.listIssuedCredentials();
    return { data: credentials };
  }
}
