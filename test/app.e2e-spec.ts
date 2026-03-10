import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from './helpers/db.helper';
import { createTestApp } from './helpers/test-app.helper';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mongoUri = await setupTestDb();
    app = await createTestApp(mongoUri);
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDb(app);
  });

  it('should return 404 on / (no root route)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(404);
  });
});
