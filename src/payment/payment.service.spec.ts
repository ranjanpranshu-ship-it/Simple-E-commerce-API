import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentService } from './payment.service.js';
import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

const SECRET_KEY = 'rzp_test_secret';

// vi.hoisted() makes this available to the hoisted vi.mock
const { MockRazorpay } = vi.hoisted(() => {
  class MockRazorpay {
    orders = {
      create: vi.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 49900,
        currency: 'INR',
      }),
    };
  }
  return { MockRazorpay };
});

vi.mock('razorpay', () => ({
  default: MockRazorpay,
}));

const mockCartRepo = {
  findOneBy: vi.fn(),
  save: vi.fn(),
};

const mockConfig = {
  get: vi.fn((key: string) => {
    const map: Record<string, string> = {
      API_KEY_ID: 'rzp_test_key',
      SECRET_KEY,
    };
    return map[key] ?? '';
  }),
};

function createService() {
  return new PaymentService(mockConfig as any, mockCartRepo as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaymentService', () => {
  describe('CreateOrder', () => {
    it('should create a Razorpay order from the user cart', async () => {
      const cartId = new ObjectId();
      const cart = { id: cartId, userId: 1, TotalPrice: 499, paymentStatus: 'pending' };
      mockCartRepo.findOneBy.mockResolvedValue(cart);

      const service = createService();
      const result = await service.CreateOrder(1, cartId.toString());

      expect(mockCartRepo.findOneBy).toHaveBeenCalledWith({
        id: cartId,
        userId: 1,
      });
      expect(result).toEqual({ id: 'order_test123', amount: 49900, currency: 'INR' });
    });

    it('should throw if cart not found', async () => {
      mockCartRepo.findOneBy.mockResolvedValue(null);

      const service = createService();
      await expect(service.CreateOrder(1, new ObjectId().toString())).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment', () => {
    it('should verify valid payment and mark cart as paid', async () => {
      const cartId = new ObjectId();
      const cart = { id: cartId, userId: 1, paymentStatus: 'pending' };
      mockCartRepo.findOneBy.mockResolvedValue(cart);
      mockCartRepo.save.mockResolvedValue(cart);

      const orderId = 'order_123';
      const paymentId = 'pay_456';
      const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const service = createService();
      const result = await service.verifyPayment(1, orderId, paymentId, signature, cartId.toString());

      expect(result).toEqual({ success: true, razorpay_payment_Id: paymentId });
      expect(cart.paymentStatus).toBe('paid');
    });

    it('should throw if cart not found', async () => {
      mockCartRepo.findOneBy.mockResolvedValue(null);

      const service = createService();
      await expect(
        service.verifyPayment(1, 'order_1', 'pay_1', 'sig', new ObjectId().toString())
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if cart already paid', async () => {
      const cart = { id: new ObjectId(), userId: 1, paymentStatus: 'paid' };
      mockCartRepo.findOneBy.mockResolvedValue(cart);

      const service = createService();
      await expect(
        service.verifyPayment(1, 'order_1', 'pay_1', 'sig', cart.id.toString())
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for invalid signature', async () => {
      const cartId = new ObjectId();
      const cart = { id: cartId, userId: 1, paymentStatus: 'pending' };
      mockCartRepo.findOneBy.mockResolvedValue(cart);

      const service = createService();
      await expect(
        service.verifyPayment(1, 'order_1', 'pay_1', 'wrong-signature', cartId.toString())
      ).rejects.toThrow(BadRequestException);
    });
  });
});
