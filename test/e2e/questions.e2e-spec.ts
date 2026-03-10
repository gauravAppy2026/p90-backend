import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import mongoose from 'mongoose';
import { setupTestDb, teardownTestDb, getConnection } from '../helpers/db.helper';
import { createTestApp } from '../helpers/test-app.helper';
import { getAdminTokens, getUserTokens } from '../helpers/auth.helper';

describe('Questions (e2e)', () => {
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
    if (collections['questions']) {
      await collections['questions'].deleteMany({});
    }
  });

  // ── User: Create question ──

  describe('POST /api/questions', () => {
    it('should create a new question', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ question: 'How does the program work?' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.question).toBe('How does the program work?');
      expect(res.body.data.status).toBe('pending');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/questions')
        .send({ question: 'Unauthorized question?' })
        .expect(401);
    });
  });

  // ── User: Get FAQs ──

  describe('GET /api/questions/faq', () => {
    it('should return only public answered questions', async () => {
      // Create and answer a question, mark as public
      const createRes = await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ question: 'Public FAQ question?' });

      const questionId = createRes.body.data._id;

      // Admin answers and sets isPublic
      await request(app.getHttpServer())
        .patch(`/api/admin/questions/${questionId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ answer: 'This is a public answer', isPublic: true });

      const res = await request(app.getHttpServer())
        .get('/api/questions/faq')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].isPublic).toBe(true);
      expect(res.body.data[0].status).toBe('answered');
    });

    it('should not return pending or non-public questions', async () => {
      // Create a pending question (not answered)
      await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ question: 'This should not appear in FAQ' });

      const res = await request(app.getHttpServer())
        .get('/api/questions/faq')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const pendingQuestions = res.body.data.filter(
        (q: any) => q.question === 'This should not appear in FAQ',
      );
      expect(pendingQuestions.length).toBe(0);
    });
  });

  // ── Admin: List all questions ──

  describe('GET /api/admin/questions', () => {
    it('should list all questions for admin', async () => {
      await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ question: 'Question 1' });

      await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ question: 'Question 2' });

      const res = await request(app.getHttpServer())
        .get('/api/admin/questions')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.questions).toBeInstanceOf(Array);
      expect(res.body.data.questions.length).toBe(2);
      expect(res.body.data.total).toBe(2);
    });

    it('should filter questions by status', async () => {
      await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ question: 'Pending question' });

      const res = await request(app.getHttpServer())
        .get('/api/admin/questions?status=pending')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.questions.forEach((q: any) => {
        expect(q.status).toBe('pending');
      });
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(403);
    });
  });

  // ── Admin: Answer question ──

  describe('PATCH /api/admin/questions/:id (answer)', () => {
    it('should answer a question', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ question: 'What is meditation?' });

      const questionId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/questions/${questionId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ answer: 'Meditation is a practice of mindfulness.', isPublic: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBe('Meditation is a practice of mindfulness.');
      expect(res.body.data.status).toBe('answered');
      expect(res.body.data.isPublic).toBe(true);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/questions/${fakeId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ answer: 'Answer to nothing' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ── Admin: Update question status ──

  describe('PATCH /api/admin/questions/:id (status)', () => {
    it('should update question status to archived', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .send({ question: 'Archive me?' });

      const questionId = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/questions/${questionId}`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ status: 'archived' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('archived');
    });
  });
});
