/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserProfile,
  Patient,
  Assessment,
  Evolution,
  HealthInsurancePlan,
  AuditLog,
  ClinicSettings,
  Appointment,
  AppointmentStatus,
} from '../types/index.ts';
import { supabase, authAdminClient } from './supabaseClient.ts';

const STORAGE_KEYS = {
  CURRENT_USER: 'ortra_current_user',
  IS_AUTHENTICATED: 'ortra_is_auth',
  PROFILES: 'ortra_profiles',
  PATIENTS: 'ortra_patients',
  ASSESSMENTS: 'ortra_assessments',
  EVOLUTIONS: 'ortra_evolutions',
  INSURANCE_PLANS: 'ortra_insurance_plans',
  AUDIT_LOGS: 'ortra_audit_logs',
  CLINIC_SETTINGS: 'ortra_clinic_settings',
  APPOINTMENTS: 'ortra_appointments_v1',
};

// UUID Generation & Mapping Helpers
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const LEGACY_ID_MAP: Record<string, string> = {
  user_admin_01: 'a0000000-0000-4000-8000-000000000001',
  user_physio_01: 'a0000000-0000-4000-8000-000000000002',
  user_physio_02: 'a0000000-0000-4000-8000-000000000003',
  user_physio_03: 'a0000000-0000-4000-8000-000000000004',
  pat_01: 'b0000000-0000-4000-8000-000000000001',
  pat_02: 'b0000000-0000-4000-8000-000000000002',
  pat_03: 'b0000000-0000-4000-8000-000000000003',
  pat_04: 'b0000000-0000-4000-8000-000000000004',
  ass_01: 'c0000000-0000-4000-8000-000000000001',
  ass_02: 'c0000000-0000-4000-8000-000000000002',
  evo_01: 'd0000000-0000-4000-8000-000000000001',
  evo_02: 'd0000000-0000-4000-8000-000000000002',
  evo_03: 'd0000000-0000-4000-8000-000000000003',
  evo_04: 'd0000000-0000-4000-8000-000000000004',
  evo_05: 'd0000000-0000-4000-8000-000000000005',
  evo_06: 'd0000000-0000-4000-8000-000000000006',
  evo_07: 'd0000000-0000-4000-8000-000000000007',
};

export function ensureUUID(id?: string | null): string {
  if (!id) return generateUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  if (LEGACY_ID_MAP[id]) {
    return LEGACY_ID_MAP[id];
  }
  return generateUUID();
}

// Purge any legacy demo patient and user records from previous sessions
function purgeLegacyDemoData() {
  try {
    if (typeof localStorage !== 'undefined') {
      const storedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (storedPatients) {
        const list = JSON.parse(storedPatients);
        if (Array.isArray(list) && list.some((p: any) => p.id?.startsWith('pat_') || p.id?.startsWith('b0000000-'))) {
          localStorage.removeItem(STORAGE_KEYS.PATIENTS);
          localStorage.removeItem(STORAGE_KEYS.ASSESSMENTS);
          localStorage.removeItem(STORAGE_KEYS.EVOLUTIONS);
        }
      }
      const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (storedProfiles) {
        const list = JSON.parse(storedProfiles);
        if (Array.isArray(list) && list.some((p: any) => p.email === 'admin@ortra.com.br' || p.email === 'marcelo.carvalho@ortra.com.br')) {
          localStorage.removeItem(STORAGE_KEYS.PROFILES);
        }
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
}
purgeLegacyDemoData();

// Default Initial Profiles (Reflects strictly real Supabase database)
export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: '7b47fdfc-31d0-4259-9239-0836522aace7',
    email: 'raonemota@hotmail.com',
    fullName: 'Raone Mota',
    gender: 'M',
    phone: '(71) 98606-3671',
    role: 'admin',
    isAdmin: true,
    password: '',
    crefito: 'CREFITO-7/08921-F',
    commissionRate: 100,
    mustChangePassword: false,
    hasCompletedTour: true,
    active: true,
    createdAt: '2026-10-28T11:53:32Z',
  },
];

export const INITIAL_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: 'Clínica Ortra de Ortopedia e Fisioterapia',
  commercialName: 'Clínica Ortra - Lauro de Freitas',
  cnpj: '14.892.301/0001-44',
  address: 'Av. Santos Dumont, 1883, Centro - Lauro de Freitas - BA, CEP 42702-400',
  phone: '(71) 3379-4000',
  email: 'contato@ortra.com.br',
  defaultPhysioCommission: 60,
  technicalResponsible: 'Dra. Beatriz Ortra',
  technicalResponsibleCrefito: 'CREFITO-7/08921-F',
};

export const INITIAL_INSURANCE_PLANS: HealthInsurancePlan[] = [
  { id: 'plan_particular', name: 'Particular', baseSessionValue: 160, paymentTermDays: 0, active: true, logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100&auto=format&fit=crop&q=80' },
  { id: 'plan_unimed', name: 'Unimed Norte/Nordeste', baseSessionValue: 110, paymentTermDays: 30, active: true, logoUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=100&auto=format&fit=crop&q=80' },
  { id: 'plan_bradesco', name: 'Bradesco Saúde', baseSessionValue: 125, paymentTermDays: 45, active: true, logoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=100&auto=format&fit=crop&q=80' },
  { id: 'plan_sulamerica', name: 'SulAmérica Saúde', baseSessionValue: 130, paymentTermDays: 30, active: true, logoUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=100&auto=format&fit=crop&q=80' },
  { id: 'plan_cassi', name: 'CASSI', baseSessionValue: 115, paymentTermDays: 30, active: true, logoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=100&auto=format&fit=crop&q=80' },
];

// Completely empty demo arrays - the system strictly uses the Supabase database
export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_ASSESSMENTS: Assessment[] = [];
export const INITIAL_EVOLUTIONS: Evolution[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

/**
 * Main persistent Storage Service
 */
class ClinicalStorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Error reading key ${key} from storage:`, e);
    }
    return defaultValue;
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing key ${key} to storage:`, e);
    }
  }

  // --- Profiles & Current User ---
  getCurrentUser(): UserProfile {
    const profiles = this.getProfiles();
    const stored = this.get<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored) {
      // Find latest updated version of profile
      const found = profiles.find((p) => p.id === stored.id);
      return found || stored;
    }
    // Default to the first profile (admin)
    return profiles[0];
  }

  setCurrentUser(user: UserProfile): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  isAuthenticated(): boolean {
    return this.get<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, false);
  }

  setAuthenticated(status: boolean): void {
    this.set(STORAGE_KEYS.IS_AUTHENTICATED, status);
  }

  async login(email: string, pass: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: 'Informe seu e-mail e senha para acessar o prontuário.' };
    }

    // Autenticação estrita e exclusiva nos usuários cadastrados no Supabase Auth
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (authErr || !authData?.user) {
        // Validação de credencial na tabela de perfis (public.profiles)
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (dbProfile && dbProfile.password && dbProfile.password === cleanPass) {
          if (dbProfile.active === false) {
            return {
              success: false,
              message: 'Este usuário está inativo no sistema. Contate a administração da clínica.',
            };
          }

          const userProfile: UserProfile = {
            id: dbProfile.id,
            email: dbProfile.email || cleanEmail,
            fullName: dbProfile.full_name || cleanEmail.split('@')[0],
            gender: (dbProfile.gender as 'M' | 'F') || 'M',
            phone: dbProfile.phone || '',
            role: dbProfile.role || 'physio',
            isAdmin: Boolean(dbProfile.is_admin),
            password: cleanPass,
            crefito: dbProfile.crefito || '',
            commissionRate: Number(dbProfile.commission_rate ?? 60),
            mustChangePassword: Boolean(dbProfile.must_change_password),
            hasCompletedTour: Boolean(dbProfile.has_completed_tour ?? true),
            active: true,
            createdAt: dbProfile.created_at || new Date().toISOString(),
          };

          this.setCurrentUser(userProfile);
          this.setAuthenticated(true);
          this.logAudit('LOGIN', `Acesso ao prontuário realizado por: ${userProfile.fullName} (${cleanEmail}).`);

          return { success: true, user: userProfile };
        }

        const errMsg = authErr?.message?.toLowerCase() || '';
        if (errMsg.includes('email not confirmed')) {
          return {
            success: false,
            message: 'E-mail aguardando confirmação no Supabase. Para login imediato sem link de e-mail, desmarque "Confirm email" em Authentication > Providers > Email no painel Supabase.',
          };
        }
        return {
          success: false,
          message: 'E-mail ou senha incorretos. Por favor, verifique suas credenciais de acesso.',
        };
      }

      // Obter dados clínicos do perfil na tabela public.profiles
      const { data: pRow } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${authData.user.id},email.eq.${cleanEmail}`)
        .maybeSingle();

      if (pRow && pRow.active === false) {
        await supabase.auth.signOut();
        return {
          success: false,
          message: 'Este usuário está inativo no sistema. Contate a administração da clínica.',
        };
      }

      const userProfile: UserProfile = pRow
        ? {
            id: pRow.id,
            email: pRow.email || cleanEmail,
            fullName: pRow.full_name || authData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            gender: (pRow.gender as 'M' | 'F') || 'M',
            phone: pRow.phone || '',
            role: pRow.role || 'physio',
            isAdmin: Boolean(pRow.is_admin),
            password: cleanPass,
            crefito: pRow.crefito || '',
            commissionRate: Number(pRow.commission_rate ?? 60),
            mustChangePassword: Boolean(pRow.must_change_password),
            hasCompletedTour: Boolean(pRow.has_completed_tour ?? true),
            active: true,
            createdAt: pRow.created_at || new Date().toISOString(),
          }
        : {
            id: authData.user.id,
            email: cleanEmail,
            fullName: authData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            gender: 'M',
            phone: '',
            role: 'physio',
            isAdmin: false,
            password: cleanPass,
            crefito: '',
            commissionRate: 60,
            mustChangePassword: false,
            hasCompletedTour: true,
            active: true,
            createdAt: new Date().toISOString(),
          };

      this.setCurrentUser(userProfile);
      this.setAuthenticated(true);
      this.logAudit('LOGIN', `Acesso ao prontuário realizado por: ${userProfile.fullName} (${cleanEmail}).`);

      return { success: true, user: userProfile };
    } catch (err: any) {
      console.warn('Erro ao autenticar:', err);
      return {
        success: false,
        message: 'Não foi possível conectar ao sistema. Por favor, verifique sua conexão e tente novamente.',
      };
    }
  }

  async logout(): Promise<void> {
    const user = this.getCurrentUser();
    this.logAudit('LOGOFF', `Usuário ${user?.fullName || ''} encerrou a sessão.`);
    this.setAuthenticated(false);
    this.set(STORAGE_KEYS.CURRENT_USER, null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut aviso:', e);
    }
  }

  // --- Supabase Synchronization Methods ---
  async syncFromSupabase(): Promise<{ ok: boolean; message: string; count?: number }> {
    try {
      let totalSynced = 0;

      // 1. Sync Profiles
      const { data: pData, error: pErr } = await supabase.from('profiles').select('*');
      if (!pErr && pData && pData.length > 0) {
        const mappedProfiles: UserProfile[] = pData.map((row: any) => ({
          id: row.id,
          email: row.email,
          fullName: row.full_name || row.fullName,
          gender: (row.gender as 'M' | 'F') || 'M',
          phone: row.phone || '',
          role: row.role || 'physio',
          isAdmin: Boolean(row.is_admin ?? row.isAdmin),
          password: row.password || '',
          crefito: row.crefito || '',
          commissionRate: Number(row.commission_rate ?? row.commissionRate ?? 60),
          mustChangePassword: Boolean(row.must_change_password ?? row.mustChangePassword),
          hasCompletedTour: Boolean(row.has_completed_tour ?? row.hasCompletedTour ?? true),
          active: row.active !== false,
          createdAt: row.created_at || new Date().toISOString(),
        }));
        this.set(STORAGE_KEYS.PROFILES, mappedProfiles);
        totalSynced += mappedProfiles.length;
      }

      // 2. Sync Patients (Sem mocks: reflete estritamente a base de dados)
      const { data: patData, error: patErr } = await supabase.from('patients').select('*');
      if (!patErr && Array.isArray(patData)) {
        const mappedPatients: Patient[] = patData.map((row: any) => ({
          id: row.id,
          physioId: row.physio_id || row.physioId,
          fullName: row.full_name || row.fullName,
          cpf: row.cpf,
          birthDate: row.birth_date || row.birthDate,
          phone: row.phone || '',
          healthInsurance: row.health_insurance || row.healthInsurance || 'Particular',
          emergencyContact: typeof row.emergency_contact === 'string'
            ? { name: row.emergency_contact_name || '', phone: row.emergency_contact, relationship: '' }
            : (row.emergency_contact || { name: '', relationship: '', phone: '' }),
          profession: row.profession || '',
          defaultSessionValue: Number(row.default_session_value ?? row.defaultSessionValue ?? 160),
          notes: row.notes || '',
          createdAt: row.created_at || new Date().toISOString(),
        }));
        this.set(STORAGE_KEYS.PATIENTS, mappedPatients);
        totalSynced += mappedPatients.length;
      }

      // 3. Sync Insurance Plans
      const { data: planData, error: planErr } = await supabase.from('insurance_plans').select('*');
      if (!planErr && planData && planData.length > 0) {
        const mappedPlans: HealthInsurancePlan[] = planData.map((row: any) => ({
          id: row.id,
          name: row.name,
          baseSessionValue: Number(row.base_session_value ?? row.baseSessionValue ?? 120),
          paymentTermDays: Number(row.payment_term_days ?? row.paymentTermDays ?? 30),
          active: row.active !== false,
          logoUrl: row.logo_url || row.logoUrl || '',
        }));
        this.set(STORAGE_KEYS.INSURANCE_PLANS, mappedPlans);
        totalSynced += mappedPlans.length;
      }

      // 4. Sync Assessments (Estritamente base de dados)
      const { data: assData, error: assErr } = await supabase.from('assessments').select('*');
      if (!assErr && Array.isArray(assData)) {
        const mappedAssessments: Assessment[] = assData.map((row: any) => ({
          id: row.id,
          patientId: row.patient_id || row.patientId,
          physioId: row.physio_id || row.physioId,
          createdAt: row.created_at || new Date().toISOString(),
          anamnesis: row.anamnesis,
          physicalExam: row.physical_exam || row.physicalExam,
          diagnosisAndPlan: row.diagnosis_and_plan || row.diagnosisAndPlan,
        }));
        this.set(STORAGE_KEYS.ASSESSMENTS, mappedAssessments);
        totalSynced += mappedAssessments.length;
      }

      // 5. Sync Evolutions (Estritamente base de dados)
      const { data: evoData, error: evoErr } = await supabase.from('evolutions').select('*');
      if (!evoErr && Array.isArray(evoData)) {
        const mappedEvolutions: Evolution[] = evoData.map((row: any) => ({
          id: row.id,
          patientId: row.patient_id || row.patientId,
          physioId: row.physio_id || row.physioId,
          sessionDate: row.session_date || row.sessionDate,
          sessionNumber: Number(row.session_number ?? row.sessionNumber ?? 1),
          description: row.description || '',
          evaBefore: Number(row.eva_before ?? row.evaBefore ?? 0),
          evaAfter: Number(row.eva_after ?? row.evaAfter ?? 0),
          attendanceStatus: row.attendance_status || row.attendanceStatus || 'completed',
          sessionValue: Number(row.session_value ?? row.sessionValue ?? 160),
          paymentStatus: row.payment_status || row.paymentStatus || 'paid',
          paymentMethod: row.payment_method || row.paymentMethod || 'Pix',
          createdAt: row.created_at || new Date().toISOString(),
        }));
        this.set(STORAGE_KEYS.EVOLUTIONS, mappedEvolutions);
        totalSynced += mappedEvolutions.length;
      }

      // 6. Sync Clinic Settings
      const { data: setRow, error: setErr } = await supabase.from('clinic_settings').select('*').limit(1).maybeSingle();
      if (!setErr && setRow) {
        const mappedSettings: ClinicSettings = {
          clinicName: setRow.clinic_name || setRow.clinicName,
          commercialName: setRow.commercial_name || setRow.commercialName,
          cnpj: setRow.cnpj,
          address: setRow.address,
          phone: setRow.phone,
          email: setRow.email,
          defaultPhysioCommission: Number(setRow.default_physio_commission ?? setRow.defaultPhysioCommission ?? 60),
          technicalResponsible: setRow.technical_responsible || setRow.technicalResponsible,
          technicalResponsibleCrefito: setRow.technical_responsible_crefito || setRow.technicalResponsibleCrefito,
        };
        this.set(STORAGE_KEYS.CLINIC_SETTINGS, mappedSettings);
      }

      // 7. Sync Audit Logs
      const { data: logData, error: logErr } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (!logErr && Array.isArray(logData)) {
        const mappedLogs: AuditLog[] = logData.map((row: any) => ({
          id: row.id,
          timestamp: row.created_at || row.timestamp || new Date().toISOString(),
          userId: row.user_id || row.userId,
          userName: row.user_name || row.userName || 'Sistema',
          userRole: row.user_role || row.userRole || 'admin',
          action: row.action,
          details: row.details || '',
          ipAddress: row.ip_address || row.ipAddress || '',
        }));
        this.set(STORAGE_KEYS.AUDIT_LOGS, mappedLogs);
        totalSynced += mappedLogs.length;
      }

      // 8. Sync Appointments (se a tabela já tiver sido criada no Supabase)
      try {
        const { data: aptData, error: aptErr } = await supabase.from('appointments').select('*');
        if (!aptErr && Array.isArray(aptData)) {
          const mappedAppointments: Appointment[] = aptData.map((row: any) => ({
            id: row.id,
            patientId: row.patient_id || row.patientId,
            physioId: row.physio_id || row.physioId,
            date: row.date,
            startTime: (row.start_time || row.startTime || '').slice(0, 5),
            endTime: (row.end_time || row.endTime || '').slice(0, 5),
            modality: row.modality || 'particular',
            serviceType: row.service_type || row.serviceType || 'Cinesioterapia',
            status: row.status || 'scheduled',
            notes: row.notes || '',
            sessionValue: Number(row.session_value ?? row.sessionValue ?? 0),
            recurrenceGroupId: row.recurrence_group_id || row.recurrenceGroupId || undefined,
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
            updatedAt: row.updated_at || row.updatedAt || undefined,
          }));
          this.set(STORAGE_KEYS.APPOINTMENTS, mappedAppointments);
          totalSynced += mappedAppointments.length;
        }
      } catch (e) {
        // Tabela de agendamentos ainda pendente de migração manual
      }

      return { ok: true, message: 'Dados sincronizados do Supabase com sucesso.', count: totalSynced };
    } catch (err: any) {
      console.warn('Erro ao sincronizar do Supabase:', err);
      return { ok: false, message: err?.message || 'Falha na sincronização' };
    }
  }

  getProfiles(): UserProfile[] {
    return this.get<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  async saveProfile(
    profile: UserProfile,
    isNewUser: boolean = false
  ): Promise<{ success: boolean; error?: string; code?: string; sqlFix?: string }> {
    const cleanProfile: UserProfile = {
      ...profile,
      id: ensureUUID(profile.id),
      email: profile.email.trim().toLowerCase(),
    };

    const existingProfiles = this.getProfiles();
    const existing = existingProfiles.find(
      (p) => p.id === cleanProfile.id || p.email.toLowerCase() === cleanProfile.email
    );

    const isCreatingAuthUser = isNewUser || (!existing && Boolean(cleanProfile.password));

    // 1. Criar PRIMEIRO no Supabase Authentication (auth.users)
    // Usando authAdminClient (persistSession: false) para NÃO deslogar nem interferir na sessão do administrador
    if (isCreatingAuthUser && cleanProfile.password) {
      try {
        const { data: authData, error: authErr } = await authAdminClient.auth.signUp({
          email: cleanProfile.email,
          password: cleanProfile.password,
          options: {
            data: {
              full_name: cleanProfile.fullName,
              role: cleanProfile.role,
              crefito: cleanProfile.crefito || '',
            },
          },
        });

        if (authErr) {
          console.warn('Erro ao criar usuário no Supabase Auth:', authErr);
          const errLower = (authErr.message || '').toLowerCase();
          if (errLower.includes('already registered') || authErr.status === 422) {
            console.log(`Usuário ${cleanProfile.email} já possui registro no Supabase Auth. Sincronizando perfil.`);
            const { data: existingRow } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', cleanProfile.email)
              .maybeSingle();
            if (existingRow?.id) {
              cleanProfile.id = existingRow.id;
            }
          } else if (errLower.includes('database error saving new user') || errLower.includes('database error')) {
            const sqlFix = `-- 1. Definir valor padrão para evitar erro NOT NULL em triggers antigos:
ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT 'Profissional';

-- 2. Remover triggers quebrados que bloqueiam a inserção na tabela auth.users:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_for_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. (Recomendado) Recriar a função e o trigger com tratamento de erro seguro:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, role, is_admin, active, created_at, updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'physio'),
    COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, false),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RETURN new; -- Evita travar a criação em auth.users caso ocorra divergência
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

            return {
              success: false,
              code: 'DATABASE_TRIGGER_ERROR',
              error:
                'O Supabase retornou "Database error saving new user". Isso ocorre quando há um Trigger na tabela auth.users (ex: handle_new_user) falhando ao rodar no PostgreSQL.',
              sqlFix,
            };
          }

          return {
            success: false,
            error: `Erro ao cadastrar na autenticação do Supabase: ${authErr.message}`,
          };
        }

        // Se o Supabase Auth criou o usuário com sucesso, o ID em auth.users é a chave primária
        if (authData?.user?.id) {
          cleanProfile.id = authData.user.id;
        }
      } catch (authCatchErr: any) {
        console.error('Falha de comunicação com o Supabase Auth:', authCatchErr);
        return {
          success: false,
          error: `Falha ao conectar com o serviço de autenticação do Supabase: ${authCatchErr?.message || 'Erro desconhecido'}`,
        };
      }
    }

    // 2. Gravar os dados do profissional na tabela public.profiles do Supabase
    // Como cleanProfile.id é o UUID exato de auth.users, a chave estrangeira (profiles_id_fkey) é 100% satisfeita!
    const payload = {
      id: cleanProfile.id,
      email: cleanProfile.email,
      full_name: cleanProfile.fullName,
      gender: cleanProfile.gender || 'M',
      phone: cleanProfile.phone,
      role: cleanProfile.role,
      is_admin: Boolean(cleanProfile.isAdmin),
      password: cleanProfile.password || '',
      crefito: cleanProfile.crefito || '',
      commission_rate: cleanProfile.commissionRate,
      default_session_rate: 0,
      must_change_password: cleanProfile.mustChangePassword,
      has_completed_tour: cleanProfile.hasCompletedTour,
      active: cleanProfile.active !== false,
      created_at: cleanProfile.createdAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload);

    if (error) {
      console.error('Erro ao salvar fisioterapeuta no Supabase:', error);
      const isFkConstraint =
        error.code === '23503' ||
        error.message?.includes('profiles_id_fkey') ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('users');

      if (isFkConstraint) {
        // Armazena localmente para o administrador não perder os dados do profissional
        const profiles = this.getProfiles();
        const idx = profiles.findIndex(
          (p) => p.id === cleanProfile.id || p.email.toLowerCase() === cleanProfile.email
        );
        let updated: UserProfile[];
        if (idx >= 0) {
          updated = [...profiles];
          updated[idx] = cleanProfile;
        } else {
          updated = [cleanProfile, ...profiles];
        }
        this.set(STORAGE_KEYS.PROFILES, updated);

        return {
          success: false,
          code: '23503',
          error:
            'A tabela "profiles" no Supabase possui a restrição de chave estrangeira (profiles_id_fkey) apontando para auth.users. O usuário não foi localizado em auth.users.',
          sqlFix: 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;',
        };
      }

      return { success: false, error: error.message };
    }

    // 3. Atualizar armazenamento local
    const profiles = this.getProfiles();
    const idx = profiles.findIndex(
      (p) => p.id === cleanProfile.id || p.email.toLowerCase() === cleanProfile.email
    );
    let updated: UserProfile[];
    if (idx >= 0) {
      updated = [...profiles];
      updated[idx] = cleanProfile;
    } else {
      updated = [cleanProfile, ...profiles];
    }
    this.set(STORAGE_KEYS.PROFILES, updated);

    // Se estiver atualizando o usuário logado
    const current = this.getCurrentUser();
    if (current && (current.id === cleanProfile.id || current.email.toLowerCase() === cleanProfile.email)) {
      this.setCurrentUser(cleanProfile);
    }

    return { success: true };
  }

  deleteProfile(profileId: string): boolean {
    const normalizedId = ensureUUID(profileId);
    const profiles = this.getProfiles();
    const target = profiles.find((p) => p.id === normalizedId || p.id === profileId);
    if (!target) return false;

    const updated = profiles.filter((p) => p.id !== target.id);
    this.set(STORAGE_KEYS.PROFILES, updated);

    this.logAudit(
      'EXCLUSAO_USUARIO',
      `Usuário ${target.fullName} (${target.email} - ${target.role}) foi excluído pelo administrador.`
    );

    // Delete in Supabase
    supabase.from('profiles').delete().eq('id', target.id).then(({ error }) => {
      if (error) console.warn('Supabase profiles delete:', error.message);
    });

    // If deleted user was active current user, switch to admin or another profile
    const current = this.getCurrentUser();
    if (current.id === target.id) {
      const fallback = updated[0] || INITIAL_PROFILES[0];
      this.setCurrentUser(fallback);
    }
    return true;
  }

  // --- Patients (Sem dados demo: puramente base de dados) ---
  getPatients(): Patient[] {
    return this.get<Patient[]>(STORAGE_KEYS.PATIENTS, []);
  }

  getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id);
  }

  async savePatient(patient: Patient): Promise<{ success: boolean; error?: string }> {
    const cleanPatient: Patient = {
      ...patient,
      id: ensureUUID(patient.id),
      physioId: ensureUUID(patient.physioId),
    };

    // 1. Gravar diretamente na base de dados do Supabase com compatibilidade de colunas
    const { error } = await supabase.from('patients').upsert({
      id: cleanPatient.id,
      physio_id: cleanPatient.physioId,
      full_name: cleanPatient.fullName,
      cpf: cleanPatient.cpf,
      birth_date: cleanPatient.birthDate,
      phone: cleanPatient.phone,
      health_insurance: cleanPatient.healthInsurance,
      emergency_contact: (cleanPatient.emergencyContact?.phone || cleanPatient.phone || '').slice(0, 20),
      emergency_contact_name: cleanPatient.emergencyContact?.name || '',
      profession: cleanPatient.profession,
      default_session_value: cleanPatient.defaultSessionValue,
      notes: cleanPatient.notes,
      created_at: cleanPatient.createdAt,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Erro ao salvar paciente no Supabase:', error);
      return { success: false, error: error.message };
    }

    const patients = this.getPatients();
    const idx = patients.findIndex((p) => p.id === cleanPatient.id);
    let updated: Patient[];
    if (idx >= 0) {
      updated = [...patients];
      updated[idx] = cleanPatient;
    } else {
      updated = [cleanPatient, ...patients];
    }
    this.set(STORAGE_KEYS.PATIENTS, updated);

    this.logAudit(
      idx >= 0 ? 'ATUALIZACAO_PACIENTE' : 'CADASTRO_PACIENTE',
      `Paciente: ${cleanPatient.fullName} (CPF: ${cleanPatient.cpf}) registrado na base de dados do Supabase.`
    );

    return { success: true };
  }

  transferPatientPortfolio(sourcePhysioId: string, targetPhysioId: string): number {
    const sId = ensureUUID(sourcePhysioId);
    const tId = ensureUUID(targetPhysioId);
    const patients = this.getPatients();
    const sourceProfile = this.getProfiles().find((p) => p.id === sId);
    const targetProfile = this.getProfiles().find((p) => p.id === tId);
    let count = 0;

    const updated = patients.map((pat) => {
      if (pat.physioId === sId || pat.physioId === sourcePhysioId) {
        count++;
        // Update in Supabase
        supabase.from('patients').update({ physio_id: tId }).eq('id', pat.id).then();
        return { ...pat, physioId: tId };
      }
      return pat;
    });

    this.set(STORAGE_KEYS.PATIENTS, updated);

    this.logAudit(
      'TRANSFERENCIA_CARTEIRA',
      `Transferidos ${count} pacientes de ${sourceProfile?.fullName || sourcePhysioId} para ${targetProfile?.fullName || targetPhysioId}.`
    );

    return count;
  }

  // --- Assessments (Estritamente base de dados) ---
  getAssessments(): Assessment[] {
    return this.get<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
  }

  getAssessmentsForPatient(patientId: string): Assessment[] {
    const pId = ensureUUID(patientId);
    return this.getAssessments().filter((a) => a.patientId === pId || a.patientId === patientId);
  }

  async saveAssessment(assessment: Assessment): Promise<{ success: boolean; error?: string }> {
    const cleanAssessment: Assessment = {
      ...assessment,
      id: ensureUUID(assessment.id),
      patientId: ensureUUID(assessment.patientId),
      physioId: ensureUUID(assessment.physioId),
    };

    const { error } = await supabase.from('assessments').upsert({
      id: cleanAssessment.id,
      patient_id: cleanAssessment.patientId,
      physio_id: cleanAssessment.physioId,
      anamnesis: cleanAssessment.anamnesis,
      physical_exam: cleanAssessment.physicalExam,
      diagnosis_and_plan: cleanAssessment.diagnosisAndPlan,
      created_at: cleanAssessment.createdAt,
    });

    if (error) {
      console.error('Erro ao salvar avaliação no Supabase:', error);
      return { success: false, error: error.message };
    }

    const assessments = this.getAssessments();
    const idx = assessments.findIndex((a) => a.id === cleanAssessment.id);
    let updated: Assessment[];
    if (idx >= 0) {
      updated = [...assessments];
      updated[idx] = cleanAssessment;
    } else {
      updated = [cleanAssessment, ...assessments];
    }
    this.set(STORAGE_KEYS.ASSESSMENTS, updated);

    const pat = this.getPatientById(cleanAssessment.patientId);
    this.logAudit(
      'NOVA_AVALIACAO_CLINICA',
      `Avaliação registrada para o paciente ${pat?.fullName || cleanAssessment.patientId} na base Supabase.`
    );

    return { success: true };
  }

  // --- Evolutions (Estritamente base de dados) ---
  getEvolutions(): Evolution[] {
    return this.get<Evolution[]>(STORAGE_KEYS.EVOLUTIONS, []);
  }

  getEvolutionsForPatient(patientId: string): Evolution[] {
    const pId = ensureUUID(patientId);
    return this.getEvolutions()
      .filter((e) => e.patientId === pId || e.patientId === patientId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }

  async saveEvolution(evolution: Evolution): Promise<{ success: boolean; error?: string }> {
    const cleanEvolution: Evolution = {
      ...evolution,
      id: ensureUUID(evolution.id),
      patientId: ensureUUID(evolution.patientId),
      physioId: ensureUUID(evolution.physioId),
    };

    const { error } = await supabase.from('evolutions').upsert({
      id: cleanEvolution.id,
      patient_id: cleanEvolution.patientId,
      physio_id: cleanEvolution.physioId,
      session_date: cleanEvolution.sessionDate,
      session_number: cleanEvolution.sessionNumber,
      description: cleanEvolution.description,
      eva_before: cleanEvolution.evaBefore,
      eva_after: cleanEvolution.evaAfter,
      attendance_status: cleanEvolution.attendanceStatus,
      session_value: cleanEvolution.sessionValue,
      payment_status: cleanEvolution.paymentStatus,
      payment_method: cleanEvolution.paymentMethod,
      created_at: cleanEvolution.createdAt,
    });

    if (error) {
      console.error('Erro ao salvar evolução no Supabase:', error);
      return { success: false, error: error.message };
    }

    const evolutions = this.getEvolutions();
    const idx = evolutions.findIndex((e) => e.id === cleanEvolution.id);
    let updated: Evolution[];
    if (idx >= 0) {
      updated = [...evolutions];
      updated[idx] = cleanEvolution;
    } else {
      updated = [cleanEvolution, ...evolutions];
    }
    this.set(STORAGE_KEYS.EVOLUTIONS, updated);

    const pat = this.getPatientById(cleanEvolution.patientId);
    this.logAudit(
      'REGISTRO_EVOLUCAO_SESSAO',
      `Sessão ${cleanEvolution.sessionNumber} (${cleanEvolution.attendanceStatus}) para ${pat?.fullName || cleanEvolution.patientId}. Valor: R$ ${cleanEvolution.sessionValue}`
    );

    return { success: true };
  }

  // --- Health Insurance Plans ---
  getInsurancePlans(): HealthInsurancePlan[] {
    return this.get<HealthInsurancePlan[]>(STORAGE_KEYS.INSURANCE_PLANS, INITIAL_INSURANCE_PLANS);
  }

  saveInsurancePlan(plan: HealthInsurancePlan): void {
    const plans = this.getInsurancePlans();
    const idx = plans.findIndex((p) => p.id === plan.id);
    let updated: HealthInsurancePlan[];
    if (idx >= 0) {
      updated = [...plans];
      updated[idx] = plan;
    } else {
      updated = [plan, ...plans];
    }
    this.set(STORAGE_KEYS.INSURANCE_PLANS, updated);
    this.logAudit(
      idx >= 0 ? 'ATUALIZACAO_CONVENIO' : 'CADASTRO_CONVENIO',
      `Tabela de convênio "${plan.name}" com valor base de R$ ${plan.baseSessionValue}.`
    );

    // Persist to Supabase
    supabase.from('insurance_plans').upsert({
      id: plan.id,
      name: plan.name,
      base_session_value: plan.baseSessionValue,
      payment_term_days: plan.paymentTermDays,
      active: plan.active,
      logo_url: plan.logoUrl,
    }).then(({ error }) => {
      if (error) console.warn('Supabase insurance_plans upsert:', error.message);
    });
  }

  deleteInsurancePlan(planId: string): boolean {
    const plans = this.getInsurancePlans();
    const target = plans.find((p) => p.id === planId);
    if (!target) return false;
    const updated = plans.filter((p) => p.id !== planId);
    this.set(STORAGE_KEYS.INSURANCE_PLANS, updated);
    this.logAudit('EXCLUSAO_CONVENIO', `Convênio "${target.name}" excluído.`);

    // Delete in Supabase
    supabase.from('insurance_plans').delete().eq('id', planId).then(({ error }) => {
      if (error) console.warn('Supabase insurance_plans delete:', error.message);
    });

    return true;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  logAudit(action: string, details: string): void {
    const current = this.getCurrentUser();
    const log: AuditLog = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      userId: ensureUUID(current.id),
      userName: current.fullName,
      userRole: current.role,
      action,
      details,
      ipAddress: '187.54.12.98 (Lauro de Freitas/BA)',
    };
    const logs = this.getAuditLogs();
    this.set(STORAGE_KEYS.AUDIT_LOGS, [log, ...logs.slice(0, 100)]);

    // Persist to Supabase (table has column 'created_at')
    supabase.from('audit_logs').insert({
      id: log.id,
      created_at: log.timestamp,
      user_id: log.userId,
      user_name: log.userName,
      user_role: log.userRole,
      action: log.action,
      details: log.details,
      ip_address: log.ipAddress,
    }).then(({ error }) => {
      if (error) console.warn('Supabase audit_logs insert:', error.message);
    });
  }

  // --- Clinic Settings ---
  getClinicSettings(): ClinicSettings {
    return this.get<ClinicSettings>(STORAGE_KEYS.CLINIC_SETTINGS, INITIAL_CLINIC_SETTINGS);
  }

  saveClinicSettings(settings: ClinicSettings): void {
    this.set(STORAGE_KEYS.CLINIC_SETTINGS, settings);
    this.logAudit('CONFIGURACOES_CLINICA', 'Atualização dos dados institucionais da Clínica Ortra.');

    // Persist to Supabase
    supabase.from('clinic_settings').upsert({
      id: 'primary',
      clinic_name: settings.clinicName,
      commercial_name: settings.commercialName,
      cnpj: settings.cnpj,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      default_physio_commission: settings.defaultPhysioCommission,
      technical_responsible: settings.technicalResponsible,
      technical_responsible_crefito: settings.technicalResponsibleCrefito,
    }).then(({ error }) => {
      if (error) console.warn('Supabase clinic_settings upsert:', error.message);
    });
  }

  // --- Appointments / Agenda ---
  getAppointments(): Appointment[] {
    return this.get<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  }

  getAppointmentsByDate(date: string, physioId?: string): Appointment[] {
    const all = this.getAppointments();
    return all
      .filter((a) => {
        const matchDate = a.date === date;
        const matchPhysio = !physioId || physioId === 'all' || a.physioId === physioId;
        return matchDate && matchPhysio;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async saveAppointment(apt: Appointment): Promise<{ ok: boolean; message?: string }> {
    const list = this.getAppointments();
    const existingIndex = list.findIndex((a) => a.id === apt.id);
    const updatedApt: Appointment = {
      ...apt,
      id: apt.id || generateUUID(),
      updatedAt: new Date().toISOString(),
    };

    let updatedList: Appointment[];
    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = updatedApt;
    } else {
      updatedList = [updatedApt, ...list];
    }

    this.set(STORAGE_KEYS.APPOINTMENTS, updatedList);
    this.logAudit(
      existingIndex >= 0 ? 'ATUALIZACAO_AGENDAMENTO' : 'CRIACAO_AGENDAMENTO',
      `Sessão agendada para ${updatedApt.date} às ${updatedApt.startTime}`
    );

    // Persist to Supabase if table exists
    try {
      const { error } = await supabase.from('appointments').upsert({
        id: ensureUUID(updatedApt.id),
        patient_id: ensureUUID(updatedApt.patientId),
        physio_id: ensureUUID(updatedApt.physioId),
        date: updatedApt.date,
        start_time: updatedApt.startTime,
        end_time: updatedApt.endTime,
        modality: updatedApt.modality,
        service_type: updatedApt.serviceType,
        status: updatedApt.status,
        notes: updatedApt.notes || null,
        session_value: updatedApt.sessionValue || 0,
        recurrence_group_id: updatedApt.recurrenceGroupId ? ensureUUID(updatedApt.recurrenceGroupId) : null,
        created_at: updatedApt.createdAt || new Date().toISOString(),
        updated_at: updatedApt.updatedAt,
      });
      if (error && error.code !== 'PGRST205') {
        console.warn('Supabase appointments upsert:', error.message);
      }
    } catch (e) {
      // Table may not exist yet
    }

    return { ok: true };
  }

  async saveMultipleAppointments(apts: Appointment[]): Promise<{ ok: boolean; message?: string }> {
    const list = this.getAppointments();
    const now = new Date().toISOString();
    const processedApts = apts.map((a) => ({
      ...a,
      id: a.id || generateUUID(),
      updatedAt: now,
    }));

    const aptMap = new Map<string, Appointment>();
    list.forEach((a) => aptMap.set(a.id, a));
    processedApts.forEach((a) => aptMap.set(a.id, a));

    const updatedList = Array.from(aptMap.values());
    this.set(STORAGE_KEYS.APPOINTMENTS, updatedList);
    this.logAudit(
      'CRIACAO_SERIE_AGENDAMENTOS',
      `${processedApts.length} sessões adicionadas à agenda.`
    );

    try {
      const rows = processedApts.map((a) => ({
        id: ensureUUID(a.id),
        patient_id: ensureUUID(a.patientId),
        physio_id: ensureUUID(a.physioId),
        date: a.date,
        start_time: a.startTime,
        end_time: a.endTime,
        modality: a.modality,
        service_type: a.serviceType,
        status: a.status,
        notes: a.notes || null,
        session_value: a.sessionValue || 0,
        recurrence_group_id: a.recurrenceGroupId ? ensureUUID(a.recurrenceGroupId) : null,
        created_at: a.createdAt || now,
        updated_at: a.updatedAt,
      }));
      const { error } = await supabase.from('appointments').upsert(rows);
      if (error && error.code !== 'PGRST205') {
        console.warn('Supabase appointments batch upsert:', error.message);
      }
    } catch (e) {
      // Table may not exist yet
    }

    return { ok: true };
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<{ ok: boolean; message?: string }> {
    const list = this.getAppointments();
    const apt = list.find((a) => a.id === id);
    if (!apt) return { ok: false, message: 'Agendamento não encontrado' };

    const updatedApt: Appointment = {
      ...apt,
      status,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = list.map((a) => (a.id === id ? updatedApt : a));
    this.set(STORAGE_KEYS.APPOINTMENTS, updatedList);
    this.logAudit(
      'STATUS_AGENDAMENTO',
      `Status do agendamento alterado para "${status}" (${apt.date} ${apt.startTime})`
    );

    try {
      const { error } = await supabase.from('appointments').update({
        status,
        updated_at: updatedApt.updatedAt,
      }).eq('id', id);
      if (error && error.code !== 'PGRST205') {
        console.warn('Supabase appointments status update:', error.message);
      }
    } catch (e) {
      // Table may not exist yet
    }

    return { ok: true };
  }

  async deleteAppointment(id: string): Promise<{ ok: boolean; message?: string }> {
    const list = this.getAppointments();
    const target = list.find((a) => a.id === id);
    if (!target) return { ok: false, message: 'Agendamento não encontrado' };

    const updatedList = list.filter((a) => a.id !== id);
    this.set(STORAGE_KEYS.APPOINTMENTS, updatedList);
    this.logAudit(
      'EXCLUSAO_AGENDAMENTO',
      `Agendamento de ${target.date} às ${target.startTime} cancelado.`
    );

    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error && error.code !== 'PGRST205') {
        console.warn('Supabase appointments delete:', error.message);
      }
    } catch (e) {
      // Table may not exist yet
    }

    return { ok: true };
  }

  // Reset cache and re-sync from Supabase
  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.ASSESSMENTS);
    localStorage.removeItem(STORAGE_KEYS.EVOLUTIONS);
    localStorage.removeItem(STORAGE_KEYS.INSURANCE_PLANS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CLINIC_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    this.setCurrentUser(INITIAL_PROFILES[0]);
    this.syncFromSupabase();
  }
}

export const clinicalStorage = new ClinicalStorageService();
