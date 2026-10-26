import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { CreateShoppingCartDto } from './dto/create-shopping-cart.dto.js';
import { UpdateShoppingCartDto } from './dto/update-shopping-cart.dto.js';
import { ShoppingCart } from './entities/shopping-cart.entity.js';
import { ProductEntity } from '../products/entities/product.entity.js';

@Injectable()
export class ShoppingCartService {
  constructor(
    @InjectRepository(ShoppingCart, 'cart')
    private readonly shoppingCartRepository: Repository<ShoppingCart>,
    @InjectRepository(ProductEntity, 'product')
    private readonly productsRepository: Repository<ProductEntity>,
  ) {}

  async CreateCart(userId: number, createShoppingCartDto: CreateShoppingCartDto) {
    const productId = new ObjectId(createShoppingCartDto.ProductId);
    const product = await this.productsRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const totalPrice = createShoppingCartDto.Quantity * product.Productprice;

    // If the product is already in the user's cart, increase the quantity.
    const existing = await this.shoppingCartRepository.findOneBy({
      userId,
      ProductId: productId,
    });
    if (existing) {
      existing.Quantity += createShoppingCartDto.Quantity;
      existing.TotalPrice = existing.Quantity * existing.EachPrice;
      await this.shoppingCartRepository.save(existing);
      return {
        message: 'Cart updated successfully',
        ...existing,
        totalPrice: existing.TotalPrice,
      };
    }

    const shoppingCart = this.shoppingCartRepository.create({
      userId,
      ProductId: productId,
      ProductName: product.Productname,
      Quantity: createShoppingCartDto.Quantity,
      EachPrice: product.Productprice,
      TotalPrice: totalPrice,
      paymentStatus: 'pending',
      paymentId: '',
    });
    await this.shoppingCartRepository.save(shoppingCart);

    return {
      message: 'Cart created successfully',
      ...shoppingCart,
      totalPrice,
    };
  }

  async FindAllCart(userId: number) {
    const savedShoppingCart = await this.shoppingCartRepository.find({
      where: { userId },
    });
    return {
      message: 'All carts found successfully',
      savedShoppingCart,
    };
  }

  async FindOneCart(userId: number, id: string) {
    const shoppingCart = await this.shoppingCartRepository.findOneBy({
      userId,
      id: new ObjectId(id),
    });
    if (!shoppingCart) {
      throw new NotFoundException('Cart not found');
    }
    return {
      message: 'Cart found successfully',
      shoppingCart,
    };
  }

  async UpdateCart(userId: number, id: string, updateShoppingCartDto: UpdateShoppingCartDto) {
    const cart = await this.shoppingCartRepository.findOneBy({
      userId,
      id: new ObjectId(id),
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.Quantity = updateShoppingCartDto.Quantity;
    cart.TotalPrice = updateShoppingCartDto.Quantity * cart.EachPrice;
    await this.shoppingCartRepository.save(cart);

    return {
      message: 'Cart updated successfully',
      ...cart,
      userId,
    };
  }

  async RemoveCart(userId: number, id: string) {
    const cart = await this.shoppingCartRepository.findOneBy({
      userId,
      id: new ObjectId(id),
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.shoppingCartRepository.delete(cart.id);
    return {
      message: 'Cart deleted successfully',
    };
  }
}
