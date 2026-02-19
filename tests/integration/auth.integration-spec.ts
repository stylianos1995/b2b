import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

describe('Auth (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => await app.close());

  describe('POST /auth/register', () => {
    it('should register a new user (201)', async () => {
      const email = `test-${Date.now()}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email,
          password: 'SecurePass123!',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(201);
      expect(res.body).toHaveProperty('user_id');
      expect(res.body.email).toBe(email);
    });

    it('should return 400 when payload is invalid', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'bad', password: 'short' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
    });
  });
});
