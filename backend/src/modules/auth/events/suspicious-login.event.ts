export class SuspiciousLoginEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress: string,
    public readonly reason: string,
    public readonly userAgent?: string,
  ) {}
}