import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestDb, teardownTestDb, clearCollections } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens, registerUser, loginUser } from '../helpers/auth.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mongoUri = await setupTestDb();
    app = await createTestApp(mongoUri);
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDb(app);
  });

  afterEach(async () => {
    await clearCollections(app);
  });

  // ── Registration ──

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com', password: 'Password1!', name: 'New User' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('newuser@test.com');
      expect(res.body.data.user.name).toBe('New User');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 409 when registering with duplicate email', async () => {
      await registerUser(app, { email: 'dup@test.com', name: 'First', password: 'Password1!' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'dup@test.com', password: 'Password1!', name: 'Second' })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ password: 'Password1!', name: 'No Email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'notanemail', password: 'Password1!', name: 'Bad Email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when password is too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'short@test.com', password: '123', name: 'Short Pass' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when name is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'noname@test.com', password: 'Password1!', name: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ── Login ──

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await registerUser(app, { email: 'login@test.com', name: 'Login User', password: 'Password1!' });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'Password1!' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('login@test.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 with wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'WrongPassword1!' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'Password1!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 with invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'bademail', password: 'Password1!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ── Profile ──

  describe('GET /api/auth/me', () => {
    it('should return the authenticated user profile', async () => {
      const tokens = await getUserTokens(app, 'profile@test.com');

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe('profile@test.com');
      expect(res.body.data.name).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/auth/me', () => {
    it('should update profile name', async () => {
      const tokens = await getUserTokens(app, 'update@test.com');

      const res = await request(app.getHttpServer())
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should update profile goals', async () => {
      const tokens = await getUserTokens(app, 'goals@test.com');

      const res = await request(app.getHttpServer())
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ goals: 'Lose weight, Better sleep' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .patch('/api/auth/me')
        .send({ name: 'Hacker' })
        .expect(401);
    });
  });

  // ── Consent ──

  describe('POST /api/auth/consent', () => {
    it('should record user consent', async () => {
      const tokens = await getUserTokens(app, 'consent@test.com');

      const res = await request(app.getHttpServer())
        .post('/api/auth/consent')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.consentStatus).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/consent')
        .expect(401);
    });
  });

  // ── Logout ──

  describe('POST /api/auth/logout', () => {
    it('should logout the authenticated user', async () => {
      const tokens = await getUserTokens(app, 'logout@test.com');

      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  // ── Refresh ──

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const tokens = await getUserTokens(app, 'refresh@test.com');

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${tokens.refreshToken}`)
        .send({ refreshToken: tokens.refreshToken })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
  });
});
