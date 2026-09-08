import { useEffect, useState } from 'react';

export const AdminDashboard = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/visits').then((response) => {
        if (!response.ok) throw new Error('visits');
        return response.json();
      }),
      fetch('/api/audit-logs').then((response) => {
        if (!response.ok) throw new Error('audits');
        return response.json();
      })
    ])
      .then(([visitData, auditData]) => {
        setVisits(visitData);
        setAudits(auditData);
      })
      .catch(() => setError('Could not load dashboard data'));
  }, []);

  const completed = visits.filter((visit) => visit.status === 'completed').length;
  const completionRate = Math.round((completed / Math.max(visits.length, 1)) * 100);

  return (
    <section>
      <h2>Admin Analytics</h2>
      {error && <p role="alert">{error}</p>}
      <p>Total visits: {visits.length}</p>
      <p>Visit completion rate: {completionRate}%</p>
      <p>Audit log entries: {audits.length}</p>
    </section>
  );
};
