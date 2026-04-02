import { IsString, IsObject, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CredentialProofDto {
  @ApiProperty({ example: 'jwt' })
  @IsString()
  proof_type!: string;

  @ApiProperty()
  @IsString()
  jwt!: string;
}

export class CredentialDefinitionDto {
  @ApiProperty({ example: ['VerifiableEducationCredential'] })
  @IsArray()
  type!: string[];
}

export class CredentialRequestDto {
  @ApiProperty({ example: 'vc+sd-jwt' })
  @IsString()
  format!: string;

  @ApiProperty()
  @IsObject()
  credential_definition!: CredentialDefinitionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  proof?: CredentialProofDto;
}
