import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ProductEntity } from '../products/entities/product.entity.js';

@Injectable()
export class ProductOrmClassService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mongodb',
      host: process.env.MONGODB_HOST,
      port: Number(process.env.MONGODB_PORT),
      database: process.env.MONGODB_PRODUCT,
      entities: [ProductEntity],
      synchronize: process.env.NODE_ENV !== 'production',
    };
  }
}
