import { IsUUID, IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
 
export enum PaymentProviderEnum { MTN_MOMO = 'MTN_MOMO', ORANGE_MONEY = 'ORANGE_MONEY' }
 
export class RequestPaymentDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsUUID() orderId: string;
 
  @ApiProperty({ example: 'MTN_MOMO', enum: PaymentProviderEnum })
  @IsEnum(PaymentProviderEnum) provider: PaymentProviderEnum;
 
  @ApiProperty({ example: '690000001', description: 'Customer phone number (9 digits, no country code)' })
  @IsString() phoneNumber: string;
}
 
export class PaymentStatusResponseDto {
  @ApiProperty() paymentId: string;
  @ApiProperty() orderId: string;
  @ApiProperty() status: string;
  @ApiProperty() provider: string;
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
  @ApiProperty() phoneNumber: string;
  @ApiProperty() providerRef: string | null;
  @ApiProperty() paidAt: Date | null;
  @ApiProperty() failureReason: string | null;
  @ApiProperty() createdAt: Date;
}