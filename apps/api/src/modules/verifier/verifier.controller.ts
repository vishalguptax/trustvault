import { Controller, Get, Post, Put, Body, Param, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { VerifierService } from './verifier.service';
import { VerificationEventsService } from './verification-events.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class CreatePresentationRequestDto {
  @ApiPropertyOptional({ example: 'did:key:zVerifier...' })
  @IsOptional()
  @IsString()
  verifierDid?: string;

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

  @ApiPropertyOptional({ example: 'Acme University' })
  @IsOptional()
  @IsString()
  verifierName?: string;

  @ApiPropertyOptional({ example: 'Verify education credentials for enrollment' })
  @IsOptional()
  @IsString()
  purpose?: string;
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

class UpdatePolicyDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled!: boolean;
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
  constructor(
    private readonly verifierService: VerifierService,
    private readonly verificationEvents: VerificationEventsService,
  ) {}

  @Post('presentations/request')
  @Roles('verifier', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create presentation request (OID4VP)' })
  @ApiResponse({ status: 201, description: 'Presentation request created' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires verifier or admin role' })
  async createRequest(
    @Body() dto: CreatePresentationRequestDto,
    @CurrentUser() user: { id: string; name: string; role: string },
  ) {
    const verifierDid = dto.verifierDid || `did:user:${user.id}`;
    const verifierName = dto.verifierName || user.name;
    const result = await this.verifierService.createPresentationRequest(
      verifierDid,
      dto.credentialTypes,
      dto.requiredClaims,
      dto.policies,
      verifierName,
      dto.purpose,
    );
    return {
      data: {
        requestId: result.requestId,
        requestUri: result.authorizationRequestUri,
        shareUrl: result.shareUrl,
        nonce: result.nonce,
        state: result.state,
      },
    };
  }

  @Post('presentations/response')
  @Public()
  @ApiOperation({ summary: 'Submit presentation response (OID4VP — from wallet)' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async handleResponse(@Body() dto: PresentationResponseDto) {
    const result = await this.verifierService.handlePresentationResponse(dto.vp_token, dto.state);
    return { data: result };
  }

  @Get('presentations')
  @Roles('verifier', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List verification results (scoped to current verifier, admin sees all)' })
  @ApiResponse({ status: 200, description: 'List of verification results' })
  async listPresentations(@CurrentUser() user: { id: string; role: string }) {
    const verifierDid = user.role === 'admin' ? undefined : `did:user:${user.id}`;
    const presentations = await this.verifierService.listPresentations(verifierDid);
    return { data: presentations };
  }

  @Get('presentations/:id')
  @Roles('verifier', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presentation/verification result' })
  @ApiResponse({ status: 200, description: 'Verification details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getPresentation(@Param('id') id: string) {
    const presentation = await this.verifierService.getPresentation(id);
    return { data: presentation };
  }

  @Get('presentations/:id/details')
  @Public()
  @ApiOperation({ summary: 'Get public verification request details (for shareable link)' })
  @ApiResponse({ status: 200, description: 'Verification request details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getRequestDetails(@Param('id') id: string) {
    const details = await this.verifierService.getRequestDetails(id);
    return { data: details };
  }

  @Sse('presentations/:id/stream')
  @Public()
  @ApiOperation({ summary: 'SSE stream for real-time verification result updates' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream' })
  streamPresentation(@Param('id') id: string): Observable<MessageEvent> {
    return this.verificationEvents.subscribe(id);
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

  @Put('policies/:id')
  @Roles('verifier', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update verifier policy (enable/disable)' })
  @ApiResponse({ status: 200, description: 'Policy updated' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async updatePolicy(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    const policy = await this.verifierService.updatePolicy(id, dto.enabled);
    return { data: policy };
  }
}
