import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract Idempotency-Key header for POST /buyer/orders, /invoices/:id/payments, /admin/payouts.
 * Use with idempotency interceptor/service to deduplicate requests.
 */
export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest() as { headers?: { 'idempotency-key'?: string } };
    return req.headers?.['idempotency-key'];
  },
);
