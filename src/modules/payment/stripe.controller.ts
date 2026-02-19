import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { BusinessScopeGuard } from '../../auth/guards/business-scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { RequestContext } from '../../common/interfaces/request-context.interface';

/**
 * Stripe Checkout and webhook endpoints.
 * - POST /payments/checkout-session: create session (buyer only); returns { url } for redirect.
 * - POST /payments/webhook: Stripe webhook (no auth); receives raw body via express.raw() in main.ts.
 */
@Controller('payments')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard, RolesGuard, BusinessScopeGuard)
  @Roles('business_owner', 'business_manager', 'business_staff')
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @CurrentUser() user: RequestContext,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.stripeService.createCheckoutSession(user, dto.invoiceId);
  }

  /**
   * Webhook endpoint for Stripe. Raw body is provided by express.raw() for this path in main.ts.
   */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: Request, @Res() res: Response): Promise<void> {
    const rawBody = req.body as Buffer | undefined;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Raw body required for webhook signature verification',
      });
      return;
    }
    const signature = req.headers['stripe-signature'] as string | undefined;
    try {
      await this.stripeService.handleWebhook(rawBody, signature);
      res.status(HttpStatus.OK).json({ received: true });
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode ?? HttpStatus.BAD_REQUEST;
      res.status(status).json({
        message: e instanceof Error ? e.message : 'Webhook handling failed',
      });
    }
  }
}
