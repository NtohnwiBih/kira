import {
  Controller, Get, Post, Body, Param, Query,
  ParseUUIDPipe, HttpCode, HttpStatus, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser }  from '../../auth/decorators';
import { OrderService } from '../services/order.service';
import {
  CheckoutDto, ConfirmOrderDto, RejectOrderDto, CancelOrderDto,
  OrderResponseDto, PaginatedOrdersDto, CheckoutResponseDto,
} from '../dto/order.dto';

@ApiTags('Orders')
@ApiBearerAuth('BearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('orders')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place an order from the current cart' })
  @ApiResponse({ status: 201, type: CheckoutResponseDto })
  checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.orderService.checkout(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my orders (paginated)' })
  @ApiQuery({ name: 'page',  required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, type: PaginatedOrdersDto })
  findMyOrders(
    @CurrentUser() user: any,
    @Query('page')  page  = 1,
    @Query('limit') limit = 10,
  ) {
    return this.orderService.findByUser(user.id, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.orderService.findById(id, user.id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restaurant confirms the order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.orderService.confirm(id, dto, user.id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restaurant rejects the order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.orderService.reject(id, dto, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer cancels the order (within cancellation window)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.orderService.cancel(id, dto, user.id);
  }
}