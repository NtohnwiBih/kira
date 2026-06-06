import {
  Injectable, Logger, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { MtnMomoService }     from './mtn-momo.service';
import { OrangeMoneyService } from './orange-money.service';
import { RequestPaymentDto, PaymentStatusResponseDto } from '../dto/payment.dto';
 
export class PaymentSuccessEvent {
  static readonly EVENT = 'payment.success';
  constructor(public readonly paymentId: string, public readonly orderId: string) {}
}
export class PaymentFailedEvent {
  static readonly EVENT = 'payment.failed';
  constructor(public readonly paymentId: string, public readonly orderId: string, public readonly reason: string) {}
}
 
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
 
  constructor(
    private readonly prisma:    PrismaService,
    private readonly momo:      MtnMomoService,
    private readonly om:        OrangeMoneyService,
    private readonly emitter:   EventEmitter2,
    private readonly config:    ConfigService,
  ) {}
 
  // ── Initiate payment ───────────────────────────────────────────────────────
 
  async requestPayment(userId: string, dto: RequestPaymentDto): Promise<PaymentStatusResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.payment) throw new ConflictException('Payment already initiated for this order.');
 
    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId:     dto.orderId,
        amount:      order.total,
        currency:    'XAF',
        provider:    dto.provider as any,
        phoneNumber: dto.phoneNumber,
        status:      'PENDING',
      },
    });
 
    // Dispatch to provider
    let providerRef: string | null = null;
    try {
      if (dto.provider === 'MTN_MOMO') {
        providerRef = await this.momo.requestToPay({
          amount: Number(order.total), currency: 'XAF',
          phoneNumber: dto.phoneNumber, orderId: dto.orderId, paymentId: payment.id,
        });
      } else {
        const notifyUrl = `${this.config.get('APP_URL')}/api/v1/payments/webhook/om`;
        const result    = await this.om.requestToPay({
          amount: Number(order.total), currency: 'XAF',
          phoneNumber: dto.phoneNumber, orderId: dto.orderId,
          paymentId: payment.id, notifyUrl,
        });
        providerRef = result.payToken;
      }
 
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { providerRef, status: 'PROCESSING' },
      });
 
      // Log attempt
      await this.prisma.paymentAttempt.create({
        data: {
          paymentId: payment.id, attemptNo: 1,
          provider: dto.provider as any, phoneNumber: dto.phoneNumber, status: 'PROCESSING',
        },
      });
 
    } catch (err: any) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'FAILED', failureReason: err.message },
      });
      throw new BadRequestException(`Payment initiation failed: ${err.message}`);
    }
 
    this.logger.log(`Payment initiated id=${payment.id} provider=${dto.provider}`);
    return this.getStatus(payment.id);
  }
 
  // ── Webhook handlers ───────────────────────────────────────────────────────
 
  async handleMomoWebhook(payload: any, signature: string): Promise<void> {
    await this.prisma.paymentWebhook.create({
      data: {
        provider:   'MTN_MOMO',
        payload,
        signature,
        isVerified: true, // TODO: verify HMAC signature
        receivedAt: new Date(),
      },
    });
 
    const { externalId, status, reason } = payload;
    await this.processProviderResult(externalId, status === 'SUCCESSFUL', reason);
  }
 
  async handleOmWebhook(payload: any): Promise<void> {
    await this.prisma.paymentWebhook.create({
      data: { provider: 'ORANGE_MONEY', payload, isVerified: false, receivedAt: new Date() },
    });
 
    const { order_id, status } = payload;
    const payment = await this.prisma.payment.findFirst({ where: { id: order_id } });
    if (payment) {
      await this.processProviderResult(payment.id, status === '60000', 'Transaction declined');
    }
  }
 
  private async processProviderResult(paymentId: string, success: boolean, reason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status === 'COMPLETED') return;
 
    if (success) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data:  { status: 'COMPLETED', paidAt: new Date() },
      });
      // Advance order status
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data:  { status: 'PENDING' as any }, // awaiting restaurant confirmation
      });
      this.emitter.emit(PaymentSuccessEvent.EVENT, new PaymentSuccessEvent(paymentId, payment.orderId));
    } else {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data:  { status: 'FAILED', failureReason: reason },
      });
      this.emitter.emit(PaymentFailedEvent.EVENT, new PaymentFailedEvent(paymentId, payment.orderId, reason ?? 'Unknown'));
    }
  }
 
  // ── Status ────────────────────────────────────────────────────────────────
 
  async getStatus(paymentId: string): Promise<PaymentStatusResponseDto> {
    const p = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!p) throw new NotFoundException('Payment not found.');
    return {
      paymentId:     p.id,
      orderId:       p.orderId,
      status:        p.status,
      provider:      p.provider,
      amount:        Number(p.amount),
      currency:      p.currency,
      phoneNumber:   p.phoneNumber ?? '',
      providerRef:   p.providerRef ?? null,
      paidAt:        p.paidAt ?? null,
      failureReason: p.failureReason ?? null,
      createdAt:     p.createdAt,
    };
  }
}