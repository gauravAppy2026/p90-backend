import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import mongoose from 'mongoose';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';

describe('Testimonials (e2e)', () => {
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
    if (collections['testimonials']) {
      await collections['testimonials'].deleteMany({});
    }
  });

  // ── User: Create testimonial ──

  describe('POST /api/testimonials', () => {
    it('should create a new testimonial', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'This program changed my life!' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('This program changed my life!');
      expect(res.body.data.status).toBe('pending');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/testimonials')
        .send({ text: 'Unauthorized' })
        .expect(401);
    });
  });

  // ── User: Get approved testimonials ──

  describe('GET /api/testimonials/approved', () => {
    it('should return only approved testimonials', async () => {
      // Create a testimonial
      const createRes = await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'Approved testimonial' });

      const testimonialId = createRes.body.data._id;

      // Admin approves it
      await request(app.getHttpServer())
        .patch(`/api/admin/testimonials/${testimonialId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ status: 'approved' });

      // Create a pending testimonial (should not appear)
      await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'Pending testimonial' });

      const res = await request(app.getHttpServer())
        .get('/api/testimonials/approved')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].text).toBe('Approved testimonial');
      expect(res.body.data[0].status).toBe('approved');
    });

    it('should return empty array when no approved testimonials', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/testimonials/approved')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ── Admin: List all testimonials ──

  describe('GET /api/admin/testimonials', () => {
    it('should list all testimonials for admin', async () => {
      await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'Testimonial 1' });

      await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'Testimonial 2' });

      const res = await request(app.getHttpServer())
        .get('/api/admin/testimonials')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.testimonials).toBeInstanceOf(Array);
      expect(res.body.data.testimonials.length).toBe(2);
      expect(res.body.data.total).toBe(2);
    });

    it('should filter by status', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'To approve' });

      const testimonialId = createRes.body.data._id;

      await request(app.getHttpServer())
        .patch(`/api/admin/testimonials/${testimonialId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ status: 'approved' });

      // Create another pending one
      await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'Still pending' });

      const res = await request(app.getHttpServer())
        .get('/api/admin/testimonials?status=pending')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.testimonials.forEach((t: any) => {
        expect(t.status).toBe('pending');
      });
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });
  });

  // ── Admin: Review testimonial ──

  describe('PATCH /api/admin/testimonials/:id', () => {
    it('should approve a testimonial', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'Approve me!' });

      const testimonialId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/testimonials/${testimonialId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
    });

    it('should reject a testimonial', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ text: 'Reject me!' });

      const testimonialId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/testimonials/${testimonialId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ status: 'rejected' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('rejected');
    });

    it('should return 404 for non-existent testimonial', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/testimonials/${fakeId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ status: 'approved' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
