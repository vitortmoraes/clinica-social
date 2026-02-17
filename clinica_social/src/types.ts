export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  VOLUNTEER = 'VOLUNTEER'
}

// Keep Enum for backward compat if needed, or remove. Let's add Interface.
export interface SpecialtyItem {
  id: string;
  name: string;
  anamnesis_type?: string;
}

export enum Specialty {
  MEDIC = 'Médico',
  DENTIST = 'Dentista',
  PSYCHOLOGIST = 'Psicólogo'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CONFIRMED = 'confirmed'
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  avatar?: string;
  volunteerId?: string;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  rg?: string;
  birth_date: string;
  whatsapp: string;
  email?: string;
  address: Address;
  personal_income: number;
  family_income: number;
  observations?: string;
  files: { name: string; content: string }[];
  photo?: string;
  payment_table_id: string;

  guardian_name?: string;
  guardian_cpf?: string;
  guardian_phone?: string;

  lgpd_consent?: boolean;
  lgpd_consent_date?: string;
  active?: boolean;
}

export interface Availability {
  day: string;
  start: string;
  end: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for display
  birth_date: string;
  phone: string;
  specialty: string;
  license_number: string;
  availability: Availability[];
  photo?: string;
  files?: { name: string; content: string }[];
  active?: boolean;
  appointment_duration?: number;
  lgpd_consent?: boolean;
  lgpd_consent_date?: string;
}

// Financial
export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE"
}

export enum PaymentMethod {
  CASH = "DINHEIRO",
  PIX = "PIX",
  CARD = "CARTAO",
  OTHER = "OUTRO"
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO
  description: string;
  patient_id?: string;
  appointment_id?: string;
  payment_method: PaymentMethod;
}

export interface DailyStats {
  total_income: number;
  total_expense: number;
  balance: number;
  transaction_count: number;
  by_method: Record<string, number>;
}

export interface Appointment {
  id: string;
  patient_id: string;
  volunteer_id: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  price?: number;
  amount_paid?: number;
  payment_status?: 'PENDING' | 'PARTIAL' | 'PAID';
}



export interface PaymentTable {
  id: string;
  name: string;
  value: number;
}

export interface ClinicSettings {
  id: string;
  clinic_name: string; // Nome Fantasia
  company_name?: string; // Razão Social
  cnpj?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  primary_color: string;
}

export interface MedicalRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  volunteer_id: string;
  chief_complaint: string;
  history: string;
  procedures?: string;
  prescription?: string;
  content?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FormTemplate {
  id: string;
  title: string;
  type: 'static' | 'dynamic';
  schema_config: any; // Using any for schema flexibility
  specialties: string[];
  description?: string;
  active: boolean;
}
