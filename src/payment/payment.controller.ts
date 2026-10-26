import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { PaymentService } from './payment.service.js';

@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Create a Razorpay order from a cart item' })
  @ApiBody({ schema: { example: { cartId: '6ad63c5dba5852682d83ddd3' } } })
  @ApiResponse({ status: 200, description: 'Returns the Razorpay order (id, amount, currency)' })
  async createOrder(@Req() req: any, @Body() body: { cartId: string }) {
    return this.paymentService.CreateOrder(req.user.id, body.cartId);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a Razorpay payment signature' })
  @ApiBody({
    schema: {
      example: {
        razorpay_order_id: 'order_ABC123',
        razorpay_payment_id: 'pay_XYZ789',
        razorpay_signature: 'hmac_sha256_hash...',
        cartId: '6ad63c5dba5852682d83ddd3',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Payment verified, cart marked as paid' })
  @ApiResponse({ status: 400, description: 'Invalid payment signature' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async verify(
    @Req() req: any,
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      cartId: string;
    },
  ) {
    return this.paymentService.verifyPayment(
      req.user.id,
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      body.cartId,
    );
  }

  /**
   * Minimal checkout page for local/demo use only.
   * Pass a valid access token and cartId via the query string:
   *   GET /payment/test?token=<jwt>&cartId=<mongo-id>
   */
  @Get('test')
  @ApiOperation({ summary: 'Serve a Razorpay checkout page for local testing' })
  @ApiResponse({ status: 200, description: 'Returns an HTML test page' })
  serveTestPage(
    @Req() req: Request,
    @Res() res: Response,
    @Query('token') token = '',
    @Query('cartId') cartId = '',
  ) {
    const razorpayKey = this.configService.get('API_KEY_ID');
    const baseUrl = this.configService.get('API_BASE_URL') || 'http://localhost:3004';

    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Razorpay Test</title></head>
  <body>
    <h1>Razorpay Checkout (local test)</h1>
    <button onclick="pay()">Pay with Razorpay</button>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      async function pay() {
        const token = ${JSON.stringify(token)};
        const cartId = ${JSON.stringify(cartId)};
        if (!token || !cartId) {
          alert('Provide ?token=<jwt>&cartId=<id> to this page.');
          return;
        }
        const order = await fetch('${baseUrl}/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ cartId }),
        }).then(r => r.json());

        const options = {
          key: ${JSON.stringify(razorpayKey)},
          amount: order.amount,
          currency: order.currency,
          order_id: order.id,
          name: 'Simple E-Commerce',
          handler: async (response) => {
            const result = await fetch('${baseUrl}/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                cartId,
              }),
            }).then(r => r.json());
            alert(result.success ? 'Payment Verified!' : 'Payment Failed');
          },
        };
        new window.Razorpay(options).open();
      }
    </script>
  </body>
</html>`;

    res.type('html').send(html);
  }
}
