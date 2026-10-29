/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'physio' | 'receptionist';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string; // Nome sem prefixo (ex: "Marcelo Carvalho")
  gender?: 'M' | 'F'; // 'M' para Dr., 'F' para Dra.
  phone: string;
  role: UserRole;
  isAdmin?: boolean; // Permite que um fisioterapeuta também exerça função de administrador
  password?: string; // Senha para autenticação (ex: 'admin123', 'ortra123')
  crefito?: string;
  commissionRate: number; // e.g. 60 for 60%
  mustChangePassword: boolean;
  hasCompletedTour: boolean;
  active: boolean;
  createdAt: string;
}

export interface PatientChecklist {
  consentLgpdSigned: boolean;
  identificationVerified: boolean;
  rulesExplained: boolean;
  firstAssessmentScheduled: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Patient {
  id: string;
  physioId: string;
  fullName: string;
  cpf: string;
  birthDate: string; // YYYY-MM-DD
  phone: string;
  healthInsurance: string; // 'Particular', 'Unimed', 'Bradesco Saúde', etc.
  emergencyContact: EmergencyContact;
  profession: string;
  defaultSessionValue: number;
  onboardingChecklist?: PatientChecklist;
  createdAt: string;
  notes?: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  url?: string;
  path?: string;
}

export interface GoniometryMeasurement {
  joint: string;
  movement: string;
  degrees: number;
  reference: string; // Normal range e.g. "0-140°"
  notes?: string;
}

export interface MuscleStrengthMeasurement {
  muscleGroup: string;
  grade: number; // 0 to 5 (Oxford Scale)
  notes?: string;
}

export interface OrthopedicTest {
  name: string;
  region: string;
  result: 'positive' | 'negative' | 'inconclusive';
  notes?: string;
}

export interface AnamnesisData {
  qp: string; // Queixa Principal
  hda: string; // História da Doença Atual
  hpp: string; // Histórico Patológico Pregresso (cirurgias, comorbidades)
  medications: string; // Medicamentos em uso
  examNotes: string; // Exames complementares
  lifeHabits: {
    physicalActivity: string;
    sleepQuality: string;
    tobacco: boolean;
    alcohol: boolean;
    workPosturalDemands: string;
  };
  attachedFiles: AttachedFile[];
}

export interface PhysicalExamData {
  evaInitial: number; // 0-10
  inspectionPalpation: string; // Edemas, cicatrizes, desvios posturais, espasmos
  goniometry: GoniometryMeasurement[];
  muscleStrength: MuscleStrengthMeasurement[];
  orthopedicTests: OrthopedicTest[];
}

export interface TreatmentGoals {
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
}

export interface DiagnosisAndPlanData {
  kineticFunctionalDiagnosis: string;
  treatmentGoals: TreatmentGoals;
  therapeuticPlan: string[]; // e.g. ['Cinesioterapia', 'Terapia Manual', 'Eletroterapia']
  planDetails: string;
}

export interface Assessment {
  id: string;
  patientId: string;
  physioId: string;
  createdAt: string;
  anamnesis: AnamnesisData;
  physicalExam: PhysicalExamData;
  diagnosisAndPlan: DiagnosisAndPlanData;
}

export type AttendanceStatus = 'completed' | 'missed_justified' | 'missed_unjustified';
export type PaymentStatus = 'pending' | 'paid';

export interface Evolution {
  id: string;
  patientId: string;
  physioId: string;
  sessionDate: string; // ISO datetime
  sessionNumber: number;
  description: string;
  evaBefore: number;
  evaAfter: number;
  attendanceStatus: AttendanceStatus;
  sessionValue: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  createdAt: string;
}

export interface HealthInsurancePlan {
  id: string;
  name: string;
  baseSessionValue: number;
  paymentTermDays: number; // e.g. 30 days
  active: boolean;
  logoUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface ClinicSettings {
  clinicName: string;
  commercialName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  defaultPhysioCommission: number;
  technicalResponsible: string;
  technicalResponsibleCrefito: string;
}

export type AppointmentStatus =
  | 'scheduled'      // Agendado
  | 'confirmed'      // Confirmado
  | 'in_progress'    // Em Atendimento
  | 'completed'      // Concluído
  | 'missed'         // Falta
  | 'cancelled';     // Cancelado

export type AppointmentModality =
  | 'particular'
  | 'convenio'
  | 'cartao_ortra'
  | 'retorno';

export interface Appointment {
  id: string;
  patientId: string;
  physioId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  modality: AppointmentModality;
  serviceType: string; // ex: 'Cinesioterapia', 'Eletroterapia', 'Fisioterapia Ortopédica', 'RPG', 'Avaliação'
  status: AppointmentStatus;
  notes?: string;
  sessionValue?: number;
  recurrenceGroupId?: string;
  createdAt: string;
  updatedAt?: string;
}

