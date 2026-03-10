import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { getConnection } from './db.helper';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(
  app: INestApplication,
  data: { email: string; name: string; password: string },
): Promise<{ user: any; tokens: AuthTokens }> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send(data)
    .expect(201);

  return {
    user: res.body.data.user,
    tokens: {
      accessToken: res.body.data.accessToken,
      refreshToken: res.body.data.refreshToken,
    },
  };
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ user: any; tokens: AuthTokens }> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);

  return {
    user: res.body.data.user,
    tokens: {
      accessToken: res.body.data.accessToken,
      refreshToken: res.body.data.refreshToken,
    },
  };
}

export async function getAdminTokens(
  app: INestApplication,
): Promise<AuthTokens> {
  // Register an admin user
  const { tokens } = await registerUser(app, {
    email: 'admin@test.com',
    name: 'Test Admin',
    password: 'Admin123!',
  });

  // Manually set admin role via the app's mongoose connection
  const connection = getConnection(app);
  await connection.collection('users').updateOne(
    { email: 'admin@test.com' },
    { $set: { role: 'admin' } },
  );

  // Re-login to get tokens with admin role
  return (await loginUser(app, 'admin@test.com', 'Admin123!')).tokens;
}

export async function getUserTokens(
  app: INestApplication,
  email = 'user@test.com',
): Promise<AuthTokens> {
  const { tokens } = await registerUser(app, {
    email,
    name: 'Test User',
    password: 'User123!',
  });
  return tokens;
}
