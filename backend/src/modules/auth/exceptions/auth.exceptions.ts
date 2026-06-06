import {
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

// ── 401 Unauthorized ──────────────────────────────────────────────────────────

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid credentials. Please check your email and password.');
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super('Token has expired. Please login again.');
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor(detail = 'Token is invalid or has been revoked.') {
    super(detail);
  }
}

export class TwoFactorRequiredException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'TWO_FACTOR_REQUIRED',
      message: 'Two-factor authentication code is required.',
    });
  }
}

export class InvalidTwoFactorCodeException extends UnauthorizedException {
  constructor() {
    super('Invalid or expired two-factor authentication code.');
  }
}

// ── 403 Forbidden ─────────────────────────────────────────────────────────────

export class AccountLockedException extends ForbiddenException {
  constructor(unlocksAt: Date) {
    super(
      `Account is temporarily locked due to multiple failed login attempts. ` +
      `Please try again after ${unlocksAt.toISOString()}.`,
    );
  }
}

export class AccountNotVerifiedException extends ForbiddenException {
  constructor() {
    super(
      'Please verify your email address before logging in. ' +
      'Check your inbox or request a new verification email.',
    );
  }
}

export class AccountDeactivatedException extends ForbiddenException {
  constructor() {
    super('This account has been deactivated. Please contact support.');
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor() {
    super('You do not have permission to perform this action.');
  }
}

// ── 400 Bad Request ───────────────────────────────────────────────────────────

export class WeakPasswordException extends BadRequestException {
  constructor() {
    super(
      'Password must be at least 8 characters and include uppercase, lowercase, ' +
      'a number, and a special character.',
    );
  }
}

export class PasswordMismatchException extends BadRequestException {
  constructor() {
    super('Current password is incorrect.');
  }
}

export class TokenAlreadyUsedException extends BadRequestException {
  constructor() {
    super('This token has already been used.');
  }
}

export class InvalidSessionException extends BadRequestException {
  constructor() {
    super('Session not found or already invalidated.');
  }
}

export class TwoFactorAlreadyEnabledException extends BadRequestException {
  constructor() {
    super('Two-factor authentication is already enabled on this account.');
  }
}

export class TwoFactorNotEnabledException extends BadRequestException {
  constructor() {
    super('Two-factor authentication is not enabled on this account.');
  }
}

// ── 409 Conflict ─────────────────────────────────────────────────────────────

export class EmailAlreadyExistsException extends ConflictException {
  constructor() {
    super('An account with this email address already exists.');
  }
}

export class PhoneAlreadyExistsException extends ConflictException {
  constructor() {
    super('An account with this phone number already exists.');
  }
}

// ── 429 Too Many Requests ─────────────────────────────────────────────────────

export class RateLimitExceededException extends HttpException {
  constructor(retryAfterSeconds = 60) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'TOO_MANY_REQUESTS',
        message: `Too many requests. Please retry after ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}