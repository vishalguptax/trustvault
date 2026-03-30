import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VerifierService } from './verifier.service';

class CreatePresentationRequestDto {
  verifierDid!: string;
  credentialTypes!: string[];
  requiredClaims?: Record<string, string[]>;
  policies?: string[];
}

class PresentationResponseDto {
  vp_token!: string;
  presentation_submission?: Record<string, unknown>;
  state!: string;
}

class CreatePolicyDto {
  name!: string;
  description?: string;
  rules!: Record<string, unknown>;
}

@ApiTags('Verifier')
@Controller('verifier')
export class VerifierController {
  constructor(private readonly verifierService: VerifierService) {}

  @Post('presentations/request')
  @ApiOperation({ summary: 'Create presentation request (OID4VP)' })
  @ApiResponse({ status: 201, description: 'Presentation request created' })
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
  async handleResponse(@Body() dto: PresentationResponseDto) {
    return this.verifierService.handlePresentationResponse(dto.vp_token, dto.state);
  }

  @Get('presentations/:id')
  @ApiOperation({ summary: 'Get presentation/verification result' })
  @ApiResponse({ status: 200, description: 'Verification details' })
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
