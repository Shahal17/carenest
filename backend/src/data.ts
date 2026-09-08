import type { AuditLog, Patient, User, Visit } from './types';

export const users: User[] = [
  { id: 'u_admin', role: 'admin', email: 'admin@carenest.test', name: 'Admin', verificationStatus: 'verified' },
  { id: 'u_cg1', role: 'caregiver', email: 'nurse1@carenest.test', name: 'Nurse A', verificationStatus: 'verified' },
  { id: 'u_cg2', role: 'caregiver', email: 'nurse2@carenest.test', name: 'Nurse B', verificationStatus: 'verified' },
  { id: 'p_01', role: 'patient', email: 'patient1@carenest.test', name: 'Mr. Rao', verificationStatus: 'verified' },
  { id: 'p_02', role: 'patient', email: 'patient2@carenest.test', name: 'Mrs. Iyer', verificationStatus: 'verified' },
  { id: 'p_03', role: 'patient', email: 'patient3@carenest.test', name: 'Ms. Devi', verificationStatus: 'pending' }
];

export const patients: Patient[] = [
  {
    id: 'pt_01',
    userId: 'p_01',
    demographics: { dob: '1955-02-20', gender: 'male', address: '12 Green Street' },
    allergies: ['Penicillin'],
    comorbidities: ['Diabetes', 'Hypertension'],
    carePlan: 'Daily glucose check, weekly wound care',
    emergencyContacts: [{ name: 'Anita Rao', phone: '+91-900000001' }],
    consent: { consentId: 'consent_01', timestamp: new Date().toISOString() }
  },
  {
    id: 'pt_02',
    userId: 'p_02',
    demographics: { dob: '1961-04-04', gender: 'female', address: '33 Oak Avenue' },
    allergies: ['None'],
    comorbidities: ['COPD'],
    carePlan: 'SpO2 monitoring twice daily',
    emergencyContacts: [{ name: 'Ravi Iyer', phone: '+91-900000002' }],
    consent: { consentId: 'consent_02', timestamp: new Date().toISOString() }
  },
  {
    id: 'pt_03',
    userId: 'p_03',
    demographics: { dob: '1948-11-17', gender: 'female', address: '9 Lake View' },
    allergies: ['Aspirin'],
    comorbidities: ['Heart disease'],
    carePlan: 'Cardiac monitoring and med adherence',
    emergencyContacts: [{ name: 'Suresh Devi', phone: '+91-900000003' }],
    consent: { consentId: 'consent_03', timestamp: new Date().toISOString() }
  }
];

export const visits: Visit[] = [
  {
    id: 'v_001',
    patientId: 'pt_01',
    caregiverId: 'u_cg1',
    startTime: new Date().toISOString(),
    status: 'scheduled',
    visitType: 'routine',
    rate: 800
  }
];

export const vitals: Array<Record<string, string | number | undefined>> = [];
export const medications: Array<Record<string, unknown>> = [];
export const messages: Array<Record<string, unknown>> = [];
export const invoices: Array<Record<string, unknown>> = [];
export const auditLogs: AuditLog[] = [];

export const logAction = (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
  auditLogs.push({
    id: `audit_${auditLogs.length + 1}`,
    timestamp: new Date().toISOString(),
    ...entry
  });
};
