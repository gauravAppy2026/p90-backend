import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import mongoose from 'mongoose';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';
import { createProductFixture } from '../helpers/fixtures';

describe('Products (e2e)', () => {
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
    for (const key of ['products', 'clickevents']) {
      if (collections[key]) {
        await collections[key].deleteMany({});
      }
    }
  });

  // ── User: List active products ──

  describe('GET /api/products', () => {
    it('should return only active products', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'Active Product', isActive: true }));

      await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'Inactive Product', isActive: false }));

      const res = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      const names = res.body.data.map((p: any) => p.name);
      expect(names).toContain('Active Product');
      expect(names).not.toContain('Inactive Product');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .expect(401);
    });
  });

  // ── User: Track product click ──

  describe('POST /api/products/:id/click', () => {
    it('should track a product click', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'Clickable Product' }));

      const productId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .post(`/api/products/${productId}/click`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Click tracked');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app.getHttpServer())
        .post(`/api/products/${fakeId}/click`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await request(app.getHttpServer())
        .post(`/api/products/${fakeId}/click`)
        .expect(401);
    });
  });

  // ── Admin: List all products ──

  describe('GET /api/admin/products', () => {
    it('should return all products including inactive', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'Active', isActive: true }));

      await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'Inactive', isActive: false }));

      const res = await request(app.getHttpServer())
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });
  });

  // ── Admin: Create product ──

  describe('POST /api/admin/products', () => {
    it('should create a new product', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'New Product', price: 29.99 }))
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Product');
      expect(res.body.data.price).toBe('29.99');
    });
  });

  // ── Admin: Update product ──

  describe('PATCH /api/admin/products/:id', () => {
    it('should update a product', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'Original Product' }));

      const productId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ name: 'Updated Product', price: 39.99 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Product');
      expect(res.body.data.price).toBe('39.99');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ name: 'Ghost' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ── Admin: Delete product ──

  describe('DELETE /api/admin/products/:id', () => {
    it('should delete a product', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(createProductFixture({ name: 'To Delete' }));

      const productId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .delete(`/api/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify deletion
      const listRes = await request(app.getHttpServer())
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      const ids = listRes.body.data.map((p: any) => p._id);
      expect(ids).not.toContain(productId);
    });
  });
});
