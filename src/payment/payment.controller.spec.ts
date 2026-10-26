import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentController } from './payment.controller.js';

const mockPaymentService = {
  CreateOrder: vi.fn(),
  verifyPayment: vi.fn(),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    const map: Record<string, string> = {
      API_KEY_ID: 'rzp_test_key',
      API_BASE_URL: 'http://localhost:3004',
    };
    return map[key] ?? '';
  }),
};

function createController() {
  return new PaymentController(mockPaymentService as any, mockConfigService as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaymentController', () => {
  describe('POST /payment/create-order', () => {
    it('should create a Razorpay order', async () => {
      const order = { id: 'order_123', amount: 49900, currency: 'INR' };
      mockPaymentService.CreateOrder.mockResolvedValue(order);

      const controller = createController();
      const result = await controller.createOrder(
        { user: { id: 1 } },
        { cartId: 'cart-abc' }
      );

      expect(mockPaymentService.CreateOrder).toHaveBeenCalledWith(1, 'cart-abc');
      expect(result).toEqual(order);
    });
  });

  describe('POST /payment/verify', () => {
    it('should verify payment', async () => {
      const result = { success: true, razorpay_payment_Id: 'pay_456' };
      mockPaymentService.verifyPayment.mockResolvedValue(result);

      const controller = createController();
      const res = await controller.verify(
        { user: { id: 1 } },
        {
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_456',
          razorpay_signature: 'hmac_hash',
          cartId: 'cart-abc',
        }
      );

      expect(mockPaymentService.verifyPayment).toHaveBeenCalledWith(
        1,
        'order_123',
        'pay_456',
        'hmac_hash',
        'cart-abc'
      );
      expect(res).toEqual(result);
    });
  });
});
