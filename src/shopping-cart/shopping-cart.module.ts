import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ProductEntity } from '../products/entities/product.entity.js';
import { ShoppingCart } from './entities/shopping-cart.entity.js';
import { ShoppingCartService } from './shopping-cart.service.js';
import { ShoppingCartController } from './shopping-cart.controller.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ShoppingCart], 'cart'),
    TypeOrmModule.forFeature([ProductEntity], 'product'),
  ],
  controllers: [ShoppingCartController],
  providers: [ShoppingCartService],
  exports: [ShoppingCartService],
})
export class ShoppingCartModule {}
