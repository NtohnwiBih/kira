import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket,
  MessageBody, OnGatewayConnection, OnGatewayDisconnect, WsException,
} from '@nestjs/websockets';
import { Server, Socket }       from 'socket.io';
import { Injectable, Logger }   from '@nestjs/common';
import { OnEvent }              from '@nestjs/event-emitter';
import { JwtService }           from '@nestjs/jwt';
import { ConfigService }        from '@nestjs/config';
 
@WebSocketGateway({
  cors:        { origin: '*', credentials: true },
  namespace:   '/realtime',
  transports:  ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);
 
  // userId → Set<socketId>
  private readonly userSockets = new Map<string, Set<string>>();
 
  constructor(
    private readonly jwt:    JwtService,
    private readonly config: ConfigService,
  ) {}
 
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token
        ?? client.handshake.headers?.authorization?.replace('Bearer ', '');
 
      if (!token) throw new Error('No token');
 
      const payload = this.jwt.verify(token, {
        publicKey: this.config.get('JWT_PUBLIC_KEY'),
      }) as any;
 
      client.data.userId = payload.sub;
      client.data.role   = payload.role;
 
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);
 
      // Join personal room for targeted events
      client.join(`user:${payload.sub}`);
      if (payload.restaurantId) client.join(`restaurant:${payload.restaurantId}`);
 
      this.logger.log(`WS connected userId=${payload.sub} socketId=${client.id}`);
    } catch {
      client.disconnect(true);
    }
  }
 
  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`WS disconnected socketId=${client.id}`);
  }
 
  // ── Subscribe to an order room ────────────────────────────────────────────
  @SubscribeMessage('subscribe:order')
  handleSubscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    client.join(`order:${data.orderId}`);
    return { subscribed: true, room: `order:${data.orderId}` };
  }
 
  // ── Emit helpers ──────────────────────────────────────────────────────────
 
  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
 
  emitToOrder(orderId: string, event: string, payload: any) {
    this.server.to(`order:${orderId}`).emit(event, payload);
  }
 
  emitToRestaurant(restaurantId: string, event: string, payload: any) {
    this.server.to(`restaurant:${restaurantId}`).emit(event, payload);
  }
 
  // ── Event listeners — bridge domain events to WebSocket rooms ────────────
 
  @OnEvent('order.created')
  onOrderCreated(e: any) {
    this.emitToRestaurant(e.restaurantId, 'order.created', e);
    this.emitToUser(e.userId, 'order.created', e);
  }
 
  @OnEvent('order.accepted')
  onOrderAccepted(e: any) {
    this.emitToOrder(e.orderId, 'order.accepted', e);
  }
 
  @OnEvent('order.preparing')
  onOrderPreparing(e: any) {
    this.emitToOrder(e.orderId, 'order.preparing', e);
  }
 
  @OnEvent('order.ready')
  onOrderReady(e: any) {
    this.emitToOrder(e.orderId, 'order.ready', e);
    this.emitToRestaurant(e.restaurantId, 'order.ready', e);
  }
 
  @OnEvent('driver.assigned')
  onDriverAssigned(e: any) {
    this.emitToOrder(e.orderId, 'driver.assigned', e);
  }
 
  @OnEvent('driver.location_updated')
  onDriverLocation(e: any) {
    this.emitToOrder(e.orderId, 'driver.location_updated', { lat: e.lat, lng: e.lng });
  }
 
  @OnEvent('order.delivered')
  onOrderDelivered(e: any) {
    this.emitToOrder(e.orderId, 'order.delivered', e);
    this.emitToUser(e.userId, 'order.delivered', e);
  }
 
  @OnEvent('payment.success')
  onPaymentSuccess(e: any) {
    this.emitToOrder(e.orderId, 'payment.success', e);
  }
 
  @OnEvent('payment.failed')
  onPaymentFailed(e: any) {
    this.emitToOrder(e.orderId, 'payment.failed', e);
  }
}