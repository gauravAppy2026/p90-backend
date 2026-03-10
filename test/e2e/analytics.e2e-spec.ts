import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';
import { createProductFixture } from '../helpers/fixtures';

describe('Analytics (e2e)', () => {
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
    for (const key of ['clickevents', 'userprogresses']) {
      if (collections[key]) {
        await collections[key].deleteMany({});
      }
    }
  });

  // ── Dashboard stats ──

  describe('GET /api/admin/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.totalUsers).toBeDefined();
      expect(res.body.data.activeUsers).toBeDefined();
      expect(res.body.data.avgCompletion).toBeDefined();
      expect(res.body.data.productClicks).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/dashboard/stats')
        .expect(401);
    });
  });

  // ── Completion rates ──

  describe('GET /api/admin/analytics/completion', () => {
    it('should return completion rate data', async () => {
      // Start program for the user to generate some progress data
      await request(app.getHttpServer())
        .post('/api/program/progress/start')
        .set('Authorization', `Bearer ${userTokens.accessToken}`);

      const res = await request(app.getHttpServer())
        .get('/api/admin/analytics/completion')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should accept days query parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/analytics/completion?days=7')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ── Dropoff heatmap ──

  describe('GET /api/admin/analytics/dropoff', () => {
    it('should return dropoff heatmap data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/analytics/dropoff')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  // ── Click stats ──

  describe('GET /api/admin/analytics/clicks', () => {
    it('should return click statistics', async () => {
      // Generate some click events by clicking a product
      const productRes = await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'Click Product' }));

      const productId = productRes.body.data._id;

      await request(app.getHttpServer())
        .post(`/api/products/${productId}/click`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`);

      const res = await request(app.getHttpServer())
        .get('/api/admin/analytics/clicks')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should support date range filtering', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/analytics/clicks?startDate=2024-01-01&endDate=2026-12-31')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ── CSV export ──

  describe('GET /api/admin/analytics/export/csv', () => {
    it('should export analytics as CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/analytics/export/csv')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('analytics.csv');
      expect(res.text).toContain('Name');
      expect(res.text).toContain('Email');
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/export/csv')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });
  });
});
