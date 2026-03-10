import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';

describe('Retreat (e2e)', () => {
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
    if (collections['retreatsettings']) {
      await collections['retreatsettings'].deleteMany({});
    }
  });

  // ── User: Get retreat settings ──

  describe('GET /api/retreat', () => {
    it('should return retreat settings (creates default if none exist)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/retreat')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/retreat')
        .expect(401);
    });
  });

  // ── Admin: Get retreat settings ──

  describe('GET /api/admin/retreat', () => {
    it('should return retreat settings for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/retreat')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/retreat')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });
  });

  // ── Admin: Update retreat settings ──

  describe('PUT /api/admin/retreat', () => {
    it('should update retreat settings', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/admin/retreat')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({
          title: 'Updated Retreat Title',
          description: 'A transformative retreat experience',
          isActive: true,
          bookingUrl: 'https://example.com/book',
          discountCode: 'P90VIP',
          discountPercentage: 15,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Retreat Title');
      expect(res.body.data.discountCode).toBe('P90VIP');
      expect(res.body.data.isActive).toBe(true);
    });

    it('should create settings if none exist and then update', async () => {
      // Clear to ensure no settings exist
      const collections = getConnection(app).collections;
      if (collections['retreatsettings']) {
        await collections['retreatsettings'].deleteMany({});
      }

      const res = await request(app.getHttpServer())
        .put('/api/admin/retreat')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({
          title: 'Brand New Retreat',
          isActive: false,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Brand New Retreat');
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .put('/api/admin/retreat')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ title: 'Hacker Retreat' })
        .expect(403);
    });
  });
});
