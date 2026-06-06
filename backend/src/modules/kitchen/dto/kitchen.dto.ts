import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptOrderDto {
  @ApiProperty({ example: 20, minimum: 1, maximum: 120 })
  @IsInt() @Min(1) @Max(120)
  estimatedPrepTime: number;
}

export class RejectOrderDto {
  @ApiProperty({ example: 'Ingredient out of stock', maxLength: 500 })
  @IsString() @MaxLength(500)
  reason: string;
}

export class UpdatePrepTimeDto {
  @ApiProperty({ example: 30, minimum: 1, maximum: 120 })
  @IsInt() @Min(1) @Max(120)
  estimatedPrepTime: number;

  @ApiPropertyOptional({ example: 'Lunch rush — extra 10 min' })
  @IsOptional() @IsString() @MaxLength(255)
  note?: string;
}

export class ChangeKitchenStatusDto {
  @ApiProperty({ example: 'BUSY', enum: ['OPEN','CLOSED','BUSY','PAUSED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ description: 'ISO datetime — auto-resume PAUSED/BUSY at this time' })
  @IsOptional() @IsString()
  autoResumeAt?: string;
}

export class KitchenOrderItemDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() quantity: number;
  @ApiProperty() lineTotal: number;
  @ApiProperty({ nullable: true }) notes: string | null;
  @ApiProperty({ nullable: true }) customizations: any;
}

export class KitchenOrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() orderNumber: string;
  @ApiProperty() status: string;
  @ApiProperty({ nullable: true }) estimatedPrepTime: number | null;
  @ApiProperty({ nullable: true }) specialInstructions: string | null;
  @ApiProperty() placedAt: Date;
  @ApiProperty({ nullable: true }) confirmedAt: Date | null;
  @ApiProperty({ nullable: true }) preparingAt: Date | null;
  @ApiProperty({ type: () => [KitchenOrderItemDto] }) items: KitchenOrderItemDto[];
  @ApiProperty({ nullable: true }) customer: { name: string; phone: string | null } | null;
}

export class KitchenWorkloadDto {
  @ApiProperty() pending: number;
  @ApiProperty() confirmed: number;
  @ApiProperty() preparing: number;
  @ApiProperty() readyForPickup: number;
  @ApiProperty() totalActive: number;
  @ApiProperty() avgPrepTimeMin: number;
}

export class KitchenActionResponseDto {
  @ApiProperty() orderId: string;
  @ApiProperty() status: string;
  @ApiProperty() message: string;
  @ApiProperty({ nullable: true }) estimatedPrepTime: number | null;
}