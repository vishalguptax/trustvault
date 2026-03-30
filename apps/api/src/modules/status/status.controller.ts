import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusService } from './status.service';

class RevokeDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  credentialId!: string;

  @ApiPropertyOptional({ example: 'Credential compromised' })
  @IsOptional()
  @IsString()
  reason?: string;
}

class SuspendDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  credentialId!: string;

  @ApiPropertyOptional({ example: 'Under investigation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

class ReinstateDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  credentialId!: string;
}

@ApiTags('Status')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get('lists/:id')
  @ApiOperation({ summary: 'Get Bitstring Status List credential' })
  @ApiResponse({ status: 200, description: 'Status list credential (W3C format)' })
  @ApiResponse({ status: 404, description: 'Status list not found' })
  async getStatusList(@Param('id') id: string) {
    return this.statusService.getStatusList(id);
  }

  @Post('revoke')
  @ApiOperation({ summary: 'Revoke a credential' })
  @ApiResponse({ status: 200, description: 'Credential revoked' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async revoke(@Body() dto: RevokeDto) {
    return this.statusService.revokeCredential(dto.credentialId, dto.reason);
  }

  @Post('suspend')
  @ApiOperation({ summary: 'Suspend a credential' })
  @ApiResponse({ status: 200, description: 'Credential suspended' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async suspend(@Body() dto: SuspendDto) {
    return this.statusService.suspendCredential(dto.credentialId, dto.reason);
  }

  @Post('reinstate')
  @ApiOperation({ summary: 'Reinstate a suspended credential' })
  @ApiResponse({ status: 200, description: 'Credential reinstated' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async reinstate(@Body() dto: ReinstateDto) {
    return this.statusService.reinstateCredential(dto.credentialId);
  }
}
