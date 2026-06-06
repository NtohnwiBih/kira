import { Injectable, Logger } from '@nestjs/common';
import { OnEvent }            from '@nestjs/event-emitter';
import { PrismaService }      from 'src/database/prisma/prisma.service';
 
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
 
  constructor(private readonly prisma: PrismaService) {}
 
  async send(userId: string, title: string, body: string, type: string, data?: any) {
    // 1. Persist in-app notification
    await this.prisma.notification.create({
      data: { userId, title, body, type, data },
    });
 
    // 2. Push notification (FCM) — wired to actual FCM SDK in production
    const tokens = await this.prisma.pushNotificationToken.findMany({
      where: { userId, isActive: true },
    });
 
    if (tokens.length > 0) {
      this.logger.log(`Push → userId=${userId} type=${type} tokens=${tokens.length}`);
      // TODO: await this.fcmService.sendMulticast({ tokens: tokens.map(t => t.token), title, body, data });
    }
  }
 
  // ── Order event listeners ─────────────────────────────────────────────────
 
  @OnEvent('order.created')
  async onOrderCreated(e: any) {
    await this.send(e.userId, '🎉 Order placed!', `Your order #${e.orderId.slice(-6)} has been placed.`, 'order_update', { orderId: e.orderId });
    // Notify restaurant via their owner/manager accounts
  }
 
  @OnEvent('order.accepted')
  async onOrderAccepted(e: any) {
    const order = await this.prisma.order.findUnique({ where: { id: e.orderId }, select: { userId: true, orderNumber: true } });
    if (order) await this.send(order.userId, 'Order accepted!', `Your order ${order.orderNumber} is being prepared.`, 'order_update', { orderId: e.orderId });
  }
 
  @OnEvent('order.rejected')
  async onOrderRejected(e: any) {
    await this.send(e.userId, 'Order rejected', `Your order was rejected: ${e.reason}`, 'order_update', { orderId: e.orderId });
  }
 
  @OnEvent('order.ready')
  async onOrderReady(e: any) {
    const order = await this.prisma.order.findUnique({ where: { id: e.orderId }, select: { userId: true, orderNumber: true } });
    if (order) await this.send(order.userId, 'Order ready!', `Your order ${order.orderNumber} is ready for pickup.`, 'order_update', { orderId: e.orderId });
  }
 
  @OnEvent('driver.assigned')
  async onDriverAssigned(e: any) {
    const order = await this.prisma.order.findUnique({ where: { id: e.orderId }, select: { userId: true } });
    if (order) await this.send(order.userId, 'Driver on the way!', 'Your order has been picked up and is on its way.', 'driver_update', { orderId: e.orderId });
  }
 
  @OnEvent('order.delivered')
  async onOrderDelivered(e: any) {
    await this.send(e.userId, 'Order delivered!', 'Enjoy your meal! Please rate your experience.', 'order_update', { orderId: e.orderId });
  }
 
  @OnEvent('payment.success')
  async onPaymentSuccess(e: any) {
    const p = await this.prisma.payment.findUnique({ where: { id: e.paymentId }, include: { order: { select: { userId: true } } } });
    if (p) await this.send(p.order.userId, 'Payment confirmed!', `Payment of ${Number(p.amount).toLocaleString()} XAF received.`, 'payment', { paymentId: e.paymentId });
  }
 
  @OnEvent('payment.failed')
  async onPaymentFailed(e: any) {
    const p = await this.prisma.payment.findUnique({ where: { id: e.paymentId }, include: { order: { select: { userId: true } } } });
    if (p) await this.send(p.order.userId, 'Payment failed', `Payment failed: ${e.reason}. Please try again.`, 'payment', { paymentId: e.paymentId });
  }
 
  @OnEvent('account.locked')
  async onAccountLocked(e: any) {
    await this.send(e.userId, 'Account locked', 'Too many failed attempts. Account locked for 30 minutes.', 'security', {});
  }
}