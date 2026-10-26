import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductsController } from './products.controller.js';
import { ObjectId } from 'mongodb';

const mockProductsService = {
  CreateProduct: vi.fn(),
  ListAllProducts: vi.fn(),
  ListProductInfo: vi.fn(),
  Update: vi.fn(),
  Delete: vi.fn(),
};

function createController() {
  return new ProductsController(mockProductsService as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProductsController', () => {
  describe('POST /products/create', () => {
    it('should create a product', async () => {
      const dto = { Productname: 'Laptop', Productprice: 50000, Productdescription: 'Good' };
      const created = { message: 'Product created successfully', id: new ObjectId(), product: 'Laptop' };
      mockProductsService.CreateProduct.mockResolvedValue(created);

      const controller = createController();
      const result = await controller.createProduct(dto);

      expect(mockProductsService.CreateProduct).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('GET /products/listAll', () => {
    it('should return all products', async () => {
      const products = [
        { id: new ObjectId(), Productname: 'Laptop', Productprice: 50000 },
        { id: new ObjectId(), Productname: 'Phone', Productprice: 30000 },
      ];
      mockProductsService.ListAllProducts.mockResolvedValue(products);

      const controller = createController();
      const result = await controller.findAllProducts();

      expect(result).toEqual(products);
    });
  });

  describe('GET /products/findone/:id', () => {
    it('should return a single product', async () => {
      const id = new ObjectId();
      const product = { product: { id, Productname: 'Laptop' } };
      mockProductsService.ListProductInfo.mockResolvedValue(product);

      const controller = createController();
      const result = await controller.findOneProduct(id.toString());

      expect(mockProductsService.ListProductInfo).toHaveBeenCalledWith(id.toString());
      expect(result).toEqual(product);
    });
  });

  describe('PATCH /products/update/:id', () => {
    it('should update a product', async () => {
      const id = new ObjectId();
      const dto = { Productname: 'New Laptop' };
      mockProductsService.Update.mockResolvedValue({ message: 'Product updated successfully' });

      const controller = createController();
      const result = await controller.updateProduct(id.toString(), dto);

      expect(mockProductsService.Update).toHaveBeenCalledWith(id.toString(), dto);
      expect(result).toEqual({ message: 'Product updated successfully' });
    });
  });

  describe('DELETE /products/remove/:id', () => {
    it('should delete a product', async () => {
      const id = new ObjectId();
      mockProductsService.Delete.mockResolvedValue({ message: 'Product deleted successfully' });

      const controller = createController();
      const result = await controller.removeProduct(id.toString());

      expect(mockProductsService.Delete).toHaveBeenCalledWith(id.toString());
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });
  });
});
