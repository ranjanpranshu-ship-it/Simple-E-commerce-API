import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShoppingCartController } from './shopping-cart.controller.js';
import { ObjectId } from 'mongodb';

const mockCartService = {
  CreateCart: vi.fn(),
  FindAllCart: vi.fn(),
  FindOneCart: vi.fn(),
  UpdateCart: vi.fn(),
  RemoveCart: vi.fn(),
};

function createController() {
  return new ShoppingCartController(mockCartService as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ShoppingCartController', () => {
  describe('POST /shopping-cart/create', () => {
    it('should create a cart item', async () => {
      const dto = { ProductId: new ObjectId().toString(), Quantity: 2 };
      const result = { message: 'Cart created successfully', totalPrice: 100000 };
      mockCartService.CreateCart.mockResolvedValue(result);

      const controller = createController();
      const res = await controller.create({ user: { id: 1 } }, dto as any);

      expect(mockCartService.CreateCart).toHaveBeenCalledWith(1, dto);
      expect(res).toEqual(result);
    });
  });

  describe('GET /shopping-cart/listAll', () => {
    it('should return only the current user carts', async () => {
      const result = { message: 'All carts found successfully', savedShoppingCart: [] };
      mockCartService.FindAllCart.mockResolvedValue(result);

      const controller = createController();
      const res = await controller.findAll({ user: { id: 1 } });

      expect(mockCartService.FindAllCart).toHaveBeenCalledWith(1);
      expect(res).toEqual(result);
    });
  });

  describe('GET /shopping-cart/findone/:id', () => {
    it('should return a single cart item', async () => {
      const id = new ObjectId();
      const result = { message: 'Cart found successfully', shoppingCart: { id } };
      mockCartService.FindOneCart.mockResolvedValue(result);

      const controller = createController();
      const res = await controller.findOne({ user: { id: 1 } }, id.toString());

      expect(mockCartService.FindOneCart).toHaveBeenCalledWith(1, id.toString());
      expect(res).toEqual(result);
    });
  });

  describe('PATCH /shopping-cart/update/:id', () => {
    it('should update cart quantity', async () => {
      const id = new ObjectId();
      const dto = { Quantity: 3 };
      const result = { message: 'Cart updated successfully', Quantity: 3 };
      mockCartService.UpdateCart.mockResolvedValue(result);

      const controller = createController();
      const res = await controller.update({ user: { id: 1 } }, id.toString(), dto as any);

      expect(mockCartService.UpdateCart).toHaveBeenCalledWith(1, id.toString(), dto);
      expect(res).toEqual(result);
    });
  });

  describe('DELETE /shopping-cart/remove/:id', () => {
    it('should remove a cart item', async () => {
      const id = new ObjectId();
      const result = { message: 'Cart deleted successfully' };
      mockCartService.RemoveCart.mockResolvedValue(result);

      const controller = createController();
      const res = await controller.remove({ user: { id: 1 } }, id.toString());

      expect(mockCartService.RemoveCart).toHaveBeenCalledWith(1, id.toString());
      expect(res).toEqual(result);
    });
  });
});
