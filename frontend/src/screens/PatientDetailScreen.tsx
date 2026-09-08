import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export const PatientDetailScreen = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    fetch('/api/patients')
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then((items) => {
        const match = items.find((candidate: any) => candidate.id === id);
        if (!match) {
          setError('Patient not found.');
          setPatient(null);
          return;
        }
        setPatient(match);
      })
      .catch(() => setError('Could not load patient details. Check that the CareNest API is running.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading patient...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!patient) return <p role="alert">Patient not found.</p>;

  return (
    <article>
      <h2>Patient Detail</h2>
      <p><strong>Care plan:</strong> {patient.carePlan}</p>
      <p><strong>Allergies:</strong> {patient.allergies.join(', ')}</p>
      <p><strong>Conditions:</strong> {patient.comorbidities.join(', ')}</p>
      <p><strong>Emergency contact:</strong> {patient.emergencyContacts[0]?.name ?? 'Not provided'}</p>
    </article>
  );
};
