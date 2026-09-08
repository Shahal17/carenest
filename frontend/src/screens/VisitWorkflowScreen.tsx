import { useState } from 'react';

const queueKey = 'carenest-offline-visits';

type QueuedVisit = {
  id: string;
  caregiverId: string;
  patientId: string;
  status: 'in_progress';
  startTime: string;
  visitType: string;
};

const getQueuedVisits = (): QueuedVisit[] => {
  try {
    return JSON.parse(localStorage.getItem(queueKey) ?? '[]') as QueuedVisit[];
  } catch {
    localStorage.removeItem(queueKey);
    return [];
  }
};

const queueVisit = () => {
  const queued = getQueuedVisits();
  queued.push({
    id: `offline_${Date.now()}`,
    caregiverId: 'u_cg1',
    patientId: 'pt_01',
    status: 'in_progress',
    startTime: new Date().toISOString(),
    visitType: 'routine'
  });
  localStorage.setItem(queueKey, JSON.stringify(queued));
  return queued.length;
};

export const VisitWorkflowScreen = () => {
  const [visitId, setVisitId] = useState('v_001');
  const [status, setStatus] = useState('');

  const startVisit = async () => {
    if (!navigator.onLine) {
      const count = queueVisit();
      setStatus(`Stored offline — ${count} visit${count === 1 ? '' : 's'} waiting to sync`);
      return;
    }

    try {
      const response = await fetch(`/api/visits/${encodeURIComponent(visitId)}/start`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actor: 'u_cg1' })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setStatus(payload.error ?? `Could not start visit (${response.status})`);
        return;
      }

      setStatus('Visit started');
    } catch {
      const count = queueVisit();
      setStatus(`Network unavailable — stored offline (${count} waiting)`);
    }
  };

  const sync = async () => {
    const visits = getQueuedVisits();
    if (visits.length === 0) {
      setStatus('Nothing to sync');
      return;
    }

    if (!navigator.onLine) {
      setStatus(`Still offline — ${visits.length} visit${visits.length === 1 ? '' : 's'} waiting`);
      return;
    }

    try {
      const response = await fetch('/api/sync/visits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visits })
      });

      if (!response.ok) {
        setStatus(`Sync failed (${response.status}) — queue kept safely`);
        return;
      }

      const result = await response.json();
      localStorage.removeItem(queueKey);
      setStatus(`Sync complete — ${result.synced} synced, ${result.skipped} already present`);
    } catch {
      setStatus('Sync failed — queue kept safely for retry');
    }
  };

  return (
    <section>
      <h2>Visit Workflow</h2>
      <label>
        Visit ID
        <input value={visitId} onChange={(event) => setVisitId(event.target.value)} />
      </label>
      <button onClick={startVisit} disabled={!visitId.trim()}>Start Visit</button>
      <button onClick={sync}>Sync Offline Queue</button>
      <p aria-live="polite">{status}</p>
    </section>
  );
};
