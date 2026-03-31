import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token obtained from login or previous refresh' })
  @IsString()
  refresh_token!: string;
}
