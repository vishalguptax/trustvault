import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenRequestDto {
  @ApiProperty({ example: 'urn:ietf:params:oauth:grant-type:pre-authorized_code' })
  @IsString()
  grant_type!: string;

  @ApiProperty({ example: 'abc123' })
  @IsString()
  'pre-authorized_code'!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pin?: string;
}
