export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}
 
export interface TokenMetadata {
  jti: string;
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}