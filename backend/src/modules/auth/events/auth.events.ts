export class UserRegisteredEvent {
  static readonly EVENT = 'auth.user.registered';
 
  constructor(
    public readonly userId:    string,
    public readonly email:     string,
    public readonly name:      string,
    public readonly role:      string,
    public readonly verificationToken: string, // raw — sent in the email link
    public readonly ipAddress: string,
  ) {}
}
 
export class EmailVerifiedEvent {
  static readonly EVENT = 'auth.email.verified';
 
  constructor(
    public readonly userId: string,
    public readonly email:  string,
  ) {}
}
 
export class UserLoggedInEvent {
  static readonly EVENT = 'auth.user.login';
 
  constructor(
    public readonly userId:     string,
    public readonly email:      string,
    public readonly ipAddress:  string,
    public readonly deviceId:   string,
    public readonly userAgent?: string,
  ) {}
}
 
export class LoginFailedEvent {
  static readonly EVENT = 'auth.login.failed';
 
  constructor(
    public readonly email:      string,
    public readonly ipAddress:  string,
    public readonly reason:     string,
    public readonly attemptNo?: number,
  ) {}
}
 
export class AccountLockedEvent {
  static readonly EVENT = 'auth.account.locked';
 
  constructor(
    public readonly userId:    string,
    public readonly email:     string,
    public readonly unlocksAt: Date,
    public readonly ipAddress: string,
  ) {}
}
 
export class UserLoggedOutEvent {
  static readonly EVENT = 'auth.user.logout';
 
  constructor(
    public readonly userId:    string,
    public readonly sessionId: string,
    public readonly ipAddress: string,
  ) {}
}
 
export class TokenRefreshedEvent {
  static readonly EVENT = 'auth.token.refreshed';
 
  constructor(
    public readonly userId:    string,
    public readonly deviceId:  string,
    public readonly ipAddress: string,
  ) {}
}
 
export class PasswordResetRequestedEvent {
  static readonly EVENT = 'auth.password.reset.requested';
 
  constructor(
    public readonly userId:     string,
    public readonly email:      string,
    public readonly resetToken: string, // raw token for the email link
    public readonly ipAddress:  string,
  ) {}
}
 
export class PasswordResetCompletedEvent {
  static readonly EVENT = 'auth.password.reset.completed';
 
  constructor(
    public readonly userId:    string,
    public readonly email:     string,
    public readonly ipAddress: string,
  ) {}
}
 
export class PasswordChangedEvent {
  static readonly EVENT = 'auth.password.changed';
 
  constructor(
    public readonly userId:    string,
    public readonly email:     string,
    public readonly ipAddress: string,
  ) {}
}
 
export class SuspiciousLoginEvent {
  static readonly EVENT = 'auth.login.suspicious';
 
  constructor(
    public readonly userId:    string,
    public readonly email:     string,
    public readonly ipAddress: string,
    public readonly reason:    string,
    public readonly userAgent?: string,
  ) {}
}
 
export class TwoFactorEnabledEvent {
  static readonly EVENT = 'auth.2fa.enabled';
 
  constructor(
    public readonly userId: string,
    public readonly email:  string,
  ) {}
}
 
export class TwoFactorDisabledEvent {
  static readonly EVENT = 'auth.2fa.disabled';
 
  constructor(
    public readonly userId: string,
    public readonly email:  string,
  ) {}
}
 
export class SessionRevokedEvent {
  static readonly EVENT = 'auth.session.revoked';
 
  constructor(
    public readonly userId:    string,
    public readonly sessionId: string,
    public readonly revokedBy: string, 
  ) {}
}