-- ==============================================================================
-- CLÍNICA ORTRA - SCRIPT DE ESTRUTURAÇÃO E PERMISSÕES SUPABASE POSTGRESQL (CORRIGIDO)
-- ==============================================================================
-- Execute este script no SQL Editor do seu Supabase:
-- https://supabase.com/dashboard/project/doamjngwapqntdtlkzeo/sql
--
-- Correção de compatibilidade:
-- Como a tabela 'patients' e 'profiles' já possuem o campo 'id' como UUID,
-- as chaves estrangeiras (patient_id e physio_id) agora são estritamente UUID,
-- eliminando o erro 42804.
-- ==============================================================================

-- 1. EXTENSÃO PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA: PROFILES (Atualização de colunas)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT DEFAULT 'M',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'physio',
  is_admin BOOLEAN DEFAULT false,
  password TEXT DEFAULT 'ortra123',
  crefito TEXT,
  commission_rate NUMERIC DEFAULT 60,
  must_change_password BOOLEAN DEFAULT false,
  has_completed_tour BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir adição de colunas em profiles caso a tabela já existisse
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'M';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'ortra123';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 60;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT 'Profissional';

-- Trigger seguro para espelhar auth.users em public.profiles sem causar 'Database error saving new user'
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
    RETURN new; -- Previne travamento na inserção de auth.users
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABELA: PATIENTS (Atualização de colunas e FK para profiles)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physio_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  health_insurance TEXT NOT NULL DEFAULT 'Particular',
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  profession TEXT,
  default_session_value NUMERIC DEFAULT 160,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir adição de colunas em patients caso a tabela já existisse
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS physio_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS health_insurance TEXT DEFAULT 'Particular';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS default_session_value NUMERIC DEFAULT 160;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. TABELA: INSURANCE_PLANS (Convênios e Tabelas)
CREATE TABLE IF NOT EXISTS public.insurance_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_session_value NUMERIC NOT NULL DEFAULT 120,
  payment_term_days INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT true,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA: ASSESSMENTS (Avaliações Cinético-Funcionais - patient_id e physio_id como UUID)
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  physio_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  anamnesis JSONB NOT NULL DEFAULT '{}'::jsonb,
  physical_exam JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnosis_and_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABELA: EVOLUTIONS (Evoluções de Sessão - patient_id e physio_id como UUID)
CREATE TABLE IF NOT EXISTS public.evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  physio_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_number INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  eva_before INTEGER DEFAULT 0,
  eva_after INTEGER DEFAULT 0,
  attendance_status TEXT DEFAULT 'completed',
  session_value NUMERIC DEFAULT 160,
  payment_status TEXT DEFAULT 'paid',
  payment_method TEXT DEFAULT 'Pix',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABELA: CLINIC_SETTINGS (Dados Institucionais)
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  clinic_name TEXT,
  commercial_name TEXT,
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  default_physio_commission NUMERIC DEFAULT 60,
  technical_responsible TEXT,
  technical_responsible_crefito TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABELA: AUDIT_LOGS (Registro de Auditoria e LGPD)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details TEXT;

-- ==============================================================================
-- 9. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_patients_physio_id ON public.patients(physio_id);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients(cpf);
CREATE INDEX IF NOT EXISTS idx_evolutions_patient_id ON public.evolutions(patient_id);
CREATE INDEX IF NOT EXISTS idx_evolutions_physio_id ON public.evolutions(physio_id);
CREATE INDEX IF NOT EXISTS idx_assessments_patient_id ON public.assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 10. SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo profiles" ON public.profiles;
CREATE POLICY "Permitir acesso completo profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo insurance_plans" ON public.insurance_plans;
CREATE POLICY "Permitir acesso completo insurance_plans" ON public.insurance_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo patients" ON public.patients;
CREATE POLICY "Permitir acesso completo patients" ON public.patients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo assessments" ON public.assessments;
CREATE POLICY "Permitir acesso completo assessments" ON public.assessments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo evolutions" ON public.evolutions;
CREATE POLICY "Permitir acesso completo evolutions" ON public.evolutions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo clinic_settings" ON public.clinic_settings;
CREATE POLICY "Permitir acesso completo clinic_settings" ON public.clinic_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo audit_logs" ON public.audit_logs;
CREATE POLICY "Permitir acesso completo audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 11. BUCKETS DE ARMAZENAMENTO (STORAGE): 'docs' E 'configs'
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('docs', 'docs', true),
  ('configs', 'configs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Permitir leitura publica nos buckets da clinica" ON storage.objects;
CREATE POLICY "Permitir leitura publica nos buckets da clinica" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id IN ('docs', 'configs'));

DROP POLICY IF EXISTS "Permitir upload nos buckets da clinica" ON storage.objects;
CREATE POLICY "Permitir upload nos buckets da clinica" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id IN ('docs', 'configs'));

DROP POLICY IF EXISTS "Permitir atualizacao nos buckets da clinica" ON storage.objects;
CREATE POLICY "Permitir atualizacao nos buckets da clinica" ON storage.objects FOR UPDATE TO anon, authenticated
USING (bucket_id IN ('docs', 'configs'));

DROP POLICY IF EXISTS "Permitir exclusao nos buckets da clinica" ON storage.objects;
CREATE POLICY "Permitir exclusao nos buckets da clinica" ON storage.objects FOR DELETE TO anon, authenticated
USING (bucket_id IN ('docs', 'configs'));

-- ==============================================================================
-- 12. DADOS INICIAIS DA CLÍNICA ORTRA (SEED COM UUIDs VÁLIDOS)
-- ==============================================================================
INSERT INTO public.profiles (id, email, full_name, gender, phone, role, is_admin, password, crefito, commission_rate, must_change_password, has_completed_tour, active, created_at)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'admin@ortra.com.br', 'Beatriz Ortra', 'F', '(71) 99876-5432', 'admin', true, 'admin123', 'CREFITO-7/08921-F', 100, false, true, true, now()),
  ('a0000000-0000-4000-8000-000000000002', 'marcelo.carvalho@ortra.com.br', 'Marcelo Carvalho', 'M', '(71) 98123-4567', 'physio', false, 'ortra123', 'CREFITO-7/14298-F', 60, false, true, true, now()),
  ('a0000000-0000-4000-8000-000000000003', 'camila.santos@ortra.com.br', 'Camila Santos', 'F', '(71) 98234-5678', 'physio', true, 'ortra123', 'CREFITO-7/22341-F', 65, false, true, true, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.insurance_plans (id, name, base_session_value, payment_term_days, active, logo_url)
VALUES
  ('plan_particular', 'Particular', 160, 0, true, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100&auto=format&fit=crop&q=80'),
  ('plan_unimed', 'Unimed Norte/Nordeste', 110, 30, true, 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=100&auto=format&fit=crop&q=80'),
  ('plan_bradesco', 'Bradesco Saúde', 125, 45, true, 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=100&auto=format&fit=crop&q=80'),
  ('plan_sulamerica', 'SulAmérica Saúde', 130, 30, true, 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=100&auto=format&fit=crop&q=80'),
  ('plan_cassi', 'CASSI', 115, 30, true, 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=100&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clinic_settings (id, clinic_name, commercial_name, cnpj, address, phone, email, default_physio_commission, technical_responsible, technical_responsible_crefito)
VALUES
  ('primary', 'Clínica Ortra de Ortopedia e Fisioterapia LTDA', 'Clínica Ortra', '14.892.301/0001-44', 'Av. Santos Dumont, 1883, Centro - Lauro de Freitas - BA, CEP 42702-400', '(71) 3379-4000', 'contato@ortra.com.br', 60, 'Dra. Beatriz Ortra', 'CREFITO-7/08921-F')
ON CONFLICT (id) DO NOTHING;
