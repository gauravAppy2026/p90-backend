import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';
import { createTrackerCategoryFixture } from '../helpers/fixtures';

describe('Tracker (e2e)', () => {
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
    for (const key of ['dailytrackers', 'trackercategories']) {
      if (collections[key]) {
        await collections[key].deleteMany({});
      }
    }
  });

  // ── User: Get today's tracker ──

  describe('GET /api/tracker/today', () => {
    it('should return null when no tracker exists for today', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tracker/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/tracker/today')
        .expect(401);
    });
  });

  // ── User: Update today's tracker ──

  describe('PUT /api/tracker/today', () => {
    it('should create/update tracker entry for today', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/tracker/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ dayNumber: 1, energyLevel: 8, bodyComfort: 7, mindset: 9, penTest: 3 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.energyLevel).toBe(8);
      expect(res.body.data.bodyComfort).toBe(7);
      expect(res.body.data.mindset).toBe(9);
      expect(res.body.data.penTest).toBe(3);
    });

    it('should upsert when called again on the same day', async () => {
      await request(app.getHttpServer())
        .put('/api/tracker/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ dayNumber: 1, energyLevel: 5, bodyComfort: 5, mindset: 5, penTest: 5 });

      const res = await request(app.getHttpServer())
        .put('/api/tracker/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ dayNumber: 1, energyLevel: 9, bodyComfort: 8, mindset: 10, penTest: 1 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.energyLevel).toBe(9);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .put('/api/tracker/today')
        .send({ dayNumber: 1, energyLevel: 5 })
        .expect(401);
    });
  });

  // ── User: Tracker history ──

  describe('GET /api/tracker/history', () => {
    it('should return tracker history', async () => {
      await request(app.getHttpServer())
        .put('/api/tracker/today')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ dayNumber: 1, energyLevel: 7, bodyComfort: 6, mindset: 8, penTest: 4 });

      const res = await request(app.getHttpServer())
        .get('/api/tracker/history')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── User: Active categories ──

  describe('GET /api/tracker/categories', () => {
    it('should return only active categories', async () => {
      // Seed active and inactive categories
      await request(app.getHttpServer())
        .post('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createTrackerCategoryFixture({ name: 'Active Cat', isActive: true }));

      await request(app.getHttpServer())
        .post('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createTrackerCategoryFixture({ name: 'Inactive Cat', isActive: false }));

      const res = await request(app.getHttpServer())
        .get('/api/tracker/categories')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      const names = res.body.data.map((c: any) => c.name);
      expect(names).toContain('Active Cat');
      expect(names).not.toContain('Inactive Cat');
    });
  });

  // ── Admin: All categories ──

  describe('GET /api/admin/tracker-categories', () => {
    it('should return all categories including inactive', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createTrackerCategoryFixture({ name: 'Cat A', isActive: true }));

      await request(app.getHttpServer())
        .post('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createTrackerCategoryFixture({ name: 'Cat B', isActive: false }));

      const res = await request(app.getHttpServer())
        .get('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });

    it('should return 403 for non-admin', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });
  });

  // ── Admin: Create category ──

  describe('POST /api/admin/tracker-categories', () => {
    it('should create a new tracker category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createTrackerCategoryFixture({ name: 'Sleep Quality' }))
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sleep Quality');
    });
  });

  // ── Admin: Update category ──

  describe('PATCH /api/admin/tracker-categories/:id', () => {
    it('should update a tracker category', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createTrackerCategoryFixture({ name: 'Old Name' }));

      const categoryId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/tracker-categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Name');
    });
  });

  // ── Admin: Delete category ──

  describe('DELETE /api/admin/tracker-categories/:id', () => {
    it('should delete a tracker category', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/tracker-categories')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createTrackerCategoryFixture({ name: 'To Delete' }));

      const categoryId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .delete(`/api/admin/tracker-categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
