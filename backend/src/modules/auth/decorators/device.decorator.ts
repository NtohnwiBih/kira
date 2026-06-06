import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DeviceInfo } from '../interfaces';
 
/**
 * Builds a DeviceInfo object from request headers + body fingerprint fields.
 * Usage: @DeviceInfo() device: DeviceInfo
 */
export const DeviceInfoParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DeviceInfo => {
    const req = ctx.switchToHttp().getRequest();
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
      req.connection?.remoteAddress ??
      req.ip;
 
    return {
      deviceId:   req.body?.deviceId   ?? req.headers['x-device-id'] ?? 'unknown',
      deviceName: req.body?.deviceName ?? req.headers['x-device-name'],
      deviceType: req.headers['x-device-type'],
      userAgent:  req.headers['user-agent'],
      ipAddress:  ip,
    };
  },
);