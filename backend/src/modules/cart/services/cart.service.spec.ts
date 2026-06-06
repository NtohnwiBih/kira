import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 }       from '@nestjs/event-emitter';
import { NotFoundException }   from '@nestjs/common';

import { CartService }    from './cart.service';
import { CartRepository } from '../repositories/cart.repository';
import { PrismaService }  from 'src/database/prisma/prisma.service';
import { CART_CONSTANTS } from '../constants/cart.constants';
import {
  CartItemNotFoundException,
  CartMaxItemsException,
  InvalidCartRestaurantException,
  MenuItemUnavailableException,
  InvalidCustomizationException,
  RequiredCustomizationMissingException,
} from '../exceptions/cart.exception';
import {
  CartItemAddedEvent,
  CartItemRemovedEvent,
  CartClearedEvent,
} from '../events/cart.events';

// ── Factories ──────────────────────────────────────────────────────────────────
// Centralised builders mean one change fixes all tests when a shape evolves.

const makeCart = (overrides: Record<string, any> = {}) => ({
  id:             'cart-1',
  userId:         'user-1',
  restaurantId:   null,
  status:         'ACTIVE',
  promoCode:      null,
  discountAmount: null,
  updatedAt:      new Date('2024-01-01'),
  restaurant:     null,
  items:          [],
  ...overrides,
});

const makeCartItem = (overrides: Record<string, any> = {}) => ({
  id:                 'item-1',
  cartId:             'cart-1',
  menuItemId:         'menu-1',
  name:               'Burger',
  unitPrice:          10,
  quantity:           1,
  customizationTotal: 0,
  lineTotal:          10,
  notes:              null,
  customizations:     [],
  menuItem:           { imageUrl: null },
  ...overrides,
});

const makeMenuItem = (overrides: Record<string, any> = {}) => ({
  id:          'menu-1',
  name:        'Burger',
  price:       10,
  isAvailable: true,
  deletedAt:   null,
  menu:        { restaurantId: 'restaurant-1' },
  customizationGroups: [],
  ...overrides,
});

const makeGroup = (overrides: Record<string, any> = {}) => ({
  id:         'group-1',
  name:       'Size',
  isRequired: false,
  minSelect:  1,
  maxSelect:  1,
  options:    [
    { id: 'option-1', name: 'Large', priceAdd: 2, isAvailable: true },
  ],
  ...overrides,
});

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockCartRepo = {
  findOrCreate:         jest.fn(),
  findActiveByUserId:   jest.fn(),
  findItemById:         jest.fn(),
  countItems:           jest.fn(),
  setRestaurant:        jest.fn(),
  addItem:              jest.fn(),
  updateItemQuantity:   jest.fn(),
  removeItem:           jest.fn(),
  clearItems:           jest.fn(),
  markCheckedOut:       jest.fn(),
};

const mockPrisma = {
  menuItem: { findFirst: jest.fn() },
};

const mockEmitter = { emit: jest.fn() };

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CartRepository,  useValue: mockCartRepo },
        { provide: PrismaService,   useValue: mockPrisma },
        { provide: EventEmitter2,   useValue: mockEmitter },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  // ── getCart ────────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('returns mapped CartResponseDto for an empty cart', async () => {
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());

      const result = await service.getCart('user-1');

      expect(result.id).toBe('cart-1');
      expect(result.items).toEqual([]);
      expect(result.totals.subtotal).toBe(0);
      expect(result.restaurant).toBeNull();
    });

    it('calculates totals correctly when cart has items', async () => {
      const cart = makeCart({
        restaurantId:   'restaurant-1',
        discountAmount: 5,
        restaurant: {
          id:                 'restaurant-1',
          name:               'Test Restaurant',
          logoUrl:            null,
          deliveryFee:        3,
          minimumOrderAmount: 0,
        },
        items: [
          makeCartItem({ lineTotal: 20, quantity: 2 }),
          makeCartItem({ id: 'item-2', lineTotal: 10, quantity: 1 }),
        ],
      });
      mockCartRepo.findOrCreate.mockResolvedValue(cart);

      const result = await service.getCart('user-1');

      expect(result.totals.subtotal).toBe(30);       // 20 + 10
      expect(result.totals.discountAmount).toBe(5);
      expect(result.totals.deliveryFee).toBe(3);
      expect(result.totals.grandTotal).toBe(28);     // 30 + 3 - 5
      expect(result.itemCount).toBe(3);              // 2 + 1
    });

    it('clamps grandTotal to 0 when discounts exceed subtotal', async () => {
      const cart = makeCart({
        discountAmount: 999,
        items: [makeCartItem({ lineTotal: 5, quantity: 1 })],
      });
      mockCartRepo.findOrCreate.mockResolvedValue(cart);

      const result = await service.getCart('user-1');

      expect(result.totals.grandTotal).toBe(0);
    });
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    const dto = { menuItemId: 'menu-1', quantity: 2, customizations: [] };

    beforeEach(() => {
      // Happy-path defaults — individual tests override as needed
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());
      mockPrisma.menuItem.findFirst.mockResolvedValue(makeMenuItem());
      mockCartRepo.countItems.mockResolvedValue(0);
      mockCartRepo.setRestaurant.mockResolvedValue(undefined);
      mockCartRepo.addItem.mockResolvedValue(makeCartItem());
    });

    it('adds an item and returns updated cart', async () => {
      // Second call to getCart after add
      mockCartRepo.findOrCreate
        .mockResolvedValueOnce(makeCart())              // initial findOrCreate
        .mockResolvedValueOnce(makeCart({              // getCart refresh
          items: [makeCartItem({ quantity: 2, lineTotal: 20 })],
        }));

      const result = await service.addItem('user-1', dto);

      expect(mockCartRepo.addItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
        menuItemId: 'menu-1',
        quantity:   2,
        lineTotal:  20,       // (10 + 0) * 2
      }));
      expect(result.items).toHaveLength(1);
    });

    it('throws NotFoundException when menu item does not exist', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(null);

      await expect(service.addItem('user-1', dto))
        .rejects.toThrow(NotFoundException);
    });

    it('throws MenuItemUnavailableException when item is not available', async () => {
      mockPrisma.menuItem.findFirst.mockResolvedValue(
        makeMenuItem({ isAvailable: false }),
      );

      await expect(service.addItem('user-1', dto))
        .rejects.toThrow(MenuItemUnavailableException);
    });

    it('throws InvalidCartRestaurantException when adding item from different restaurant', async () => {
      mockCartRepo.findOrCreate.mockResolvedValue(
        makeCart({ restaurantId: 'other-restaurant' }),
      );

      await expect(service.addItem('user-1', dto))
        .rejects.toThrow(InvalidCartRestaurantException);
    });

    it('throws CartMaxItemsException when cart is at capacity', async () => {
      mockCartRepo.countItems.mockResolvedValue(CART_CONSTANTS.MAX_ITEMS_PER_CART);

      await expect(service.addItem('user-1', dto))
        .rejects.toThrow(CartMaxItemsException);
    });

    it('binds restaurant when cart has no restaurant yet', async () => {
      mockCartRepo.findOrCreate
        .mockResolvedValueOnce(makeCart({ restaurantId: null }))
        .mockResolvedValueOnce(makeCart());

      await service.addItem('user-1', dto);

      expect(mockCartRepo.setRestaurant).toHaveBeenCalledWith('cart-1', 'restaurant-1');
    });

    it('does not rebind restaurant when cart already has one', async () => {
      mockCartRepo.findOrCreate.mockResolvedValue(
        makeCart({ restaurantId: 'restaurant-1' }),
      );

      await service.addItem('user-1', dto);

      expect(mockCartRepo.setRestaurant).not.toHaveBeenCalled();
    });

    it('emits CartItemAddedEvent', async () => {
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());

      await service.addItem('user-1', dto);

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        CartItemAddedEvent.EVENT,
        expect.any(CartItemAddedEvent),
      );
    });
  });

  // ── addItem — customization validation (critical path) ─────────────────────
  // These live in a private method but are tested through addItem because
  // the logic is complex enough to warrant exhaustive coverage.

  describe('addItem — customization validation', () => {
    const group = makeGroup({ isRequired: true, minSelect: 1, maxSelect: 1 });

    beforeEach(() => {
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());
      mockCartRepo.countItems.mockResolvedValue(0);
      mockCartRepo.setRestaurant.mockResolvedValue(undefined);
      mockCartRepo.addItem.mockResolvedValue(makeCartItem());
      mockPrisma.menuItem.findFirst.mockResolvedValue(
        makeMenuItem({ customizationGroups: [group] }),
      );
    });

    it('throws RequiredCustomizationMissingException when required group has no selection', async () => {
      await expect(
        service.addItem('user-1', { menuItemId: 'menu-1', quantity: 1, customizations: [] }),
      ).rejects.toThrow(RequiredCustomizationMissingException);
    });

    it('throws InvalidCustomizationException when selection exceeds maxSelect', async () => {
      await expect(
        service.addItem('user-1', {
          menuItemId:     'menu-1',
          quantity:       1,
          customizations: [
            { groupId: 'group-1', optionId: 'option-1' },
            { groupId: 'group-1', optionId: 'option-1' }, // duplicate exceeds max:1
          ],
        }),
      ).rejects.toThrow(InvalidCustomizationException);
    });

    it('throws InvalidCustomizationException when optionId does not belong to group', async () => {
      await expect(
        service.addItem('user-1', {
          menuItemId:     'menu-1',
          quantity:       1,
          customizations: [{ groupId: 'group-1', optionId: 'nonexistent-option' }],
        }),
      ).rejects.toThrow(InvalidCustomizationException);
    });

    it('throws InvalidCustomizationException when groupId does not belong to item', async () => {
      await expect(
        service.addItem('user-1', {
          menuItemId:     'menu-1',
          quantity:       1,
          customizations: [{ groupId: 'ghost-group', optionId: 'option-1' }],
        }),
      ).rejects.toThrow(InvalidCustomizationException);
    });

    it('adds customization price to line total', async () => {
      // group has option-1 with priceAdd: 2, item price is 10, qty 1 → 12
      mockCartRepo.findOrCreate
        .mockResolvedValueOnce(makeCart())
        .mockResolvedValueOnce(makeCart());

      await service.addItem('user-1', {
        menuItemId:     'menu-1',
        quantity:       1,
        customizations: [{ groupId: 'group-1', optionId: 'option-1' }],
      });

      expect(mockCartRepo.addItem).toHaveBeenCalledWith('cart-1', expect.objectContaining({
        customizationTotal: 2,
        lineTotal:          12,   // (10 + 2) * 1
      }));
    });
  });

  // ── updateItem ─────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('recalculates lineTotal from unitPrice + customizationTotal × new quantity', async () => {
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());
      mockCartRepo.findItemById.mockResolvedValue(
        makeCartItem({ unitPrice: 10, customizationTotal: 2, quantity: 1 }),
      );
      mockCartRepo.updateItemQuantity.mockResolvedValue(undefined);
      mockCartRepo.findOrCreate.mockResolvedValueOnce(makeCart()); // getCart refresh

      await service.updateItem('user-1', 'item-1', { quantity: 3 });

      expect(mockCartRepo.updateItemQuantity).toHaveBeenCalledWith(
        'item-1', 3, 36, undefined,   // (10 + 2) * 3 = 36
      );
    });

    it('throws CartItemNotFoundException when item not in cart', async () => {
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());
      mockCartRepo.findItemById.mockResolvedValue(null);

      await expect(service.updateItem('user-1', 'item-1', { quantity: 2 }))
        .rejects.toThrow(CartItemNotFoundException);
    });
  });

  // ── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    beforeEach(() => {
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart({ restaurantId: 'r-1' }));
      mockCartRepo.findItemById.mockResolvedValue(makeCartItem());
      mockCartRepo.removeItem.mockResolvedValue(undefined);
    });

    it('throws CartItemNotFoundException when item not in cart', async () => {
      mockCartRepo.findItemById.mockResolvedValue(null);

      await expect(service.removeItem('user-1', 'item-1'))
        .rejects.toThrow(CartItemNotFoundException);
    });

    it('unbinds restaurant when last item is removed', async () => {
      mockCartRepo.countItems.mockResolvedValue(0);
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart()); // getCart refresh

      await service.removeItem('user-1', 'item-1');

      expect(mockCartRepo.setRestaurant).toHaveBeenCalledWith('cart-1', null);
    });

    it('does not unbind restaurant when other items remain', async () => {
      mockCartRepo.countItems.mockResolvedValue(2);
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());

      await service.removeItem('user-1', 'item-1');

      expect(mockCartRepo.setRestaurant).not.toHaveBeenCalled();
    });

    it('emits CartItemRemovedEvent', async () => {
      mockCartRepo.countItems.mockResolvedValue(1);
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());

      await service.removeItem('user-1', 'item-1');

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        CartItemRemovedEvent.EVENT,
        expect.any(CartItemRemovedEvent),
      );
    });
  });

  // ── clearCart ──────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('calls clearItems and emits CartClearedEvent', async () => {
      mockCartRepo.findOrCreate.mockResolvedValue(makeCart());
      mockCartRepo.clearItems.mockResolvedValue(makeCart());

      await service.clearCart('user-1');

      expect(mockCartRepo.clearItems).toHaveBeenCalledWith('cart-1');
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        CartClearedEvent.EVENT,
        expect.any(CartClearedEvent),
      );
    });
  });

  // ── checkoutCart ───────────────────────────────────────────────────────────

  describe('checkoutCart', () => {
    it('marks cart as checked out when active cart exists', async () => {
      mockCartRepo.findActiveByUserId.mockResolvedValue(makeCart());
      mockCartRepo.markCheckedOut.mockResolvedValue(undefined);

      await service.checkoutCart('user-1');

      expect(mockCartRepo.markCheckedOut).toHaveBeenCalledWith('cart-1');
    });

    it('does nothing when no active cart exists', async () => {
      mockCartRepo.findActiveByUserId.mockResolvedValue(null);

      await service.checkoutCart('user-1');

      expect(mockCartRepo.markCheckedOut).not.toHaveBeenCalled();
    });
  });
});