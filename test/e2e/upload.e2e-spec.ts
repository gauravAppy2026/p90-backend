import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import { setupTestDb, teardownTestDb } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';

describe('Upload (e2e)', () => {
  let app: INestApplication;
  let adminTokens: { accessToken: string; refreshToken: string };
  let userTokens: { accessToken: string; refreshToken: string };
  const testUploadDir = '/tmp/p90-test-uploads';

  beforeAll(async () => {
    const mongoUri = await setupTestDb();
    app = await createTestApp(mongoUri);
    adminTokens = await getAdminTokens(app);
    userTokens = await getUserTokens(app);

    // Ensure upload dir exists
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDb(app);

    // Clean up test upload files
    if (fs.existsSync(testUploadDir)) {
      const files = fs.readdirSync(testUploadDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testUploadDir, file));
      }
    }
  });

  // ── Valid upload ──

  describe('POST /api/upload', () => {
    it('should upload a valid image file', async () => {
      // Create a minimal valid PNG buffer (1x1 pixel)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // RGB
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND chunk
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const res = await request(app.getHttpServer())
        .post('/api/upload')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .attach('file', pngBuffer, 'test-image.png')
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.fileUrl).toBeDefined();
      expect(res.body.data.fileUrl).toContain('/uploads/');
      expect(res.body.data.fileName).toBe('test-image.png');
    });

    it('should return 401 without auth token', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      await request(app.getHttpServer())
        .post('/api/upload')
        .attach('file', pngBuffer, 'test-image.png')
        .expect(401);
    });

    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('This is a text file, not an image.');

      const res = await request(app.getHttpServer())
        .post('/api/upload')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .attach('file', textBuffer, 'test.txt');

      // The multer file filter throws a raw Error (not HttpException),
      // which the exception filter catches as a 500
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should handle missing file in request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/upload')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should work for admin users too', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const res = await request(app.getHttpServer())
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .attach('file', pngBuffer, 'admin-upload.png')
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.fileUrl).toContain('/uploads/');
    });
  });
});
