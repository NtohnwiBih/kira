import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser }  from 'src/modules/auth/decorators';

import { CartService }         from '../services/cart.service';
import { AddCartItemDto, UpdateCartItemDto, CartResponseDto } from '../dto/cart.dto';

@ApiTags('Cart')
@ApiBearerAuth('BearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('cart')
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ── GET /cart ─────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Get the current user\'s cart',
    description: 'Creates an empty cart automatically if none exists.',
  })
  @ApiResponse({ status: 200, type: CartResponseDto })
  getCart(@CurrentUser() user: any): Promise<CartResponseDto> {
    return this.cartService.getCart(user.id);
  }

  // ── POST /cart/items ──────────────────────────────────────────────────────
  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add an item to the cart',
    description:
      '- Validates item availability\n' +
      '- Validates customization selections against group rules\n' +
      '- Rejects items from a different restaurant than existing cart contents\n' +
      '- Snapshots `name` and `unitPrice` from the MenuItem',
  })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Item unavailable or invalid customization' })
  @ApiResponse({ status: 409, description: 'Cart contains items from a different restaurant' })
  addItem(
    @CurrentUser() user: any,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user.id, dto);
  }

  // ── PATCH /cart/items/:id ─────────────────────────────────────────────────
  @Patch('items/:id')
  @ApiOperation({
    summary: 'Update quantity or notes for a cart item',
    description: 'Automatically recalculates `lineTotal` when quantity changes.',
  })
  @ApiParam({ name: 'id', description: 'CartItem UUID' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  updateItem(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(user.id, itemId, dto);
  }

  // ── DELETE /cart/items/:id ────────────────────────────────────────────────
  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove an item from the cart',
    description: 'Unbinds the restaurant when the last item is removed.',
  })
  @ApiParam({ name: 'id', description: 'CartItem UUID' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  removeItem(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user.id, itemId);
  }

  // ── DELETE /cart/clear ────────────────────────────────────────────────────
  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all items from the cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  clearCart(@CurrentUser() user: any): Promise<CartResponseDto> {
    return this.cartService.clearCart(user.id);
  }
}