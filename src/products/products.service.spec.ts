import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductsService } from './products.service.js';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

const mockProductRepo = {
  create: vi.fn((data) => data),
  save: vi.fn((data) => Promise.resolve(data)),
  find: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

function createService() {
  return new ProductsService(mockProductRepo as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProductsService', () => {
  describe('CreateProduct', () => {
    it('should create and save a product', async () => {
      const dto = { Productname: 'Laptop', Productprice: 50000, Productdescription: 'Good' };
      mockProductRepo.save.mockResolvedValue({ ...dto, CreatedAt: new Date() });

      const service = createService();
      const result = await service.CreateProduct(dto as any);

      expect(result.product).toBe('Laptop');
      expect(mockProductRepo.save).toHaveBeenCalled();
    });
  });

  describe('ListAllProducts', () => {
    it('should return all products', async () => {
      const products = [
        { id: new ObjectId(), Productname: 'Laptop', Productprice: 50000, Productdescription: 'x', CreatedAt: new Date() },
      ];
      mockProductRepo.find.mockResolvedValue(products);

      const service = createService();
      const result = await service.ListAllProducts();

      expect(result).toHaveLength(1);
      expect(result[0].Productname).toBe('Laptop');
    });
  });

  describe('ListProductInfo', () => {
    it('should return product by id', async () => {
      const id = new ObjectId();
      const product = { id, Productname: 'Laptop' };
      mockProductRepo.findOne.mockResolvedValue(product);

      const service = createService();
      const result = await service.ListProductInfo(id.toString());

      expect(result.product).toEqual(product);
    });

    it('should throw if not found', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      const service = createService();
      await expect(service.ListProductInfo(new ObjectId().toString())).rejects.toThrow(NotFoundException);
    });
  });

  describe('Update', () => {
    it('should update a product', async () => {
      const id = new ObjectId();
      mockProductRepo.findOne.mockResolvedValue({ id, Productname: 'Laptop' });
      mockProductRepo.update.mockResolvedValue({});

      const service = createService();
      const result = await service.Update(id.toString(), { Productname: 'New Name' } as any);

      expect(mockProductRepo.update).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Product updated successfully' });
    });

    it('should throw if product does not exist', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      const service = createService();
      await expect(service.Update(new ObjectId().toString(), {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Delete', () => {
    it('should delete a product', async () => {
      const id = new ObjectId();
      mockProductRepo.findOne.mockResolvedValue({ id });
      mockProductRepo.delete.mockResolvedValue(undefined);

      const service = createService();
      const result = await service.Delete(id.toString());

      expect(mockProductRepo.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });

    it('should throw if product does not exist', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      const service = createService();
      await expect(service.Delete(new ObjectId().toString())).rejects.toThrow(NotFoundException);
    });
  });
});
