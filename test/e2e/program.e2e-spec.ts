import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';
import { createDayContentFixture } from '../helpers/fixtures';

describe('Program (e2e)', () => {
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
    // Clear program-related collections but preserve users
    const connection = getConnection(app);
    const collections = connection.collections;
    for (const key of ['daycontents', 'userprogresses']) {
      if (collections[key]) {
        await collections[key].deleteMany({});
      }
    }
  });

  // ── Admin: Create day content ──

  describe('POST /api/admin/program/days', () => {
    it('should create day content as admin', async () => {
      const dayData = createDayContentFixture();

      const res = await request(app.getHttpServer())
        .post('/api/admin/program/days')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(dayData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.dayNumber).toBe(1);
      expect(res.body.data.title).toBe(dayData.title);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/program/days')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send(createDayContentFixture())
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/program/days')
        .send(createDayContentFixture())
        .expect(401);
    });
  });

  // ── Admin: Get all days ──

  describe('GET /api/admin/program/days', () => {
    it('should get all day content as admin', async () => {
      // Seed some days
      await request(app.getHttpServer())
        .post('/api/admin/program/days')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createDayContentFixture({ dayNumber: 1 }));

      await request(app.getHttpServer())
        .post('/api/admin/program/days')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createDayContentFixture({ dayNumber: 2, title: 'Day 2' }));

      const res = await request(app.getHttpServer())
        .get('/api/admin/program/days')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ── Admin: Update day content ──

  describe('PUT /api/admin/program/days/:dayNumber', () => {
    it('should update day content as admin', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/program/days')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createDayContentFixture({ dayNumber: 5 }));

      const res = await request(app.getHttpServer())
        .put('/api/admin/program/days/5')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ title: 'Updated Day 5 Title' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Day 5 Title');
    });
  });

  // ── User: Get day content ──

  describe('GET /api/program/days/:dayNumber', () => {
    it('should get specific day content', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/program/days')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createDayContentFixture({ dayNumber: 1 }));

      const res = await request(app.getHttpServer())
        .get('/api/program/days/1')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.dayNumber).toBe(1);
    });

    it('should return 404 for non-existent day', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/program/days/99')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/program/days/1')
        .expect(401);
    });
  });

  // ── User: Progress ──

  describe('POST /api/program/progress/start', () => {
    it('should start the program', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/program/progress/start')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.programStarted).toBe(true);
      expect(res.body.data.currentDay).toBe(1);
    });

    it('should re-start if already started (reset startDate)', async () => {
      await request(app.getHttpServer())
        .post('/api/program/progress/start')
        .set('Authorization', `Bearer ${userTokens.accessToken}`);

      const res = await request(app.getHttpServer())
        .post('/api/program/progress/start')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.programStarted).toBe(true);
    });
  });

  describe('GET /api/program/progress', () => {
    it('should return user progress', async () => {
      await request(app.getHttpServer())
        .post('/api/program/progress/start')
        .set('Authorization', `Bearer ${userTokens.accessToken}`);

      const res = await request(app.getHttpServer())
        .get('/api/program/progress')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.currentDay).toBeDefined();
    });
  });

  describe('PATCH /api/program/progress/complete-day', () => {
    it('should complete the current day and advance', async () => {
      await request(app.getHttpServer())
        .post('/api/program/progress/start')
        .set('Authorization', `Bearer ${userTokens.accessToken}`);

      const res = await request(app.getHttpServer())
        .patch('/api/program/progress/complete-day')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.currentDay).toBe(2);
      expect(res.body.data.completedLessons).toContain(1);
    });

    it('should not advance past day 30', async () => {
      // Set progress to day 30 directly
      await getConnection(app).collection('userprogresses').deleteMany({});
      await request(app.getHttpServer())
        .post('/api/program/progress/start')
        .set('Authorization', `Bearer ${userTokens.accessToken}`);

      // Update directly to day 30
      await getConnection(app).collection('userprogresses').updateOne(
        {},
        { $set: { currentDay: 30 } },
      );

      const res = await request(app.getHttpServer())
        .patch('/api/program/progress/complete-day')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.currentDay).toBe(30); // should not exceed 30
    });
  });

  describe('GET /api/program/progress/summary', () => {
    it('should return progress summary', async () => {
      await request(app.getHttpServer())
        .post('/api/program/progress/start')
        .set('Authorization', `Bearer ${userTokens.accessToken}`);

      const res = await request(app.getHttpServer())
        .get('/api/program/progress/summary')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.currentDay).toBeDefined();
      expect(res.body.data.completedLessons).toBeDefined();
      expect(res.body.data.completionPercentage).toBeDefined();
      expect(res.body.data.programStarted).toBe(true);
    });
  });
});
