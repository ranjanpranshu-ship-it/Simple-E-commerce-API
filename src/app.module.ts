import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './users/user.module.js';
import { ProductsModule } from './products/products.module.js';
import { ShoppingCartModule } from './shopping-cart/shopping-cart.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { PostOrmClassService } from './DB/postgres.js';
import { ProductOrmClassService } from './DB/product-orm.factory.js';
import { CartOrmClassService } from './DB/cart-orm.factory.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Global rate limiting; individual routes can override with @Throttle().
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TypeOrmModule.forRootAsync({ useClass: PostOrmClassService }),
    TypeOrmModule.forRootAsync({ name: 'product', useClass: ProductOrmClassService }),
    TypeOrmModule.forRootAsync({ name: 'cart', useClass: CartOrmClassService }),
    AuthModule,
    UserModule,
    ProductsModule,
    ShoppingCartModule,
    PaymentModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
