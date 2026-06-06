import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({ example: '123456', description: 'TOTP code if 2FA is enabled' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  twoFactorCode?: string;

  @ApiPropertyOptional({ example: 'device-fingerprint-abc123', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;

  @ApiPropertyOptional({ example: 'Chrome on MacOS', maxLength: 256 })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceName?: string;
}