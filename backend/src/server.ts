import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import { auditLogs, invoices, logAction, messages, patients, users, visits, vitals } from './data';
import type { Visit } from './types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'password123';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const createVisitSchema = z.object({
  actor: z.string().min(1).optional(),
  patientId: z.string().min(1),
  caregiverId: z.string().min(1),
  startTime: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed']).default('scheduled'),
  visitType: z.string().min(1).default('routine'),
  rate: z.number().nonnegative().optional()
});

const completeVisitSchema = z.object({
  actor: z.string().min(1).optional(),
  notes: z.string().max(5000).optional(),
  durationMins: z.number().int().positive().max(24 * 60).optional()
});

const vitalsSchema = z.object({
  patientId: z.string().min(1),
  recordedBy: z.string().min(1),
  type: z.string().min(1),
  value: z.union([z.string().min(1), z.number()]),
  unit: z.string().optional()
});

const messageSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  body: z.string().trim().min(1).max(2000)
});

const syncVisitSchema = z.object({
  id: z.string().min(1),
  patientId: z.string().min(1),
  caregiverId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed']),
  visitType: z.string().min(1),
  notes: z.string().max(5000).optional(),
  durationMins: z.number().int().positive().optional(),
  rate: z.number().nonnegative().optional()
});

const syncSchema = z.object({
  visits: z.array(syncVisitSchema).max(100)
});

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'CareNest API' }));

app.post('/api/auth/login', (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const user = users.find((candidate) => candidate.email === parsed.data.email);
  if (!user || parsed.data.password !== DEMO_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  logAction({
    actor: user.id,
    action: 'auth.login',
    targetType: 'user',
    targetId: user.id,
    metadata: { method: 'demo-password' }
  });

  return res.json({ token: `demo-token-${user.id}`, user });
});

app.get('/api/patients', (_req, res) => res.json(patients));
app.get('/api/visits', (_req, res) => res.json(visits));

app.post('/api/visits', (req, res) => {
  const parsed = createVisitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { actor, ...input } = parsed.data;
  const visit: Visit = {
    id: `v_${Date.now()}`,
    ...input,
    startTime: input.startTime ?? new Date().toISOString()
  };

  visits.push(visit);
  logAction({
    actor: actor ?? 'system',
    action: 'visit.created',
    targetType: 'visit',
    targetId: visit.id,
    metadata: { patientId: visit.patientId, caregiverId: visit.caregiverId }
  });
  return res.status(201).json(visit);
});

app.post('/api/visits/:id/start', (req, res) => {
  const visit = visits.find((candidate) => candidate.id === req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });
  if (visit.status === 'completed') return res.status(409).json({ error: 'Completed visit cannot be restarted' });
  if (visit.status === 'in_progress') return res.json(visit);

  visit.status = 'in_progress';
  visit.startTime = new Date().toISOString();
  logAction({
    actor: typeof req.body?.actor === 'string' ? req.body.actor : 'caregiver',
    action: 'visit.started',
    targetType: 'visit',
    targetId: visit.id,
    metadata: {}
  });
  return res.json(visit);
});

app.post('/api/visits/:id/complete', (req, res) => {
  const parsed = completeVisitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const visit = visits.find((candidate) => candidate.id === req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });
  if (visit.status === 'completed') return res.json(visit);

  visit.status = 'completed';
  visit.endTime = new Date().toISOString();
  visit.notes = parsed.data.notes;
  visit.durationMins = parsed.data.durationMins ?? 45;
  logAction({
    actor: parsed.data.actor ?? 'caregiver',
    action: 'visit.completed',
    targetType: 'visit',
    targetId: visit.id,
    metadata: { notes: visit.notes ?? '' }
  });
  return res.json(visit);
});

app.post('/api/vitals', (req, res) => {
  const parsed = vitalsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const record = {
    id: `vt_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...parsed.data
  };
  vitals.push(record);
  logAction({
    actor: parsed.data.recordedBy,
    action: 'vitals.logged',
    targetType: 'vitals',
    targetId: record.id,
    metadata: { patientId: parsed.data.patientId, type: parsed.data.type }
  });
  return res.status(201).json(record);
});

app.post('/api/messages', (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const message = {
    id: `msg_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...parsed.data
  };
  messages.push(message);
  io.emit('message:new', message);
  logAction({
    actor: parsed.data.from,
    action: 'message.sent',
    targetType: 'message',
    targetId: message.id,
    metadata: { to: parsed.data.to }
  });
  return res.status(201).json(message);
});

app.post('/api/invoices/generate/:visitId', (req, res) => {
  const visit = visits.find((candidate) => candidate.id === req.params.visitId);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const amount = ((visit.durationMins ?? 60) / 60) * (visit.rate ?? 1000);
  const invoice = { id: `inv_${Date.now()}`, visitId: visit.id, amount, status: 'generated' };
  invoices.push(invoice);
  logAction({
    actor: typeof req.body?.actor === 'string' ? req.body.actor : 'admin',
    action: 'invoice.generated',
    targetType: 'invoice',
    targetId: invoice.id,
    metadata: { amount }
  });
  return res.json(invoice);
});

app.get('/api/invoices/export.csv', (_req, res) => {
  const lines = [
    'id,visitId,amount,status',
    ...invoices.map((invoice) => `${invoice.id},${invoice.visitId},${invoice.amount},${invoice.status}`)
  ];
  res.header('Content-Type', 'text/csv');
  return res.send(lines.join('\n'));
});

app.get('/api/audit-logs', (_req, res) => res.json(auditLogs));

app.post('/api/sync/visits', (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  let synced = 0;
  let skipped = 0;

  for (const queuedVisit of parsed.data.visits) {
    if (visits.some((visit) => visit.id === queuedVisit.id)) {
      skipped += 1;
      continue;
    }

    visits.push(queuedVisit);
    synced += 1;
    logAction({
      actor: queuedVisit.caregiverId,
      action: 'visit.synced',
      targetType: 'visit',
      targetId: queuedVisit.id,
      metadata: { patientId: queuedVisit.patientId }
    });
  }

  return res.json({ synced, skipped });
});

io.on('connection', (socket) => {
  socket.on('telehealth:signal', (payload) => socket.broadcast.emit('telehealth:signal', payload));
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = Number(process.env.PORT ?? 4000);
  httpServer.listen(PORT, () => {
    console.log(`CareNest API listening on http://localhost:${PORT}`);
  });
}

export { app };
