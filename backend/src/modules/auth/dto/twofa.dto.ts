import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFaVerifyDto {
  @ApiProperty({ example: '123456', minLength: 6, maxLength: 8, description: 'TOTP code from authenticator app' })
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  code: string;
}