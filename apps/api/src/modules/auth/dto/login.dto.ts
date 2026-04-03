import { IsEmail, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@trustilock.dev' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin@123456' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  password!: string;
}
