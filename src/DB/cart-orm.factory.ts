import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ShoppingCart } from '../shopping-cart/entities/shopping-cart.entity.js';

@Injectable()
export class CartOrmClassService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mongodb',
      host: process.env.MONGODB_HOST,
      port: Number(process.env.MONGODB_PORT),
      database: process.env.MONGODB_CART,
      entities: [ShoppingCart],
      synchronize: process.env.NODE_ENV !== 'production',
    };
  }
}
