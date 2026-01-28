
import { Specialty, Patient, Volunteer, Appointment, AppointmentStatus, Role, User } from './types';

export const MOCK_USERS: (User & { password: string })[] = [
  { id: 'u1', username: 'admin', email: 'admin@clinica.org', password: 'admin123', name: 'Admin Geral', role: Role.ADMIN },
  { id: 'u2', username: 'recepcao', email: 'recepcao@clinica.org', password: 'recepcao123', name: 'Ana Recepção', role: Role.STAFF },
  { id: 'u3', username: 'luiza', email: 'luiza@clinica.org', password: 'luiza123', name: 'Dra. Luiza Lima', role: Role.VOLUNTEER, volunteerId: 'v2' },
];

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Maria Silva', email: 'maria@email.com', whatsapp: '11999998888', cpf: '123.456.789-00', address: { cep: '01001000', street: 'Praça da Sé', number: '1', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' }, payment_table_id: 't1', birth_date: '1985-05-15', personal_income: 0, family_income: 0, files: [] },
  { id: 'p2', name: 'João Santos', email: 'joao@email.com', whatsapp: '11977776666', cpf: '123.456.789-00', address: { cep: '01001000', street: 'Praça da Sé', number: '1', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' }, payment_table_id: 't2', birth_date: '1990-10-20', personal_income: 0, family_income: 0, files: [] },
  { id: 'p3', name: 'Ana Oliveira', email: 'ana@email.com', whatsapp: '11955554444', cpf: '123.456.789-00', address: { cep: '01001000', street: 'Praça da Sé', number: '1', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' }, payment_table_id: 't3', birth_date: '1978-03-12', personal_income: 0, family_income: 0, files: [] },
];

export const MOCK_VOLUNTEERS: Volunteer[] = [
  { id: 'v1', name: 'Dr. Roberto Costa', specialty: Specialty.MEDIC, license: 'CRM-12345', phone: '11911112222', active: true, availableDays: ['Segunda', 'Quarta'] },
  { id: 'v2', name: 'Dra. Luiza Lima', specialty: Specialty.DENTIST, license: 'CRO-67890', phone: '11933334444', active: true, availableDays: ['Terça', 'Quinta'] },
  { id: 'v3', name: 'Psic. Carlos Souza', specialty: Specialty.PSYCHOLOGIST, license: 'CRP-54321', phone: '11955556666', active: true, availableDays: ['Sexta'] },
  { id: 'v4', name: 'Dr. André Mendes', specialty: Specialty.MEDIC, license: 'CRM-99887', phone: '11922223333', active: true, availableDays: ['Segunda', 'Sexta'] },
  { id: 'v5', name: 'Dra. Sofia Ramos', specialty: Specialty.DENTIST, license: 'CRO-11223', phone: '11944445555', active: true, availableDays: ['Quarta'] },
  { id: 'v6', name: 'Psic. Juliana Paz', specialty: Specialty.PSYCHOLOGIST, license: 'CRP-33445', phone: '11966667777', active: true, availableDays: ['Terça'] },
  { id: 'v7', name: 'Dr. Marcos Valério', specialty: Specialty.MEDIC, license: 'CRM-77665', phone: '11988889999', active: false, availableDays: [] },
];

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', patientId: 'p1', volunteerId: 'v1', date: today, time: '09:00', status: AppointmentStatus.SCHEDULED, specialty: Specialty.MEDIC, price: 30 },
  { id: 'a2', patientId: 'p2', volunteerId: 'v2', date: today, time: '10:30', status: AppointmentStatus.SCHEDULED, specialty: Specialty.DENTIST, price: 80 },
  { id: 'a3', patientId: 'p4', volunteerId: 'v3', date: today, time: '14:00', status: AppointmentStatus.SCHEDULED, specialty: Specialty.PSYCHOLOGIST, price: 25 },
  { id: 'a4', patientId: 'p5', volunteerId: 'v1', date: today, time: '15:30', status: AppointmentStatus.SCHEDULED, specialty: Specialty.MEDIC, price: 30 },
  { id: 'a5', patientId: 'p3', volunteerId: 'v5', date: tomorrow, time: '08:00', status: AppointmentStatus.SCHEDULED, specialty: Specialty.DENTIST, price: 120 },
  { id: 'a6', patientId: 'p6', volunteerId: 'v4', date: tomorrow, time: '11:00', status: AppointmentStatus.SCHEDULED, specialty: Specialty.MEDIC, price: 60 },
  { id: 'a7', patientId: 'p8', volunteerId: 'v6', date: tomorrow, time: '13:00', status: AppointmentStatus.SCHEDULED, specialty: Specialty.PSYCHOLOGIST, price: 25 },
  { id: 'a8', patientId: 'p7', volunteerId: 'v2', date: today, time: '16:45', status: AppointmentStatus.SCHEDULED, specialty: Specialty.DENTIST, price: 120 },
  { id: 'a9', patientId: 'p10', volunteerId: 'v3', date: today, time: '17:30', status: AppointmentStatus.SCHEDULED, specialty: Specialty.PSYCHOLOGIST, price: 25 },
  { id: 'a10', patientId: 'p9', volunteerId: 'v4', date: today, time: '09:45', status: AppointmentStatus.COMPLETED, specialty: Specialty.MEDIC, price: 60 },
];
