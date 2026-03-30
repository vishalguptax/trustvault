import { IsString, IsObject, IsOptional } from 'class-validator';
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
