import { Test, TestingModule } from '@nestjs/testing';
import { CartRepository }     from './cart.repository';
import { PrismaService } from 'src/database/prisma/prisma.service';

const mockPrisma = {
  cart:     { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  cartItem: {
    findFirst:   jest.fn(),
    create:      jest.fn(),
    update:      jest.fn(),
    delete:      jest.fn(),
    deleteMany:  jest.fn(),
    count:       jest.fn(),
  },
};

describe('CartRepository', () => {
  let repo: CartRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repo = module.get<CartRepository>(CartRepository);
    jest.clearAllMocks();
  });

  // ── findOrCreate ───────────────────────────────────────────────────────────

  describe('findOrCreate', () => {
    it('returns existing cart without creating a new one', async () => {
      const existing = { id: 'cart-1', status: 'ACTIVE' };
      mockPrisma.cart.findFirst.mockResolvedValue(existing);

      const result = await repo.findOrCreate('user-1');

      expect(result).toBe(existing);
      expect(mockPrisma.cart.create).not.toHaveBeenCalled();
    });

    it('creates a new cart when none exists', async () => {
      const created = { id: 'cart-new', status: 'ACTIVE' };
      mockPrisma.cart.findFirst.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(created);

      const result = await repo.findOrCreate('user-1');

      expect(mockPrisma.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId: 'user-1', status: 'ACTIVE' } }),
      );
      expect(result).toBe(created);
    });
  });

  // ── findItemById ───────────────────────────────────────────────────────────

  describe('findItemById', () => {
    it('queries with both itemId and cartId to prevent cross-cart access', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);

      await repo.findItemById('item-1', 'cart-1');

      expect(mockPrisma.cartItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1', cartId: 'cart-1' },
        }),
      );
    });
  });

  // ── clearItems ─────────────────────────────────────────────────────────────

  describe('clearItems', () => {
    it('deletes all items and resets restaurantId and promoCode', async () => {
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.cart.update.mockResolvedValue({ id: 'cart-1' });

      await repo.clearItems('cart-1');

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
      expect(mockPrisma.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { restaurantId: null, promoCode: null, discountAmount: null },
        }),
      );
    });
  });

  // ── countItems ─────────────────────────────────────────────────────────────

  describe('countItems', () => {
    it('passes cartId filter to Prisma count', async () => {
      mockPrisma.cartItem.count.mockResolvedValue(5);

      const count = await repo.countItems('cart-1');

      expect(count).toBe(5);
      expect(mockPrisma.cartItem.count).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
    });
  });
});