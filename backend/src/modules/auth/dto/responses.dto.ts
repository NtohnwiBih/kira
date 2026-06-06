import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
  @ApiProperty() isVerified: boolean;
  @ApiProperty() isTwoFactorEnabled: boolean;
  @ApiPropertyOptional() avatarUrl?: string;
  @ApiPropertyOptional() lastLoginAt?: Date;
  @ApiProperty() createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() accessTokenExpiresAt: number;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}

export class SessionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() deviceId: string;
  @ApiPropertyOptional() deviceName?: string;
  @ApiPropertyOptional() deviceType?: string;
  @ApiPropertyOptional() ipAddress?: string;
  @ApiPropertyOptional() location?: string;
  @ApiProperty() lastSeenAt: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() isCurrentSession: boolean;
}

export class TwoFaSetupResponseDto {
  @ApiProperty() secret: string;
  @ApiProperty() otpauthUrl: string;
  @ApiProperty({ description: 'Base64 data-URI PNG' }) qrCode: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' }) message: string;
}