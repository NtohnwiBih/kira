import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AuthController } from './controllers/auth.controller';
import { PasswordController } from './controllers/password.controller';
import { VerificationController } from './controllers/verification.controller';
import { SessionController } from './controllers/session.controller';
import { TwoFaController } from './controllers/twofa.controller';
import { RestaurantAuthController } from './controllers/restaurant-auth.controller';
import { DriverAuthController } from './controllers/driver-auth.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { VerificationService } from './services/verification.service';
import { TwoFaService } from './services/twofa.service';
import { AccountLockService } from './services/account-lock.service';
import { AuditService } from './services/audit.service';
import { RedisSessionManager, REDIS_CLIENT } from './services/redis-session.manager';
import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { SessionRepository } from './repositories/session.repository';
import { EmailVerificationRepository } from './repositories/email-verification.repository';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule, 
    MailModule,  
    EventEmitterModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        publicKey: config.get<string>('JWT_PUBLIC_KEY'),
        privateKey: config.get<string>('JWT_PRIVATE_KEY'),
        signOptions: { algorithm: 'RS256' },
      }),
    }),
  ],
  controllers: [
    AuthController,
    PasswordController,
    VerificationController,
    SessionController,
    TwoFaController,
    RestaurantAuthController,
    DriverAuthController,
    AdminAuthController,
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get<string>('REDIS_HOST', 'redis'),
          port: config.get<number>('REDIS_PORT', 6379),
        }),
    },
    AuthService,
    TokenService,
    PasswordService,
    SessionService,
    VerificationService,
    TwoFaService,
    AccountLockService,
    AuditService,
    RedisSessionManager,
    UserRepository,
    RefreshTokenRepository,
    SessionRepository,
    EmailVerificationRepository,
    PasswordResetRepository,
    AuditLogRepository,
    JwtStrategy,
    RefreshJwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    RolesGuard,
    RefreshTokenGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}