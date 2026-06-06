import {
  Controller, Post, Get, Body, Param, ParseUUIDPipe,
  HttpCode, HttpStatus, UseGuards, UsePipes, ValidationPipe, Headers, RawBodyRequest, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public, CurrentUser } from '../../auth/decorators';
import { PaymentService } from '../services/payment.service';
import { RequestPaymentDto, PaymentStatusResponseDto } from '../dto/payment.dto';
 
@ApiTags('Payments')
@Controller('payments')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
 
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('BearerAuth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Initiate a Mobile Money payment',
    description: 'Sends a RequestToPay to the customer\'s MTN MOMO or Orange Money number. The customer approves the payment on their phone.',
  })
  @ApiResponse({ status: 201, type: PaymentStatusResponseDto })
  requestPayment(@CurrentUser() user: any, @Body() dto: RequestPaymentDto) {
    return this.paymentService.requestPayment(user.id, dto);
  }
 
  @Get(':id/status')
  @ApiBearerAuth('BearerAuth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Poll payment status' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, type: PaymentStatusResponseDto })
  getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.getStatus(id);
  }
 
  @Post('webhook/momo')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MTN MoMo webhook endpoint (provider callback)' })
  handleMomoWebhook(
    @Body() payload: any,
    @Headers('x-callback-signature') signature: string,
  ) {
    return this.paymentService.handleMomoWebhook(payload, signature);
  }
 
  @Post('webhook/om')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Orange Money webhook endpoint (provider callback)' })
  handleOmWebhook(@Body() payload: any) {
    return this.paymentService.handleOmWebhook(payload);
  }
}