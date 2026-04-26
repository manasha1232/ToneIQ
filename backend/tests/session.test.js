'use strict';
const request = require('supertest');
const db      = require('../src/db');
const express = require('express');
require('express-async-errors');

let app;
beforeAll(async () => {
  await db.ensureDb();
  app = express();
  app.use(express.json());
  app.use(require('cors')());
  app.use('/api/session', require('../src/routes/session'));
  app.use('/api/user',    require('../src/routes/user'));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
});

describe('Session API', () => {
  let sessionId;

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/session/start creates session', async () => {
    const res = await request(app)
      .post('/api/session/start')
      .send({ scenarioId: 'missed-deadline', scenarioText: 'You missed a deadline.' });
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeTruthy();
    sessionId = res.body.sessionId;
  });

  test('GET /api/session/:id/report returns report', async () => {
    const res = await request(app).get(`/api/session/${sessionId}/report`);
    expect(res.status).toBe(200);
    expect(res.body.session).toBeTruthy();
  });

  test('DELETE /api/user/:id/data succeeds', async () => {
    const res = await request(app).delete('/api/user/anonymous/data');
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });
});
