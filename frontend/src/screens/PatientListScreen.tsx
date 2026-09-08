import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const PatientListScreen = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/patients')
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then(setPatients)
      .catch(() => setError('Could not load patients. Check that the CareNest API is running.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Patient List</h2>
      {loading && <p>Loading patients...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && patients.length === 0 && <p>No patients found.</p>}
      <ul>
        {patients.map((patient) => (
          <li key={patient.id}>
            <Link to={`/patients/${patient.id}`}>{patient.userId} — {patient.carePlan}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
