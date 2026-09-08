import { useEffect, useState } from 'react';

export const VisitCalendarScreen = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/visits')
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then(setVisits)
      .catch(() => setError('Could not load visits. Check that the CareNest API is running.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Visit Calendar</h2>
      {loading && <p>Loading visits...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && visits.length === 0 && <p>No visits scheduled.</p>}
      <ul>
        {visits.map((visit) => (
          <li key={visit.id}>
            {visit.id} — {visit.status} — {new Date(visit.startTime).toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
};
