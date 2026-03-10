import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestDb, teardownTestDb, clearCollections } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens, registerUser } from '../helpers/auth.helper';

describe('Users Admin (e2e)', () => {
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

  // ── List users ──

  describe('GET /api/admin/users', () => {
    it('should list all users for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2); // admin + user at minimum
    });

    it('should support pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeLessThanOrEqual(1);
    });

    it('should support search by name or email', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users?search=admin')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .expect(401);
    });
  });

  // ── CSV export ──

  describe('GET /api/admin/users/export/csv', () => {
    it('should export users as CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users/export/csv')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('users.csv');
      expect(res.text).toContain('Name');
      expect(res.text).toContain('Email');
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users/export/csv')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });
  });

  // ── Get single user ──

  describe('GET /api/admin/users/:id', () => {
    it('should get a user by ID', async () => {
      // First get user list to obtain an ID
      const listRes = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      const userId = listRes.body.data.users[0]._id;

      const res = await request(app.getHttpServer())
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBe(userId);
    });
  });

  // ── Update user ──

  describe('PATCH /api/admin/users/:id', () => {
    it('should update a user by ID', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      const userId = listRes.body.data.users.find(
        (u: any) => u.email === 'user@test.com',
      )?._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ name: 'Admin Updated Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Admin Updated Name');
    });
  });

  // ── Delete (soft) user ──

  describe('DELETE /api/admin/users/:id', () => {
    it('should soft-delete a user by ID', async () => {
      // Create a user to delete
      const { user } = await registerUser(app, {
        email: 'todelete@test.com',
        name: 'Delete Me',
        password: 'Password1!',
      });

      // Get user list and find the new user's ID
      const listRes = await request(app.getHttpServer())
        .get('/api/admin/users?search=todelete')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      const userId = listRes.body.data.users[0]._id;

      const res = await request(app.getHttpServer())
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deactivated');
    });
  });
});
