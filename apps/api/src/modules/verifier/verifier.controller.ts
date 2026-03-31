import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerifierService } from './verifier.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

class CreatePresentationRequestDto {
  @ApiProperty({ example: 'did:key:zVerifier...' })
  @IsString()
  verifierDid!: string;

  @ApiProperty({ example: ['VerifiableEducationCredential'] })
  @IsArray()
  credentialTypes!: string[];

  @ApiPropertyOptional({ example: { education: ['degree', 'institution'] } })
  @IsOptional()
  @IsObject()
  requiredClaims?: Record<string, string[]>;

  @ApiPropertyOptional({ example: ['require-trusted-issuer', 'require-active-status'] })
  @IsOptional()
  @IsArray()
  policies?: string[];
}

class PresentationResponseDto {
  @ApiProperty()
  @IsString()
  vp_token!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  presentation_submission?: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  state!: string;
}

class CreatePolicyDto {
  @ApiProperty({ example: 'custom-policy' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Custom verification policy' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: { customRule: { required: true } } })
  @IsObject()
  rules!: Record<string, unknown>;
}

@ApiTags('Verifier')
@Controller('verifier')
export class VerifierController {
  constructor(private readonly verifierService: VerifierService) {}

  @Post('presentations/request')
  @Roles('verifier', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create presentation request (OID4VP)' })
  @ApiResponse({ status: 201, description: 'Presentation request created' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires verifier or admin role' })
  async createRequest(@Body() dto: CreatePresentationRequestDto) {
    return this.verifierService.createPresentationRequest(
      dto.verifierDid,
      dto.credentialTypes,
      dto.requiredClaims,
      dto.policies,
    );
  }

  @Post('presentations/response')
  @Public()
  @ApiOperation({ summary: 'Submit presentation response (OID4VP — from wallet)' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async handleResponse(@Body() dto: PresentationResponseDto) {
    return this.verifierService.handlePresentationResponse(dto.vp_token, dto.state);
  }

  @Get('presentations/:id')
  @Roles('verifier', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presentation/verification result' })
  @ApiResponse({ status: 200, description: 'Verification details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getPresentation(@Param('id') id: string) {
    return this.verifierService.getPresentation(id);
  }

  @Post('policies')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create verifier policy' })
  @ApiResponse({ status: 201, description: 'Policy created' })
  async createPolicy(@Body() dto: CreatePolicyDto) {
    const policy = await this.verifierService.createPolicy(dto.name, dto.description, dto.rules);
    return { data: policy };
  }

  @Get('policies')
  @Public()
  @ApiOperation({ summary: 'List verifier policies' })
  @ApiResponse({ status: 200, description: 'List of policies' })
  async listPolicies() {
    const policies = await this.verifierService.listPolicies();
    return { data: policies };
  }
}
