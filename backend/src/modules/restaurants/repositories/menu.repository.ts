import { Injectable } from '@nestjs/common';
import { Menu, MenuItem, MenuCategory, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
 
@Injectable()
export class MenuRepository {
  constructor(private readonly prisma: PrismaService) {}
 
  // ── Menu CRUD ────────────────────────────────────────────────────────────
 
  async createMenu(data: Prisma.MenuCreateInput): Promise<Menu> {
    return this.prisma.menu.create({ data });
  }
 
  async findMenuById(id: string, restaurantId: string): Promise<Menu | null> {
    return this.prisma.menu.findFirst({
      where:   { id, restaurantId, deletedAt: null },
      include: { categories: { include: { items: { where: { deletedAt: null } } } } },
    });
  }
 
  async findMenusByRestaurant(
    restaurantId: string,
    activeOnly = false,
  ): Promise<Menu[]> {
    return this.prisma.menu.findMany({
      where: {
        restaurantId,
        deletedAt: null,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        categories: {
          where:   { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              where:   { isAvailable: true, deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
 
  async findDailyMenuByDate(restaurantId: string, date: Date): Promise<Menu | null> {
    return this.prisma.menu.findFirst({
      where: {
        restaurantId,
        menuType:  'DAILY',
        activeDate: date,
        isActive:   true,
        deletedAt:  null,
      },
    });
  }
 
  async countMenus(restaurantId: string): Promise<number> {
    return this.prisma.menu.count({
      where: { restaurantId, deletedAt: null },
    });
  }
 
  async updateMenu(id: string, data: Prisma.MenuUpdateInput): Promise<Menu> {
    return this.prisma.menu.update({ where: { id }, data });
  }
 
  async softDeleteMenu(id: string): Promise<void> {
    await this.prisma.menu.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });
  }
 
  // ── Category CRUD ────────────────────────────────────────────────────────
 
  async createCategory(data: Prisma.MenuCategoryCreateInput): Promise<MenuCategory> {
    return this.prisma.menuCategory.create({ data });
  }
 
  async findCategoryById(id: string, menuId: string): Promise<MenuCategory | null> {
    return this.prisma.menuCategory.findFirst({ where: { id, menuId } });
  }
 
  async countCategories(menuId: string): Promise<number> {
    return this.prisma.menuCategory.count({ where: { menuId } });
  }
 
  async updateCategory(id: string, data: Prisma.MenuCategoryUpdateInput): Promise<MenuCategory> {
    return this.prisma.menuCategory.update({ where: { id }, data });
  }
 
  async deleteCategory(id: string): Promise<void> {
    await this.prisma.menuCategory.delete({ where: { id } });
  }
 
  // ── Menu item CRUD ────────────────────────────────────────────────────────
 
  async createItem(data: Prisma.MenuItemCreateInput): Promise<MenuItem> {
    return this.prisma.menuItem.create({ data });
  }
 
  async findItemById(id: string): Promise<MenuItem | null> {
    return this.prisma.menuItem.findFirst({
      where:   { id, deletedAt: null },
      include: {
        customizationGroups: {
          where:   { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: { options: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
  }
 
  async findItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where:   { categoryId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }
 
  async countItemsInCategory(categoryId: string): Promise<number> {
    return this.prisma.menuItem.count({ where: { categoryId, deletedAt: null } });
  }
 
  async updateItem(id: string, data: Prisma.MenuItemUpdateInput): Promise<MenuItem> {
    return this.prisma.menuItem.update({ where: { id }, data });
  }
 
  async softDeleteItem(id: string): Promise<void> {
    await this.prisma.menuItem.update({
      where: { id },
      data:  { deletedAt: new Date(), isAvailable: false },
    });
  }
 
  async decrementStock(id: string, qty: number): Promise<MenuItem> {
    return this.prisma.menuItem.update({
      where: { id },
      data:  {
        stockQuantity: { decrement: qty },
        isAvailable:   true, // let service re-check threshold after decrement
      },
    });
  }
}