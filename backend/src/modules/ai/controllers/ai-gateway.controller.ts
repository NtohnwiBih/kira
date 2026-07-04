import {
  Controller, Post, Get, Body, UseGuards,
  HttpCode, HttpStatus, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
 
import { JwtAuthGuard }  from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser }   from 'src/modules/auth/decorators';
import { Public }        from 'src/modules/auth/decorators';
import { AiGatewayService } from '../services/ai-gateway.service';
import {
  ChatRequestDto,      ChatResponseDto,
  SearchQueryDto,      RecommendationResponseDto,
  SupportQuestionDto,  SupportResponseDto,
} from '../dto/ai-gateway.dto';
import { PrismaService } from 'src/database/prisma/prisma.service';
 
@ApiTags('AI')
@ApiBearerAuth('BearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AiGatewayController {
  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prisma:    PrismaService,
  ) {}
 
  // ── POST /ai/chat ─────────────────────────────────────────────────────
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to Kira AI assistant' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chat(
    @CurrentUser() user: any,
    @Body() dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const result = await this.aiGateway.chat(user.id, dto.message);
    return { reply: result.reply, modelUsed: result.modelUsed, requestId: result.requestId };
  }
 
  // ── POST /ai/search ───────────────────────────────────────────────────
  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'AI food search — extract structured criteria from natural language',
    description:
      'Input: `"spicy chicken under 5000 XAF"`\n\n' +
      'Output: `{ keywords, maxPrice, tags }` used to query the menu database.',
  })
  @ApiResponse({ status: 200, type: RecommendationResponseDto })
  async search(
    @CurrentUser() user: any,
    @Body() dto: SearchQueryDto,
  ): Promise<RecommendationResponseDto> {
    const result = await this.aiGateway.getRecommendations(user.id, dto.query);
    return {
      result: {
        keywords: result.result.keywords,
        maxPrice: result.result.maxPrice,
        tags:     result.result.tags,
      },
      modelUsed: result.modelUsed,
    };
  }
 
  // ── POST /ai/support ──────────────────────────────────────────────────
  @Post('support')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'AI customer support — answers order/delivery questions',
    description:
      'Backend assembles order context from the DB before calling the AI Gateway. ' +
      'The AI never touches the database directly.',
  })
  @ApiResponse({ status: 200, type: SupportResponseDto })
  async support(
    @CurrentUser() user: any,
    @Body() dto: SupportQuestionDto,
  ): Promise<SupportResponseDto> {
    // ── Assemble context from real DB data ─────────────────────────────
    const latestOrder = await this.prisma.order.findFirst({
      where:   { userId: user.id },
      orderBy: { placedAt: 'desc' },
      include: {
        restaurant: { select: { name: true } },
        driver:     { include: { user: { select: { name: true } } } },
        payment:    true,
      },
    });
 
    const context: Record<string, unknown> = {};
 
    if (latestOrder) {
      context.orderNumber    = latestOrder.orderNumber;
      context.status         = latestOrder.status;
      context.restaurantName = latestOrder.restaurant?.name;
      context.paymentStatus  = latestOrder.payment?.status ?? null;
 
      if (latestOrder.driver) {
        context.driverName = (latestOrder.driver as any).user?.name ?? null;
      }
 
      if (latestOrder.estimatedDeliveryTime) {
        context.estimatedMinutes = latestOrder.estimatedDeliveryTime;
      }
    }
    // ──────────────────────────────────────────────────────────────────
 
    const result = await this.aiGateway.getSupportAnswer(
      user.id, dto.question, context,
    );
    return { answer: result.answer, modelUsed: result.modelUsed };
  }
 
  // ── GET /ai/health ────────────────────────────────────────────────────
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'AI Gateway health check' })
  async health() {
    return this.aiGateway.healthCheck();
  }
}