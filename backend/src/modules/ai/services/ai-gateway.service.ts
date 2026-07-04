import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
 
import {
  IChatRequest,    IChatResponse,
  IRecommendationRequest, IRecommendationResponse,
  ISupportRequest, ISupportResponse,
  ISupportContext,
} from '../interfaces/ai-gateway.interface';
import {
  AiGatewayUnavailableException,
  AiGatewayTimeoutException,
  AiGatewayUnauthorizedException,
} from '../exceptions/ai-gateway.exception';
 
@Injectable()
export class AiGatewayService implements OnModuleInit {
  private readonly logger = new Logger(AiGatewayService.name);
  private http: AxiosInstance;
 
  constructor(private readonly config: ConfigService) {}
 
  onModuleInit(): void {
    const baseURL    = this.config.get<string>('AI_GATEWAY_URL', 'http://localhost:8000');
    const serviceKey = this.config.get<string>('AI_GATEWAY_SECRET', '');
    const timeoutMs  = this.config.get<number>('AI_GATEWAY_TIMEOUT_MS', 30_000);
 
    this.http = axios.create({
      baseURL,
      timeout: timeoutMs,
      headers: {
        'Content-Type':  'application/json',
        'X-Service-Key': serviceKey,   // gateway auth — never exposed to the frontend
      },
    });
 
    this.logger.log(`AI Gateway client initialised → ${baseURL}`);
  }
 
  // ── Chat ────────────────────────────────────────────────────────────────
 
  async chat(userId: string, message: string): Promise<IChatResponse> {
    const payload: IChatRequest = { userId, message };
    const data = await this.post<IChatResponse>('/chat', {
      user_id: payload.userId,
      message: payload.message,
    });
    return data;
  }
 
  // ── Food recommendations ──────────────────────────────────────────────
 
  async getRecommendations(
    userId: string,
    query:  string,
  ): Promise<IRecommendationResponse> {
    return this.post<IRecommendationResponse>('/recommendations', {
      user_id: userId,
      query,
    });
  }
 
  // ── Customer support ──────────────────────────────────────────────────
  // NestJS assembles context from its own DB before calling this.
 
  async getSupportAnswer(
    userId:   string,
    question: string,
    context:  ISupportContext,
  ): Promise<ISupportResponse> {
    return this.post<ISupportResponse>('/support', {
      user_id:  userId,
      question,
      context:  this.toSnakeCase(context),
    });
  }
 
  // ── Health check ──────────────────────────────────────────────────────
 
  async healthCheck(): Promise<{ status: string; provider: string }> {
    try {
      const { data } = await this.http.get('/health');
      return data;
    } catch {
      return { status: 'unreachable', provider: 'unknown' };
    }
  }
 
  // ── Private ───────────────────────────────────────────────────────────
 
  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    try {
      const { data } = await this.http.post<T>(path, body);
      return data;
    } catch (err) {
      this.handleError(err as AxiosError, path);
    }
  }
 
  private handleError(err: AxiosError, path: string): never {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      this.logger.error(`AI Gateway timeout path=${path}`);
      throw new AiGatewayTimeoutException();
    }
    if (err.response?.status === 403) {
      this.logger.error('AI Gateway 403 — check AI_GATEWAY_SECRET env var');
      throw new AiGatewayUnauthorizedException();
    }
    if (!err.response || err.code === 'ECONNREFUSED') {
      this.logger.error(`AI Gateway unreachable path=${path}`, err.message);
      throw new AiGatewayUnavailableException();
    }
    this.logger.error(`AI Gateway error path=${path} status=${err.response.status}`);
    throw new AiGatewayUnavailableException();
  }
 
  /** Convert camelCase keys to snake_case for the Python gateway */
  private toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      const snake = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      result[snake] = v;
    }
    return result;
  }
}