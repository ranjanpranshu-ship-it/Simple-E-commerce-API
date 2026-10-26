import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { ProductEntity } from './entities/product.entity.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ProductEntity], 'product')],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
