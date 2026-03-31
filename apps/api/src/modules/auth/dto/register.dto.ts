import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'sandhya@trustvault.dev', description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss1', description: 'Password (minimum 8 characters)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Sandhya Sharma', description: 'Full name of the user' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'holder',
    description: 'User role',
    enum: ['admin', 'issuer', 'verifier', 'holder'],
    default: 'holder',
  })
  @IsOptional()
  @IsIn(['admin', 'issuer', 'verifier', 'holder'])
  role?: string;
}
