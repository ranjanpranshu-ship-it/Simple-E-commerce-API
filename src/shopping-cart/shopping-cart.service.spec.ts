import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShoppingCartService } from './shopping-cart.service.js';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

const mockCartRepo = {
  findOneBy: vi.fn(),
  find: vi.fn(),
  create: vi.fn((data) => data),
  save: vi.fn(),
  delete: vi.fn(),
};

const mockProductRepo = {
  findOneBy: vi.fn(),
};

function createService() {
  return new ShoppingCartService(mockCartRepo as any, mockProductRepo as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ShoppingCartService', () => {
  describe('CreateCart', () => {
    it('should create a new cart item', async () => {
      const productId = new ObjectId();
      const product = { id: productId, Productname: 'Laptop', Productprice: 50000 };
      mockProductRepo.findOneBy.mockResolvedValue(product);
      mockCartRepo.findOneBy.mockResolvedValue(null);
      mockCartRepo.save.mockResolvedValue({
        ProductId: productId,
        ProductName: 'Laptop',
        Quantity: 1,
        TotalPrice: 50000,
        paymentStatus: 'pending',
      });

      const service = createService();
      const result = await service.CreateCart(1, {
        ProductId: productId.toString(),
        Quantity: 1,
      } as any);

      expect(result.message).toBe('Cart created successfully');
      expect(result.totalPrice).toBe(50000);
    });

    it('should throw if product not found', async () => {
      mockProductRepo.findOneBy.mockResolvedValue(null);

      const service = createService();
      await expect(
        service.CreateCart(1, { ProductId: new ObjectId().toString(), Quantity: 1 } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('should update existing cart item if product already in cart', async () => {
      const productId = new ObjectId();
      const product = { id: productId, Productname: 'Phone', Productprice: 30000 };
      const existing = {
        ProductId: productId,
        Quantity: 1,
        TotalPrice: 30000,
        EachPrice: 30000,
      };

      mockProductRepo.findOneBy.mockResolvedValue(product);
      mockCartRepo.findOneBy.mockResolvedValue(existing);
      mockCartRepo.save.mockResolvedValue(existing);

      const service = createService();
      const result = await service.CreateCart(1, {
        ProductId: productId.toString(),
        Quantity: 2,
      } as any);

      expect(result.message).toBe('Cart updated successfully');
      expect(existing.Quantity).toBe(3);
      expect(existing.TotalPrice).toBe(90000);
    });
  });

  describe('FindAllCart', () => {
    it('should return only the carts for the given user', async () => {
      const carts = [{ id: new ObjectId(), ProductName: 'Laptop' }];
      mockCartRepo.find.mockResolvedValue(carts);

      const service = createService();
      const result = await service.FindAllCart(1);

      expect(mockCartRepo.find).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(result.savedShoppingCart).toEqual(carts);
    });
  });

  describe('UpdateCart', () => {
    it('should update quantity and recalculate price', async () => {
      const cartId = new ObjectId();
      const cart = { id: cartId, userId: 1, Quantity: 1, EachPrice: 1000, TotalPrice: 1000 };
      mockCartRepo.findOneBy.mockResolvedValue(cart);
      mockCartRepo.save.mockResolvedValue(cart);

      const service = createService();
      const result = await service.UpdateCart(1, cartId.toString(), { Quantity: 3 } as any);

      expect(cart.Quantity).toBe(3);
      expect(cart.TotalPrice).toBe(3000);
      expect(result.message).toBe('Cart updated successfully');
    });

    it('should throw if cart not found', async () => {
      mockCartRepo.findOneBy.mockResolvedValue(null);

      const service = createService();
      await expect(
        service.UpdateCart(1, new ObjectId().toString(), { Quantity: 2 } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('RemoveCart', () => {
    it('should delete cart item', async () => {
      const cartId = new ObjectId();
      mockCartRepo.findOneBy.mockResolvedValue({ id: cartId });
      mockCartRepo.delete.mockResolvedValue(undefined);

      const service = createService();
      const result = await service.RemoveCart(1, cartId.toString());

      expect(mockCartRepo.delete).toHaveBeenCalledWith(cartId);
      expect(result).toEqual({ message: 'Cart deleted successfully' });
    });

    it('should throw if cart not found', async () => {
      mockCartRepo.findOneBy.mockResolvedValue(null);

      const service = createService();
      await expect(service.RemoveCart(1, new ObjectId().toString())).rejects.toThrow(NotFoundException);
    });
  });
});
