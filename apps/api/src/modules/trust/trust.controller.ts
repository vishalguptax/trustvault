import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrustService } from './trust.service';
import { IssuerService } from '../issuer/issuer.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

class RegisterIssuerDto {
  @ApiProperty({ example: 'did:key:z...' })
  @IsString()
  did!: string;

  @ApiProperty({ example: 'TrustBank India' })
  @IsString()
  name!: string;

  @ApiProperty({ example: ['VerifiableIncomeCredential'] })
  @IsArray()
  credentialTypes!: string[];

  @ApiPropertyOptional({ example: 'Licensed bank for income verification' })
  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateIssuerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  credentialTypes?: string[];

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('Trust Registry')
@Controller('trust')
export class TrustController {
  constructor(
    private readonly trustService: TrustService,
    private readonly issuerService: IssuerService,
  ) {}

  @Get('schemas')
  @Public()
  @ApiOperation({ summary: 'List credential schemas' })
  @ApiResponse({ status: 200, description: 'List of credential schemas' })
  async listSchemas() {
    const schemas = await this.issuerService.listSchemas();
    return { data: schemas };
  }

  @Get('issuers')
  @Public()
  @ApiOperation({ summary: 'List trusted issuers' })
  @ApiResponse({ status: 200, description: 'List of trusted issuers' })
  async listIssuers() {
    const issuers = await this.trustService.listIssuers();
    return { data: issuers };
  }

  @Get('issuers/:did')
  @Public()
  @ApiOperation({ summary: 'Get trusted issuer by DID' })
  @ApiResponse({ status: 200, description: 'Issuer details' })
  async getIssuer(@Param('did') did: string) {
    return this.trustService.getIssuer(decodeURIComponent(did));
  }

  @Post('issuers')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register trusted issuer' })
  @ApiResponse({ status: 201, description: 'Issuer registered' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires admin role' })
  @ApiResponse({ status: 409, description: 'Issuer already registered' })
  async registerIssuer(@Body() dto: RegisterIssuerDto) {
    const issuer = await this.trustService.registerIssuer(
      dto.did,
      dto.name,
      dto.credentialTypes,
      dto.description,
    );
    return { data: issuer };
  }

  @Put('issuers/:did')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trusted issuer' })
  @ApiResponse({ status: 200, description: 'Issuer updated' })
  @ApiResponse({ status: 404, description: 'Issuer not found' })
  async updateIssuer(@Param('did') did: string, @Body() dto: UpdateIssuerDto) {
    return this.trustService.updateIssuer(decodeURIComponent(did), dto);
  }

  @Delete('issuers/:did')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove trusted issuer' })
  @ApiResponse({ status: 200, description: 'Issuer removed' })
  @ApiResponse({ status: 404, description: 'Issuer not found' })
  async removeIssuer(@Param('did') did: string) {
    return this.trustService.removeIssuer(decodeURIComponent(did));
  }

  @Get('verify')
  @Public()
  @ApiOperation({ summary: 'Verify issuer trust for credential type' })
  @ApiQuery({ name: 'issuerDid', required: true })
  @ApiQuery({ name: 'credentialType', required: true })
  @ApiResponse({ status: 200, description: 'Trust verification result' })
  async verifyTrust(
    @Query('issuerDid') issuerDid: string,
    @Query('credentialType') credentialType: string,
  ) {
    return this.trustService.verifyTrust(issuerDid, credentialType);
  }
}
