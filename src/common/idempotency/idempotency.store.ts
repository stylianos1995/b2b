import { Injectable } from '@nestjs/common';

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface StoredResult {
  resourceId: string;
  response: unknown;
  createdAt: number;
}

/**
 * In-memory idempotency store for POST /buyer/orders.
 * Replace with DB or Redis for production (persistent, multi-instance).
 */
@Injectable()
export class IdempotencyStore {
  private readonly cache = new Map<string, StoredResult>();

  get(key: string): { resourceId: string; response: unknown } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return { resourceId: entry.resourceId, response: entry.response };
  }

  set(key: string, resourceId: string, response: unknown): void {
    this.cache.set(key, { resourceId, response, createdAt: Date.now() });
  }
}
