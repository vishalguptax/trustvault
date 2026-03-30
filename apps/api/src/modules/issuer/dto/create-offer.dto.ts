import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ example: 'VerifiableEducationCredential' })
  @IsString()
  schemaTypeUri!: string;

  @ApiProperty({ example: 'did:key:z...' })
  @IsString()
  subjectDid!: string;

  @ApiProperty({ example: { name: 'John Doe', degree: 'MSc', institution: 'MIT' } })
  @IsObject()
  claims!: Record<string, unknown>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  pinRequired?: boolean;
}
