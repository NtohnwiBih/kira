import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Only needed for mobile clients that cannot use HttpOnly cookies' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}