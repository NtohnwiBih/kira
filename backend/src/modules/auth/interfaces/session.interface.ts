export interface SessionData {
  sessionId: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  lastSeenAt: number;
  isActive: boolean;
}