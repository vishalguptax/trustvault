import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerifierService } from './verifier.service';

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
  @ApiOperation({ summary: 'Create presentation request (OID4VP)' })
  @ApiResponse({ status: 201, description: 'Presentation request created' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createRequest(@Body() dto: CreatePresentationRequestDto) {
    return this.verifierService.createPresentationRequest(
      dto.verifierDid,
      dto.credentialTypes,
      dto.requiredClaims,
      dto.policies,
    );
  }

  @Post('presentations/response')
  @ApiOperation({ summary: 'Submit presentation response' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  @ApiResponse({ status: 404, description: 'Verification request not found' })
  async handleResponse(@Body() dto: PresentationResponseDto) {
    return this.verifierService.handlePresentationResponse(dto.vp_token, dto.state);
  }

  @Get('presentations/:id')
  @ApiOperation({ summary: 'Get presentation/verification result' })
  @ApiResponse({ status: 200, description: 'Verification details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getPresentation(@Param('id') id: string) {
    return this.verifierService.getPresentation(id);
  }

  @Post('policies')
  @ApiOperation({ summary: 'Create verifier policy' })
  @ApiResponse({ status: 201, description: 'Policy created' })
  async createPolicy(@Body() dto: CreatePolicyDto) {
    const policy = await this.verifierService.createPolicy(dto.name, dto.description, dto.rules);
    return { data: policy };
  }

  @Get('policies')
  @ApiOperation({ summary: 'List verifier policies' })
  @ApiResponse({ status: 200, description: 'List of policies' })
  async listPolicies() {
    const policies = await this.verifierService.listPolicies();
    return { policies };
  }
}
