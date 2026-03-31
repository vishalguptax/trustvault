import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'sandhya@trustvault.dev' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss1', minLength: 8 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Sandhya Sharma' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'holder',
    enum: ['admin', 'issuer', 'verifier', 'holder'],
    default: 'holder',
  })
  @IsOptional()
  @IsIn(['admin', 'issuer', 'verifier', 'holder'])
  role?: string;
}
