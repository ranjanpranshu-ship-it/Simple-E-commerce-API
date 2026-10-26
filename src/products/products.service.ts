import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductEntity } from './entities/product.entity.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity, 'product')
    private readonly productsRepository: Repository<ProductEntity>,
  ) {}

  async CreateProduct(createProductDto: CreateProductDto) {
    const product = this.productsRepository.create({
      ...createProductDto,
      CreatedAt: new Date(),
    });
    await this.productsRepository.save(product);
    return {
      message: 'Product created successfully',
      id: product.id,
      product: product.Productname,
    };
  }

  async ListAllProducts() {
    const productList = await this.productsRepository.find();
    return productList.map((product) => ({
      id: product.id,
      Productname: product.Productname,
      Productprice: product.Productprice,
      Productdescription: product.Productdescription,
      Productimage: product.Productimage,
      CreatedAt: product.CreatedAt,
    }));
  }

  async ListProductInfo(id: string) {
    const product = await this.productsRepository.findOne({
      where: { id: new ObjectId(id) },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return { product };
  }

  async Update(id: string, updateProductDto: UpdateProductDto) {
    const productId = new ObjectId(id);
    const existing = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.productsRepository.update(productId, {
      ...updateProductDto,
      UpdatedAt: new Date(),
    });
    return { message: 'Product updated successfully' };
  }

  async Delete(id: string) {
    const productId = new ObjectId(id);
    const existing = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.productsRepository.delete(productId);
    return { message: 'Product deleted successfully' };
  }
}
