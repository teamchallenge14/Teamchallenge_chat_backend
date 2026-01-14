import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AccountStatus } from '@prisma/client';

describe('Users API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/users', () => {
    const payload = {
      login: 'test_user',
      email: 'test_user@mail.com',
      password: 'Password123!',
    };

    it('should create user and return PublicUserDto', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(payload)
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        login: payload.login,
        email: payload.email,
        createdAt: expect.any(String),
        accountStatus: AccountStatus.ACTIVE,
      });
    });

    it('should return 409 on duplicate user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          login: 'duplicate',
          email: 'duplicate@mail.com',
          password: 'Password123!',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          login: 'duplicate',
          email: 'duplicate@mail.com',
          password: 'Password123!',
        })
        .expect(409);
    });

    it('should return 400 on invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          login: 'bad_user',
          email: 'not-an-email',
          password: '123',
          extraField: 'should fail',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated users list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body).toEqual({
        items: expect.any(Array),
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });

      if (res.body.items.length > 0) {
        expect(res.body.items[0]).toEqual({
          login: expect.anything(),
          email: expect.anything(),
          createdAt: expect.any(String),
        });
      }
    });
  });

  describe('GET /api/v1/users/find-one', () => {
    it('should return full user by email', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/find-one')
        .query({ email: 'test_user@mail.com' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        login: expect.any(String),
        email: expect.any(String),
        accountStatus: expect.any(String),
        createdAt: expect.any(String),

        firstName: expect.anything(),
        lastName: expect.anything(),
        description: expect.anything(),
        avatar: expect.anything(),
        profileTheme: expect.anything(),
        age: expect.anything(),
        gender: expect.anything(),

        interests: expect.any(Array),
      });
    });

    it('should return 400 if no query params provided', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/find-one').expect(400);
    });

    it('should return 404 if user not found', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/find-one')
        .query({ email: 'missing@mail.com' })
        .expect(404);
    });
  });
});
