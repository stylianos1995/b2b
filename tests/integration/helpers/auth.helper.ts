import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ access_token: string }> {
  const res = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email, password })
    .expect(200);
  return res.body;
}

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
