import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TrustService } from './trust.service';

class RegisterIssuerDto {
  did!: string;
  name!: string;
  credentialTypes!: string[];
  description?: string;
}

class UpdateIssuerDto {
  name?: string;
  credentialTypes?: string[];
  status?: string;
}

@ApiTags('Trust Registry')
@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get('issuers')
  @ApiOperation({ summary: 'List trusted issuers' })
  @ApiResponse({ status: 200, description: 'List of trusted issuers' })
  async listIssuers() {
    const issuers = await this.trustService.listIssuers();
    return { issuers };
  }

  @Get('issuers/:did')
  @ApiOperation({ summary: 'Get trusted issuer by DID' })
  @ApiResponse({ status: 200, description: 'Issuer details' })
  async getIssuer(@Param('did') did: string) {
    return this.trustService.getIssuer(decodeURIComponent(did));
  }

  @Post('issuers')
  @ApiOperation({ summary: 'Register trusted issuer' })
  @ApiResponse({ status: 201, description: 'Issuer registered' })
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
  @ApiOperation({ summary: 'Update trusted issuer' })
  @ApiResponse({ status: 200, description: 'Issuer updated' })
  async updateIssuer(@Param('did') did: string, @Body() dto: UpdateIssuerDto) {
    return this.trustService.updateIssuer(decodeURIComponent(did), dto);
  }

  @Delete('issuers/:did')
  @ApiOperation({ summary: 'Remove trusted issuer' })
  @ApiResponse({ status: 200, description: 'Issuer removed' })
  async removeIssuer(@Param('did') did: string) {
    return this.trustService.removeIssuer(decodeURIComponent(did));
  }

  @Get('verify')
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
