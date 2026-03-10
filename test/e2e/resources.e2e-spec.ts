import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import mongoose from 'mongoose';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';
import { createResourceFixture } from '../helpers/fixtures';

describe('Resources (e2e)', () => {
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
    if (collections['resources']) {
      await collections['resources'].deleteMany({});
    }
  });

  // ── User: List active resources ──

  describe('GET /api/resources', () => {
    it('should return only active resources', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'Active Resource', isActive: true }));

      await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'Inactive Resource', isActive: false }));

      const res = await request(app.getHttpServer())
        .get('/api/resources')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      const titles = res.body.data.map((r: any) => r.title);
      expect(titles).toContain('Active Resource');
      expect(titles).not.toContain('Inactive Resource');
    });

    it('should filter resources by category', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'Mindfulness Guide', category: 'mindfulness' }));

      await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'Wellness Guide', category: 'wellness' }));

      const res = await request(app.getHttpServer())
        .get('/api/resources?category=mindfulness')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      res.body.data.forEach((r: any) => {
        expect(r.category).toBe('mindfulness');
      });
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/resources')
        .expect(401);
    });
  });

  // ── Admin: List all resources ──

  describe('GET /api/admin/resources', () => {
    it('should return all resources including inactive', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'Active', isActive: true }));

      await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'Inactive', isActive: false }));

      const res = await request(app.getHttpServer())
        .get('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/resources')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });
  });

  // ── Admin: Create resource ──

  describe('POST /api/admin/resources', () => {
    it('should create a new resource', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'New Resource' }))
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Resource');
      expect(res.body.data.isActive).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/resources')
        .send(createResourceFixture())
        .expect(401);
    });
  });

  // ── Admin: Update resource ──

  describe('PATCH /api/admin/resources/:id', () => {
    it('should update a resource', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'Original Title' }));

      const resourceId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/resources/${resourceId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent resource', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/resources/${fakeId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ title: 'Ghost' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ── Admin: Delete resource ──

  describe('DELETE /api/admin/resources/:id', () => {
    it('should delete a resource', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createResourceFixture({ title: 'To Delete' }));

      const resourceId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .delete(`/api/admin/resources/${resourceId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify it is gone
      const listRes = await request(app.getHttpServer())
        .get('/api/admin/resources')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      const ids = listRes.body.data.map((r: any) => r._id);
      expect(ids).not.toContain(resourceId);
    });
  });
});
