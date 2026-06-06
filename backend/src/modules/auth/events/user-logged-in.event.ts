export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string,
    public readonly sessionId: string,
    public readonly ipAddress: string,
    public readonly userAgent?: string,
    public readonly deviceId?: string,
  ) {}
}