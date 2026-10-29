import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.MQTT_ENABLED = 'false';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns the success shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 200, message: 'OK', data: { db: 'up', mqtt: 'disabled' } });
  });

  it('unknown route returns the error shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/nope').expect(404);
    expect(res.body).toEqual({ status: 404, error: 'NOT_FOUND', message: 'Cannot GET /api/nope' });
  });

  it('invalid body returns a single validation message', async () => {
    const res = await request(app.getHttpServer()).post('/api/devices').send({ imei: '1', name: 'x' }).expect(400);
    expect(res.body).toEqual({ status: 400, error: 'BAD_REQUEST', message: 'imei must be 15 digits' });
  });
});
