import { Global, Module } from '@nestjs/common';

/**
 * Shared DTOs, filters, decorators, and interfaces.
 * No providers; used across auth and feature modules.
 */
@Global()
@Module({})
export class CommonModule {}
