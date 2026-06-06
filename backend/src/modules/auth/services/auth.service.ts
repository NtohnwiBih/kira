import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { VerificationService } from './verification.service';
import { AccountLockService } from './account-lock.service';
import { AuditService } from './audit.service';
import crypto from 'crypto';

import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  RegisterRestaurantDto,
  RegisterDriverDto,
} from '../dto';

import {
  UserRegisteredEvent,
  UserLoggedInEvent,
  PasswordResetRequestedEvent,
  SuspiciousLoginEvent,
} from '../events';

import {
  InvalidCredentialsException,
  AccountLockedException,
  AccountNotVerifiedException,
  EmailAlreadyExistsException,
  InvalidTokenException,
  PasswordMismatchException,
} from '../exceptions/auth.exceptions';

import { AUTH_CONSTANTS, AUDIT_ACTIONS } from '../constants/auth.constants';
import { DeviceInfo } from '../interfaces';
import { generateSecureToken, hashToken } from '../utils/crypto.utils';
import { PasswordResetRepository } from '../repositories/password-reset.repository';
import { MailService } from 'src/modules/mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly verificationService: VerificationService,
    private readonly accountLockService: AccountLockService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    private readonly passwordResetRepo: PasswordResetRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // VALIDATE USER - Used by LocalStrategy
  // ─────────────────────────────────────────────────────────────────────────────
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.passwordService.verify(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // Don't return sensitive data
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTER - General User
  // ─────────────────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto, ipAddress: string, deviceInfo?: DeviceInfo) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new EmailAlreadyExistsException();
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const user = await this.userRepo.create({
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash: hashedPassword,
      phone: dto.phone,
      role: 'CUSTOMER',
      isActive: true,
    });

    // Send verification email
    await this.verificationService.sendVerificationEmail(user.id, user.email);

    // Emit event
    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent(
        user.id,
        user.email,
        user.name,
        user.role,
        ipAddress,
        deviceInfo,
      ),
    );

    this.auditService.log(AUDIT_ACTIONS.REGISTER, user.id, { ipAddress });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ipAddress: string, userAgent: string = '') {  // ← Default value
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsException();

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedException(user.lockedUntil);
    }

    const isPasswordValid = await this.passwordService.verify(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.userRepo.incrementFailedLogins(user.id);
      await this.accountLockService.recordFailedAttempt(user.id);

      this.eventEmitter.emit('suspicious.login', new SuspiciousLoginEvent(
        user.id, user.email, ipAddress, userAgent, 'Invalid password'
      ));

      throw new InvalidCredentialsException();
    }

    if (user.failedLoginCount > 0) {
      await this.userRepo.resetFailedLogins(user.id);
    }

    if (!user.isVerified) {
      throw new AccountNotVerifiedException();
    }

    const session = await this.sessionService.createSession(
      user.id,
      dto.deviceId || crypto.randomUUID(),
      dto.deviceName || 'Unknown Device',
      ipAddress,
      userAgent || '',
    );

    const tokens = await this.tokenService.generateTokenPair(user, {
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      ipAddress,
      userAgent: userAgent || '',         
    });

    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    this.eventEmitter.emit('user.logged.in', new UserLoggedInEvent(
      user.id, 
      user.email, 
      user.role, 
      session.sessionId, 
      ipAddress, 
      userAgent || '',                   
      dto.deviceId
    ));

    this.auditService.log(AUDIT_ACTIONS.LOGIN, user.id, { 
      sessionId: session.sessionId, 
      ipAddress,
      userAgent: userAgent || ''          
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────────────────────────────────────
  async refreshTokens(userId: string, tokenHash: string) {
    const user = await this.userRepo.findActiveById(userId);
    if (!user) throw new InvalidTokenException();

    const tokens = await this.tokenService.generateTokenPair(user);

    this.auditService.log(AUDIT_ACTIONS.TOKEN_REFRESHED, userId);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────────
  async logout(userId: string, jti: string) {
    await this.tokenService.blacklistToken(jti);
    await this.sessionService.revokeAllUserSessions(userId);
    await this.tokenService.revokeRefreshTokenForUser(userId); // optional helper

    this.auditService.log(AUDIT_ACTIONS.LOGOUT, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PASSWORD FLOWS
  // ─────────────────────────────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) return { message: 'If account exists, reset code sent' };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = hashToken(code);

    await this.passwordResetRepo.create({
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRES_MS),
    });

    const name = user.name ?? 'there';
    await this.mailService.sendPasswordResetEmail(user.email, name, code);

    this.auditService.log(AUDIT_ACTIONS.PASSWORD_RESET_REQUEST, user.id);
    return { message: 'Password reset code sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const record = await this.passwordResetRepo.findValidToken(tokenHash);

    if (!record) throw new InvalidTokenException();

    const user = await this.userRepo.findById(record.userId);
    if (!user) throw new InvalidTokenException();

    const newHashedPassword = await this.passwordService.hash(dto.newPassword);

    await this.userRepo.update(user.id, { passwordHash: newHashedPassword });
    await this.passwordResetRepo.markAsUsed(tokenHash);

    // Invalidate all sessions after password reset
    await this.sessionService.revokeAllUserSessions(user.id);

    this.auditService.log(AUDIT_ACTIONS.PASSWORD_RESET, user.id);
    return { message: 'Password reset successful' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const isCurrentValid = await this.passwordService.verify(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) throw new PasswordMismatchException();

    const newHashed = await this.passwordService.hash(dto.newPassword);

    await this.userRepo.update(user.id, { passwordHash: newHashed });
    await this.sessionService.revokeAllUserSessions(user.id);

    this.auditService.log(AUDIT_ACTIONS.PASSWORD_CHANGE, userId);
    return { message: 'Password changed successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  async verifyEmail(dto: VerifyEmailDto) {
    await this.verificationService.verifyEmail(dto.email, dto.code);
    this.auditService.log(AUDIT_ACTIONS.EMAIL_VERIFIED, null);
    return { message: 'Email verified successfully' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) return { message: 'If account exists, verification code sent' };
    if (user.isVerified) return { message: 'Email is already verified' };

    await this.verificationService.sendVerificationEmail(user.id, user.email);
    return { message: 'Verification code sent to your email' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET CURRENT USER
  // ─────────────────────────────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SPECIALIZED REGISTRATIONS (Restaurant & Driver)
  // ─────────────────────────────────────────────────────────────────────────────
  async registerRestaurant(dto: RegisterRestaurantDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new EmailAlreadyExistsException();

    const hashedPassword = await this.passwordService.hash(dto.password);

    const user = await this.userRepo.create({
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash: hashedPassword,
      phone: dto.phone,
      role: 'RESTAURANT_OWNER',  
      isActive: true,
    });

    await this.verificationService.sendVerificationEmail(user.id, user.email);

    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent(user.id, user.email, user.name, user.role, '0.0.0.0'),
    );

    this.auditService.log(AUDIT_ACTIONS.REGISTER, user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }

  async registerDriver(dto: RegisterDriverDto) {
    // Similar logic with role = DELIVERY_DRIVER
    return this.register(dto as RegisterDto, '0.0.0.0');
  }
}