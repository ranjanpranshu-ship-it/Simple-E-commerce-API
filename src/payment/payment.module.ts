import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ShoppingCart } from '../shopping-cart/entities/shopping-cart.entity.js';
import { PaymentService } from './payment.service.js';
import { PaymentController } from './payment.controller.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ShoppingCart], 'cart')],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
