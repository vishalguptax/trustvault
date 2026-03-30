import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StatusService } from './status.service';

class RevokeDto {
  credentialId!: string;
  reason?: string;
}

class SuspendDto {
  credentialId!: string;
  reason?: string;
}

class ReinstateDto {
  credentialId!: string;
}

@ApiTags('Status')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get('lists/:id')
  @ApiOperation({ summary: 'Get Bitstring Status List credential' })
  @ApiResponse({ status: 200, description: 'Status list credential (W3C format)' })
  async getStatusList(@Param('id') id: string) {
    return this.statusService.getStatusList(id);
  }

  @Post('revoke')
  @ApiOperation({ summary: 'Revoke a credential' })
  @ApiResponse({ status: 200, description: 'Credential revoked' })
  async revoke(@Body() dto: RevokeDto) {
    return this.statusService.revokeCredential(dto.credentialId, dto.reason);
  }

  @Post('suspend')
  @ApiOperation({ summary: 'Suspend a credential' })
  @ApiResponse({ status: 200, description: 'Credential suspended' })
  async suspend(@Body() dto: SuspendDto) {
    return this.statusService.suspendCredential(dto.credentialId, dto.reason);
  }

  @Post('reinstate')
  @ApiOperation({ summary: 'Reinstate a suspended credential' })
  @ApiResponse({ status: 200, description: 'Credential reinstated' })
  async reinstate(@Body() dto: ReinstateDto) {
    return this.statusService.reinstateCredential(dto.credentialId);
  }
}
