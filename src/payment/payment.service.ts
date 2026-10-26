import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import Razorpay from 'razorpay';
import { ShoppingCart } from '../shopping-cart/entities/shopping-cart.entity.js';

@Injectable()
export class PaymentService {
  private readonly razorpay: Razorpay;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ShoppingCart, 'cart')
    private readonly shoppingCartRepository: Repository<ShoppingCart>,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.config.get('API_KEY_ID') as string,
      key_secret: this.config.get('SECRET_KEY') as string,
    });
  }

  async CreateOrder(userId: number, cartId: string) {
    const cart = await this.shoppingCartRepository.findOneBy({
      id: new ObjectId(cartId),
      userId,
    });
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }
    if (cart.paymentStatus === 'paid') {
      throw new BadRequestException('Cart already paid');
    }

    const order = await this.razorpay.orders.create({
      // Razorpay expects the amount in the smallest currency unit (paise).
      amount: Math.round(cart.TotalPrice * 100),
      currency: 'INR',
      receipt: `order_${cartId}`,
      payment_capture: true,
    });
    return order;
  }

  async verifyPayment(
    userId: number,
    razorpay_order_Id: string,
    razorpay_payment_Id: string,
    razorpay_signature: string,
    cartId: string,
  ) {
    const cart = await this.shoppingCartRepository.findOneBy({
      id: new ObjectId(cartId),
      userId,
    });
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }
    if (cart.paymentStatus === 'paid') {
      throw new BadRequestException('Cart already paid');
    }

    const generated = crypto
      .createHmac('sha256', this.config.get('SECRET_KEY') as string)
      .update(`${razorpay_order_Id}|${razorpay_payment_Id}`)
      .digest('hex');

    if (generated !== razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    cart.paymentStatus = 'paid';
    cart.paymentId = razorpay_payment_Id;
    await this.shoppingCartRepository.save(cart);

    return { success: true, razorpay_payment_Id };
  }
}
