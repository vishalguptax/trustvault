import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IssuerService } from './issuer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CreateBulkOffersDto } from './dto/bulk-offer.dto';
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
    const metadata = await this.issuerService.getIssuerMetadata();
    return { data: metadata };
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
      dto.subjectDid || 'pending',
      dto.claims,
      dto.pinRequired,
    );
    return { data: result };
  }

  @Post('offers/batch')
  @Roles('issuer', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple credential offers in batch (bulk issuance)' })
  @ApiResponse({ status: 201, description: 'Batch offers created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createBulkOffers(@Body() dto: CreateBulkOffersDto) {
    const result = await this.issuerService.createBulkOffers(
      dto.schemaTypeUri,
      dto.offers,
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
      throw new BadRequestException('Only pre-authorized_code grant type is supported');
    }
    const result = await this.issuerService.exchangeToken(dto['pre-authorized_code'], dto.pin);
    return { data: result };
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
      throw new UnauthorizedException('Missing access token');
    }

    const result = await this.issuerService.issueCredential(
      accessToken,
      dto.format,
      dto.credential_definition,
      dto.proof,
    );
    return { data: result };
  }

  @Get('offers')
  @Roles('issuer', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all credential offers' })
  @ApiResponse({ status: 200, description: 'List of credential offers with status and URIs' })
  async listOffers() {
    const offers = await this.issuerService.listOffers();
    return { data: offers };
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

  @Get('offers/preview/:code')
  @Public()
  @ApiOperation({ summary: 'Preview a credential offer by pre-authorized code' })
  @ApiResponse({ status: 200, description: 'Offer preview with claims and issuer info' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async getOfferPreview(@Param('code') code: string) {
    const preview = await this.issuerService.getOfferPreview(code);
    return { data: preview };
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
