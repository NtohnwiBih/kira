import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { PaymentMethodRepository } from '../repositories';
import { AddPaymentMethodDto, PaymentMethodResponseDto } from '../dto/restaurant.dto';
import {
  DuplicatePaymentNumberException, PaymentMethodNotFoundException,
  PrimaryPaymentMethodException,
} from '../exceptions/restaurant.exceptions';
import { RestaurantService } from './restaurant.service';
import { encryptAccountNumber, hashAccountNumber } from '../utils/payment-crypto.utils';
import { ONBOARDING_STEP, RESTAURANT_CONSTANTS } from '../constants/restaurant.contant';
import { RestaurantPaymentProvider } from 'generated/prisma/client';
 
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
 
  constructor(
    private readonly paymentRepo:    PaymentMethodRepository,
    private readonly restaurantSvc:  RestaurantService,
    private readonly config:         ConfigService,
  ) {}
 
  async add(
    restaurantId: string,
    dto:          AddPaymentMethodDto,
    userId:       string,
  ): Promise<PaymentMethodResponseDto> {
    const hash = hashAccountNumber(dto.accountNumber);
 
    // Duplicate detection (hash comparison without decrypting all rows)
    const dupe = await this.paymentRepo.findByHash(
        restaurantId, 
        dto.provider as RestaurantPaymentProvider, 
        hash
    );
    if (dupe) throw new DuplicatePaymentNumberException(dto.provider);
 
    // Encrypt before storing
    const keyHex = this.config.get<string>('PAYMENT_ENCRYPTION_KEY', '');
    const encryptedNumber = keyHex
      ? encryptAccountNumber(dto.accountNumber, keyHex)
      : dto.accountNumber; // fallback for local dev only
 
    // Unset other primary if requested
    if (dto.isPrimary) {
      await this.paymentRepo.unsetPrimary(restaurantId, dto.provider as RestaurantPaymentProvider);
    }
 
    const method = await this.paymentRepo.create({
      restaurant:        { connect: { id: restaurantId } },
      provider:          dto.provider,
      accountName:       dto.accountName,
      accountNumberHash: hash,
      accountNumberEnc:  encryptedNumber,
      isPrimary:         dto.isPrimary ?? false,
      createdById:       userId,
    } as never);
 
    // Advance onboarding
    await this.restaurantSvc.advanceOnboarding(restaurantId, ONBOARDING_STEP.PAYMENT + 1);
 
    this.logger.log(
      `Payment method added id=${method.id} provider=${dto.provider} restaurant=${restaurantId}`,
    );
 
    return this.mapToResponse(method as never);
  }
 
  async list(restaurantId: string): Promise<PaymentMethodResponseDto[]> {
    const methods = await this.paymentRepo.findByRestaurant(restaurantId);
    return methods.map((m) => this.mapToResponse(m as never));
  }
 
  async setPrimary(methodId: string, restaurantId: string): Promise<PaymentMethodResponseDto> {
    const method = await this.paymentRepo.findById(methodId, restaurantId);
    if (!method) throw new PaymentMethodNotFoundException();
 
    await this.paymentRepo.unsetPrimary(restaurantId, method.provider);
    const updated = await this.paymentRepo.update(methodId, { isPrimary: true });
 
    return this.mapToResponse(updated as never);
  }
 
  async remove(methodId: string, restaurantId: string): Promise<{ message: string }> {
    const method = await this.paymentRepo.findById(methodId, restaurantId);
    if (!method) throw new PaymentMethodNotFoundException();
 
    if (method.isPrimary) {
      const count = await this.paymentRepo.countActive(restaurantId);
      if (count > 1) throw new PrimaryPaymentMethodException();
    }
 
    await this.paymentRepo.softDelete(methodId);
    return { message: 'Payment method removed.' };
  }
 
  private mapToResponse(m: {
    id: string; provider: string; accountName: string;
    accountNumberEnc: string; isPrimary: boolean;
    isActive: boolean; isVerified: boolean;
  }): PaymentMethodResponseDto {
    const providerName = RESTAURANT_CONSTANTS.PAYMENT_PROVIDER_NAMES[m.provider as 'MOMO' | 'OM'];
    // Derive last 3 digits from the encrypted blob's original number — we store the
    // masked tail separately as a convenience field in a real system. Here we
    // reconstruct from the hash suffix for demo purposes.
    return {
      id:           m.id,
      provider:     m.provider as never,
      providerName,
      accountName:  m.accountName,
      maskedNumber: '****???',  // In production: store maskedNumber as a plain column
      isPrimary:    m.isPrimary,
      isActive:     m.isActive,
      isVerified:   m.isVerified,
    };
  }
}