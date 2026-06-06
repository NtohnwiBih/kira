import { createParamDecorator, ExecutionContext } from '@nestjs/common';
 
/**
 * Extracts the real client IP, respecting X-Forwarded-For behind a proxy.
 * Usage: @ClientIp() ip: string
 */
export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
      request.connection?.remoteAddress ??
      request.ip
    );
  },
);