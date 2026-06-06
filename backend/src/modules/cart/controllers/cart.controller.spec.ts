import { Test, TestingModule } from '@nestjs/testing';
import { CartController }      from './cart.controller';
import { CartService }         from '../services/cart.service';

const mockCartService = {
  getCart:    jest.fn(),
  addItem:    jest.fn(),
  updateItem: jest.fn(),
  removeItem: jest.fn(),
  clearCart:  jest.fn(),
};

const mockUser = { id: 'user-1' };

// Minimal cart response shape for assertion
const fakeCart = { id: 'cart-1', items: [], totals: { subtotal: 0 } };

describe('CartController', () => {
  let controller: CartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers:   [{ provide: CartService, useValue: mockCartService }],
    }).compile();

    controller = module.get<CartController>(CartController);
    jest.clearAllMocks();
  });

  it('getCart delegates to CartService.getCart with userId', async () => {
    mockCartService.getCart.mockResolvedValue(fakeCart);

    const result = await controller.getCart(mockUser);

    expect(mockCartService.getCart).toHaveBeenCalledWith('user-1');
    expect(result).toBe(fakeCart);
  });

  it('addItem delegates to CartService.addItem with userId and dto', async () => {
    const dto = { menuItemId: 'menu-1', quantity: 1 };
    mockCartService.addItem.mockResolvedValue(fakeCart);

    const result = await controller.addItem(mockUser, dto as any);

    expect(mockCartService.addItem).toHaveBeenCalledWith('user-1', dto);
    expect(result).toBe(fakeCart);
  });

  it('updateItem delegates to CartService.updateItem', async () => {
    const dto = { quantity: 3 };
    mockCartService.updateItem.mockResolvedValue(fakeCart);

    await controller.updateItem(mockUser, 'item-1', dto as any);

    expect(mockCartService.updateItem).toHaveBeenCalledWith('user-1', 'item-1', dto);
  });

  it('removeItem delegates to CartService.removeItem', async () => {
    mockCartService.removeItem.mockResolvedValue(fakeCart);

    await controller.removeItem(mockUser, 'item-1');

    expect(mockCartService.removeItem).toHaveBeenCalledWith('user-1', 'item-1');
  });

  it('clearCart delegates to CartService.clearCart', async () => {
    mockCartService.clearCart.mockResolvedValue(fakeCart);

    await controller.clearCart(mockUser);

    expect(mockCartService.clearCart).toHaveBeenCalledWith('user-1');
  });
});