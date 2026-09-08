import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../backend/src/server';

describe('CareNest API', () => {
  it('reports API health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('logs in a seeded admin with the demo password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@carenest.test', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('admin');
  });

  it('rejects an incorrect password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@carenest.test', password: 'wrong-password' });

    expect(response.status).toBe(401);
  });

  it('creates a visit and writes an audit log', async () => {
    const create = await request(app).post('/api/visits').send({
      actor: 'u_admin',
      patientId: 'pt_01',
      caregiverId: 'u_cg1',
      startTime: new Date().toISOString(),
      status: 'scheduled',
      visitType: 'followup'
    });

    expect(create.status).toBe(201);
    const logs = await request(app).get('/api/audit-logs');
    expect(logs.body.some((log: { targetId: string }) => log.targetId === create.body.id)).toBe(true);
  });

  it('validates messages before storing them', async () => {
    const response = await request(app).post('/api/messages').send({
      from: 'u_cg1',
      to: 'p_01',
      body: '   '
    });

    expect(response.status).toBe(400);
  });

  it('syncs offline visits idempotently', async () => {
    const offlineVisit = {
      id: 'offline_test_visit',
      patientId: 'pt_01',
      caregiverId: 'u_cg1',
      startTime: new Date().toISOString(),
      status: 'in_progress',
      visitType: 'routine'
    };

    const first = await request(app).post('/api/sync/visits').send({ visits: [offlineVisit] });
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ synced: 1, skipped: 0 });

    const second = await request(app).post('/api/sync/visits').send({ visits: [offlineVisit] });
    expect(second.status).toBe(200);
    expect(second.body).toEqual({ synced: 0, skipped: 1 });
  });
});
