import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';

describe('Checklist (e2e)', () => {
  let app: INestApplication;
  let adminTokens: { accessToken: string; refreshToken: string };
  let userTokens: { accessToken: string; refreshToken: string };

  beforeAll(async () => {
    const mongoUri = await setupTestDb();
    app = await createTestApp(mongoUri);
    adminTokens = await getAdminTokens(app);
    userTokens = await getUserTokens(app);
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDb(app);
  });

  afterEach(async () => {
    const collections = getConnection(app).collections;
    if (collections['dailychecklists']) {
      await collections['dailychecklists'].deleteMany({});
    }
  });

  // ── Get today's checklist ──

  describe('GET /api/checklist/today', () => {
    it('should return null/empty when no checklist exists for today', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/checklist/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      // data may be null when no checklist exists yet
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/checklist/today')
        .expect(401);
    });
  });

  // ── Update today's checklist (upsert) ──

  describe('PUT /api/checklist/today', () => {
    it('should create a checklist for today (upsert)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/checklist/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({
          items: { p90Session: true, morningSmoothie: false, waterIntake: true },
          dayNumber: 1,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.p90Session).toBe(true);
      expect(res.body.data.items.morningSmoothie).toBe(false);
      expect(res.body.data.completionCount).toBe(2);
    });

    it('should update an existing checklist for today', async () => {
      // First create
      await request(app.getHttpServer())
        .put('/api/checklist/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ items: { p90Session: false }, dayNumber: 1 });

      // Then update
      const res = await request(app.getHttpServer())
        .put('/api/checklist/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({
          items: { p90Session: true, morningSmoothie: true, waterIntake: true },
          dayNumber: 1,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items.p90Session).toBe(true);
      expect(res.body.data.completionCount).toBe(3);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .put('/api/checklist/today')
        .send({ items: { p90Session: true }, dayNumber: 1 })
        .expect(401);
    });
  });

  // ── Checklist history ──

  describe('GET /api/checklist/history', () => {
    it('should return checklist history', async () => {
      // First create a checklist entry
      await request(app.getHttpServer())
        .put('/api/checklist/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ items: { p90Session: true }, dayNumber: 1 });

      const res = await request(app.getHttpServer())
        .get('/api/checklist/history')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/checklist/history')
        .expect(401);
    });
  });
});
