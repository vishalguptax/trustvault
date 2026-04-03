import { IsEmail, IsString, MinLength, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'sandhya@trustilock.dev' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '482916', description: '6-digit OTP sent to email' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  otp!: string;

  @ApiProperty({ example: 'NewSecureP@ss1', minLength: 8 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
