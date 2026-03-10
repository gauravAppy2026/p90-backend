import { MongoMemoryServer } from 'mongodb-memory-server';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

export async function setupTestDb(): Promise<string> {
  mongod = await MongoMemoryServer.create();
  return mongod.getUri();
}

export function getConnection(app: INestApplication): mongoose.Connection {
  return app.get<mongoose.Connection>(getConnectionToken());
}

export async function teardownTestDb(app?: INestApplication): Promise<void> {
  if (app) {
    const connection = getConnection(app);
    if (connection.readyState !== 0) {
      await connection.dropDatabase();
      await connection.close();
    }
  } else if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
}

export async function clearCollections(app: INestApplication): Promise<void> {
  const connection = getConnection(app);
  const collections = connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
