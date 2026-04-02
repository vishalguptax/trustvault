import { IsString, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class BulkOfferItem {
  @ApiProperty({ example: { documentName: 'B.Sc Computer Science', institutionName: 'MIT', degree: 'Bachelor of Science' } })
  @IsObject()
  claims!: Record<string, unknown>;
}

export class CreateBulkOffersDto {
  @ApiProperty({ example: 'VerifiableEducationCredential', description: 'The credential schema type URI' })
  @IsString()
  schemaTypeUri!: string;

  @ApiProperty({ type: [BulkOfferItem], description: 'Array of claim sets, one per credential to issue' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkOfferItem)
  offers!: BulkOfferItem[];
}
