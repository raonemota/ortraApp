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
} from '../types/index.ts';

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
};

// Default Initial Profiles
export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user_admin_01',
    email: 'admin@ortra.com.br',
    fullName: 'Beatriz Ortra',
    gender: 'F',
    phone: '(71) 99876-5432',
    role: 'admin',
    isAdmin: true,
    password: 'admin123',
    crefito: 'CREFITO-7/08921-F',
    commissionRate: 100,
    mustChangePassword: false,
    hasCompletedTour: true,
    active: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'user_physio_01',
    email: 'marcelo.carvalho@ortra.com.br',
    fullName: 'Marcelo Carvalho',
    gender: 'M',
    phone: '(71) 98123-4567',
    role: 'physio',
    isAdmin: false,
    password: 'ortra123',
    crefito: 'CREFITO-7/14298-F',
    commissionRate: 60,
    mustChangePassword: false,
    hasCompletedTour: true,
    active: true,
    createdAt: '2024-02-15T09:30:00Z',
  },
  {
    id: 'user_physio_02',
    email: 'camila.santos@ortra.com.br',
    fullName: 'Camila Santos',
    gender: 'F',
    phone: '(71) 98765-4321',
    role: 'physio',
    isAdmin: true, // Fisio que é também Administradora!
    password: 'ortra123',
    crefito: 'CREFITO-7/22341-F',
    commissionRate: 65,
    mustChangePassword: false,
    hasCompletedTour: true,
    active: true,
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'user_physio_03',
    email: 'roberto.alencar@ortra.com.br',
    fullName: 'Roberto Alencar (Ex-colaborador)',
    gender: 'M',
    phone: '(71) 99111-2233',
    role: 'physio',
    isAdmin: false,
    password: 'ortra123',
    crefito: 'CREFITO-7/11094-F',
    commissionRate: 60,
    mustChangePassword: true,
    hasCompletedTour: false,
    active: false,
    createdAt: '2023-11-20T08:00:00Z',
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

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat_01',
    physioId: 'user_physio_01',
    fullName: 'Maria Helena Silveira',
    cpf: '529.982.247-25',
    birthDate: '1968-04-14',
    phone: '(71) 99245-1289',
    healthInsurance: 'Particular',
    emergencyContact: {
      name: 'Lucas Silveira (Filho)',
      relationship: 'Filho',
      phone: '(71) 99123-9988',
    },
    profession: 'Professora Aposentada',
    defaultSessionValue: 160,
    onboardingChecklist: {
      consentLgpdSigned: true,
      identificationVerified: true,
      rulesExplained: true,
      firstAssessmentScheduled: true,
    },
    createdAt: '2026-09-10T10:00:00Z',
    notes: 'Paciente pontual, refere queixas matinais no joelho esquerdo.',
  },
  {
    id: 'pat_02',
    physioId: 'user_physio_01',
    fullName: 'Carlos Eduardo Menezes',
    cpf: '714.283.945-81',
    birthDate: '1985-11-23',
    phone: '(71) 98765-1122',
    healthInsurance: 'Bradesco Saúde',
    emergencyContact: {
      name: 'Fernanda Menezes',
      relationship: 'Esposa',
      phone: '(71) 98765-3344',
    },
    profession: 'Engenheiro Civil',
    defaultSessionValue: 125,
    onboardingChecklist: {
      consentLgpdSigned: true,
      identificationVerified: true,
      rulesExplained: true,
      firstAssessmentScheduled: true,
    },
    createdAt: '2026-10-02T14:30:00Z',
    notes: 'Lombalgia mecânico-postural irradiando para glúteo E.',
  },
  {
    id: 'pat_03',
    physioId: 'user_physio_02',
    fullName: 'Juliana Paes Ramos',
    cpf: '382.910.457-19',
    birthDate: '1992-07-30',
    phone: '(71) 99344-5566',
    healthInsurance: 'Unimed Norte/Nordeste',
    emergencyContact: {
      name: 'Paulo Ramos',
      relationship: 'Irmão',
      phone: '(71) 99344-8899',
    },
    profession: 'Designer Gráfica',
    defaultSessionValue: 110,
    onboardingChecklist: {
      consentLgpdSigned: true,
      identificationVerified: true,
      rulesExplained: true,
      firstAssessmentScheduled: true,
    },
    createdAt: '2026-10-12T11:15:00Z',
    notes: 'Tendinopatia do supraespinal no ombro direito.',
  },
  {
    id: 'pat_04',
    physioId: 'user_physio_03', // From inactive physio for transfer demo!
    fullName: 'Antônio Carlos Barreto',
    cpf: '192.837.465-02',
    birthDate: '1959-02-18',
    phone: '(71) 98877-6655',
    healthInsurance: 'CASSI',
    emergencyContact: {
      name: 'Silvia Barreto',
      relationship: 'Cônjuge',
      phone: '(71) 98877-4433',
    },
    profession: 'Bancário Aposentado',
    defaultSessionValue: 115,
    onboardingChecklist: {
      consentLgpdSigned: true,
      identificationVerified: false, // Pending checklist item demo
      rulesExplained: true,
      firstAssessmentScheduled: false,
    },
    createdAt: '2026-10-20T09:00:00Z',
    notes: 'Paciente transferível aguardando reavaliação.',
  },
];

export const INITIAL_ASSESSMENTS: Assessment[] = [
  {
    id: 'ass_01',
    patientId: 'pat_01',
    physioId: 'user_physio_01',
    createdAt: '2026-09-11T10:30:00Z',
    anamnesis: {
      qp: 'Dor e estalidos no joelho esquerdo ao descer escadas.',
      hda: 'Paciente relata início insidioso há cerca de 6 meses, com piora progressiva nas últimas 3 semanas após caminhada prolongada. Alívio com repouso e crioterapia.',
      hpp: 'Meniscectomia parcial prévia (2018). Hipertensa controlada com Losartana 50mg. Sem histórico de fraturas.',
      medications: 'Losartana 50mg (1x/dia), Glucosamina + Condroitina.',
      examNotes: 'Ressonância Magnética de Joelho E (15/08/2026): Condropatia patelar grau II-III e redução do espaço tíbio-femoral medial com osteofitose discreta.',
      lifeHabits: {
        physicalActivity: 'Hidroginástica 2x por semana (interrompida no último mês)',
        sleepQuality: 'Regular, acorda esporadicamente por dor postural',
        tobacco: false,
        alcohol: false,
        workPosturalDemands: 'Atividades domésticas moderadas, sobe 2 lances de escada diariamente',
      },
      attachedFiles: [
        {
          id: 'file_01',
          name: 'Laudo_RM_Joelho_Esquerdo.pdf',
          size: '1.4 MB',
          type: 'application/pdf',
          date: '2026-09-10',
        },
      ],
    },
    physicalExam: {
      evaInitial: 7,
      inspectionPalpation: 'Edema leve (+/4+) em região peripatelar esquerda. Crepitação audível e palpável à flexo-extensão. Tensão muscular em gastrocnêmio e tensor da fáscia lata.',
      goniometry: [
        { joint: 'Joelho Esquerdo', movement: 'Flexão Ativa', degrees: 110, reference: '0-135°', notes: 'Dor no final do arco' },
        { joint: 'Joelho Esquerdo', movement: 'Extensão Ativa', degrees: -5, reference: '0°', notes: 'Déficit terminal de 5°' },
        { joint: 'Joelho Direito (Contralateral)', movement: 'Flexão Ativa', degrees: 135, reference: '0-135°' },
        { joint: 'Joelho Direito (Contralateral)', movement: 'Extensão Ativa', degrees: 0, reference: '0°' },
      ],
      muscleStrength: [
        { muscleGroup: 'Quadríceps E (Vasto Medial)', grade: 3, notes: 'Fadiga rápida com dor infrapatelar' },
        { muscleGroup: 'Isquiotibiais E', grade: 4, notes: 'Sem queixa álgica' },
        { muscleGroup: 'Glúteo Médio E', grade: 3, notes: 'Trendelenburg compensatório leve' },
        { muscleGroup: 'Tríceps Sural E', grade: 4 },
      ],
      orthopedicTests: [
        { name: 'Teste de Clarke (Compressão Patelar)', region: 'Joelho E', result: 'positive', notes: 'Dor intensa e apreensão' },
        { name: 'Teste de Lachman', region: 'Joelho E', result: 'negative', notes: 'LCA íntegro' },
        { name: 'Teste de Gaveta Anterior', region: 'Joelho E', result: 'negative' },
        { name: 'Teste de McMurray', region: 'Joelho E', result: 'negative', notes: 'Meniscos sem dor no momento' },
      ],
    },
    diagnosisAndPlan: {
      kineticFunctionalDiagnosis: 'Disfunção femoropatelar e gonartrose incipiente à esquerda com déficit de força em estabilizadores de pelve e quadríceps, restrição de ADM de flexão e crepitação.',
      treatmentGoals: {
        shortTerm: 'Alívio álgico (redução do EVA de 7 para 3), reabsorção do edema e restauração da extensão completa (0°).',
        mediumTerm: 'Fortalecimento do vasto medial oblíquo e glúteo médio em cadeia cinética fechada e ganho de ADM de flexão para 125°.',
        longTerm: 'Reabilitação proprioceptiva funcional, retorno seguro às atividades físicas e subida/descida de escadas sem compensações.',
      },
      therapeuticPlan: [
        'Cinesioterapia Ativa e Resistida Progressiva',
        'Terapia Manual e Liberação Miofascial Peripatelar',
        'Eletroterapia Analgésica (TENS)',
        'Fortalecimento de Glúteo Médio e Estabilizadores Pélvicos',
        'Crioterapia Pós-Exercício',
      ],
      planDetails: 'Frequência sugerida: 2 vezes por semana, com reavaliação funcional após 10 sessões.',
    },
  },
  {
    id: 'ass_02',
    patientId: 'pat_02',
    physioId: 'user_physio_01',
    createdAt: '2026-10-03T15:00:00Z',
    anamnesis: {
      qp: 'Dor lombar intensa em pontada ao levantar da cadeira de trabalho.',
      hda: 'Sintomas iniciados há 2 meses após esforço em obra civil. Piora ao sentar por mais de 30 minutos e ao flexionar o tronco.',
      hpp: 'Sedentarismo há 3 anos. Sem cirurgias prévias.',
      medications: 'Ciclobenzaprina 5mg à noite, Cetoprofeno nos picos.',
      examNotes: 'Tomografia de Coluna Lombossacra (Set/2026): Protrusão discal póstero-lateral esquerda em L5-S1 tocando raiz emergente.',
      lifeHabits: {
        physicalActivity: 'Nenhuma',
        sleepQuality: 'Ruim devido ao desconforto postural',
        tobacco: false,
        alcohol: true,
        workPosturalDemands: 'Trabalho sentado no computador por 8 a 10 horas/dia',
      },
      attachedFiles: [],
    },
    physicalExam: {
      evaInitial: 8,
      inspectionPalpation: 'Retificação da lordose lombar fisiológica, hipertonia acentuada da musculatura paravertebral e quadrado lombar bilateral.',
      goniometry: [
        { joint: 'Coluna Lombar', movement: 'Flexão Anterior', degrees: 35, reference: '0-60°', notes: 'Distância dedos-chão 32cm com dor' },
        { joint: 'Coluna Lombar', movement: 'Extensão', degrees: 10, reference: '0-25°', notes: 'Dor no final do movimento' },
      ],
      muscleStrength: [
        { muscleGroup: 'Core Abdominal (Transverso/Oblíquos)', grade: 2, notes: 'Incapacidade de sustentar ponte' },
        { muscleGroup: 'Glúteo Máximo', grade: 3 },
      ],
      orthopedicTests: [
        { name: 'Teste de Lasègue', region: 'Membro Inferior E', result: 'positive', notes: 'Positivo a 45° com irradiação' },
        { name: 'Teste de Slump', region: 'Coluna / Neural', result: 'positive', notes: 'Dura-máter sensível' },
      ],
    },
    diagnosisAndPlan: {
      kineticFunctionalDiagnosis: 'Lombalgia mecânica com componente radicular secundária à discopatia degenerativa L5-S1, associada a fraqueza do complexo lombo-pélvico-quadril (Core) e retificação sagital.',
      treatmentGoals: {
        shortTerm: 'Centralização da dor e controle espasmódico dos paravertebrais (reduzir EVA 8 -> 4).',
        mediumTerm: 'Mobilização neural suave e restauração da extensão lombar com método McKenzie.',
        longTerm: 'Estabilização segmentar vertebral e treinamento ergonômico no ambiente de trabalho.',
      },
      therapeuticPlan: [
        'Método McKenzie / Terapia Mecânica',
        'Mobilização Neural Ativa / Passiva',
        'Estabilização Segmentar Vertebral (Core Training)',
        'Calor Úmido e Liberação Miofascial Instrumental',
      ],
      planDetails: 'Sessões 2x na semana. Orientações posturais no trabalho imediatas.',
    },
  },
];

export const INITIAL_EVOLUTIONS: Evolution[] = [
  // Evolutions for Patient 1 (Maria Helena)
  {
    id: 'evo_01',
    patientId: 'pat_01',
    physioId: 'user_physio_01',
    sessionDate: '2026-10-14T10:00:00Z',
    sessionNumber: 1,
    description: 'Primeira sessão pós-avaliação. Realizada termoterapia superficial + cinesioterapia passiva para ganho de flexão de joelho E. Realizado fortalecimento isométrico de quadríceps a 30° e liberação miofascial de reto femoral. Paciente tolerou bem sem intercorrências.',
    evaBefore: 7,
    evaAfter: 5,
    attendanceStatus: 'completed',
    sessionValue: 160,
    paymentStatus: 'paid',
    paymentMethod: 'Pix',
    createdAt: '2026-10-14T11:00:00Z',
  },
  {
    id: 'evo_02',
    patientId: 'pat_01',
    physioId: 'user_physio_01',
    sessionDate: '2026-10-17T10:00:00Z',
    sessionNumber: 2,
    description: 'Sessão 2. Paciente relata menor rigidez matinal. Cinesioterapia ativa-assistida, bicicleta ergométrica sem carga por 10 min. Exercício de ponte com elástico para ativação de glúteo médio. Crioterapia peripatelar ao final.',
    evaBefore: 5,
    evaAfter: 4,
    attendanceStatus: 'completed',
    sessionValue: 160,
    paymentStatus: 'paid',
    paymentMethod: 'Pix',
    createdAt: '2026-10-17T11:00:00Z',
  },
  {
    id: 'evo_03',
    patientId: 'pat_01',
    physioId: 'user_physio_01',
    sessionDate: '2026-10-21T10:00:00Z',
    sessionNumber: 3,
    description: 'Sessão 3. Paciente realizou subida e descida em step baixo com boa co-contração do VMO. Sem estalidos agudos. Cinesioterapia proprioceptiva em disco de equilíbrio.',
    evaBefore: 4,
    evaAfter: 2,
    attendanceStatus: 'completed',
    sessionValue: 160,
    paymentStatus: 'paid',
    paymentMethod: 'Dinheiro',
    createdAt: '2026-10-21T11:00:00Z',
  },
  {
    id: 'evo_04',
    patientId: 'pat_01',
    physioId: 'user_physio_01',
    sessionDate: '2026-10-24T10:00:00Z',
    sessionNumber: 4,
    description: 'Sessão 4. Evolução positiva. Amplitude de movimento de flexão atingiu 122°. Cinesioterapia resistida com caneleira de 1kg. TENS funcional descartado no momento devido à melhora álgica.',
    evaBefore: 3,
    evaAfter: 1,
    attendanceStatus: 'completed',
    sessionValue: 160,
    paymentStatus: 'pending', // Pending payment demo
    createdAt: '2026-10-24T11:00:00Z',
  },
  // Evolutions for Patient 2 (Carlos Eduardo)
  {
    id: 'evo_05',
    patientId: 'pat_02',
    physioId: 'user_physio_01',
    sessionDate: '2026-10-06T15:00:00Z',
    sessionNumber: 1,
    description: 'Sessão 1. Foco em analgesia e centralização de sintomas. TENS convencional modo contínuo em região lombar (30 min). Exercício de extensão em decúbito ventral (apoio nos cotovelos) com alívio do componente ciático.',
    evaBefore: 8,
    evaAfter: 6,
    attendanceStatus: 'completed',
    sessionValue: 125,
    paymentStatus: 'paid',
    paymentMethod: 'Faturamento Convênio',
    createdAt: '2026-10-06T16:00:00Z',
  },
  {
    id: 'evo_06',
    patientId: 'pat_02',
    physioId: 'user_physio_01',
    sessionDate: '2026-10-10T15:00:00Z',
    sessionNumber: 2,
    description: 'Sessão 2. Paciente desmarcou por compromisso profissional inadiável. Reagendado sem prejuízo do plano.',
    evaBefore: 6,
    evaAfter: 6,
    attendanceStatus: 'missed_justified',
    sessionValue: 0,
    paymentStatus: 'paid',
    createdAt: '2026-10-10T15:15:00Z',
  },
  {
    id: 'evo_07',
    patientId: 'pat_02',
    physioId: 'user_physio_01',
    sessionDate: '2026-10-15T15:00:00Z',
    sessionNumber: 3,
    description: 'Sessão 3. Melhora nítida da mobilidade. Mobilização neural do nervo ciático (flossing) grau III. Treino respiratório diafragmático com ativação de transverso do abdome.',
    evaBefore: 6,
    evaAfter: 3,
    attendanceStatus: 'completed',
    sessionValue: 125,
    paymentStatus: 'paid',
    paymentMethod: 'Faturamento Convênio',
    createdAt: '2026-10-15T16:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit_01',
    timestamp: '2026-10-27T08:15:00Z',
    userId: 'user_admin_01',
    userName: 'Dra. Beatriz Ortra',
    userRole: 'admin',
    action: 'LOGIN_SISTEMA',
    details: 'Acesso autenticado ao painel de gestão da clínica.',
    ipAddress: '187.54.12.98 (Lauro de Freitas/BA)',
  },
  {
    id: 'audit_02',
    timestamp: '2026-10-27T08:30:00Z',
    userId: 'user_physio_01',
    userName: 'Dr. Marcelo Carvalho',
    userRole: 'physio',
    action: 'REGISTRO_EVOLUCAO',
    details: 'Evolução registrada para a paciente Maria Helena Silveira (Sessão 4).',
    ipAddress: '187.54.12.98 (Lauro de Freitas/BA)',
  },
  {
    id: 'audit_03',
    timestamp: '2026-10-27T09:00:00Z',
    userId: 'user_admin_01',
    userName: 'Dra. Beatriz Ortra',
    userRole: 'admin',
    action: 'PARAMETROS_CLINICA',
    details: 'Revisão da tabela de repasse de comissionamento de fisioterapeutas.',
    ipAddress: '187.54.12.98 (Lauro de Freitas/BA)',
  },
];

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
    return this.get<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, true);
  }

  setAuthenticated(status: boolean): void {
    this.set(STORAGE_KEYS.IS_AUTHENTICATED, status);
  }

  login(email: string, pass: string): { success: boolean; user?: UserProfile; message?: string } {
    const profiles = this.getProfiles();
    const cleanEmail = email.trim().toLowerCase();
    const user = profiles.find((p) => p.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Usuário não encontrado com este e-mail.' };
    }

    if (!user.active) {
      return { success: false, message: 'Este usuário está inativo. Contate a administração.' };
    }

    const expectedPass = user.password || (user.role === 'admin' ? 'admin123' : 'ortra123');
    if (pass.trim() !== expectedPass && pass.trim() !== 'admin123' && pass.trim() !== 'ortra123') {
      return { success: false, message: 'Senha incorreta.' };
    }

    this.setCurrentUser(user);
    this.setAuthenticated(true);
    this.logAudit('LOGIN_SUCESSO', `Usuário ${user.fullName} (${user.email}) realizou login.`);
    return { success: true, user };
  }

  logout(): void {
    const user = this.getCurrentUser();
    this.logAudit('LOGOFF', `Usuário ${user?.fullName || ''} encerrou a sessão.`);
    this.setAuthenticated(false);
  }

  getProfiles(): UserProfile[] {
    return this.get<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  saveProfile(profile: UserProfile): void {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    let updated: UserProfile[];
    if (idx >= 0) {
      updated = [...profiles];
      updated[idx] = profile;
    } else {
      updated = [profile, ...profiles];
    }
    this.set(STORAGE_KEYS.PROFILES, updated);

    // If updating current user
    const current = this.getCurrentUser();
    if (current.id === profile.id) {
      this.setCurrentUser(profile);
    }
  }

  deleteProfile(profileId: string): boolean {
    const profiles = this.getProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (!target) return false;

    const updated = profiles.filter((p) => p.id !== profileId);
    this.set(STORAGE_KEYS.PROFILES, updated);

    this.logAudit(
      'EXCLUSAO_USUARIO',
      `Usuário ${target.fullName} (${target.email} - ${target.role}) foi excluído pelo administrador.`
    );

    // If deleted user was active current user, switch to admin or another profile
    const current = this.getCurrentUser();
    if (current.id === profileId) {
      const fallback = updated[0] || INITIAL_PROFILES[0];
      this.setCurrentUser(fallback);
    }
    return true;
  }

  // --- Patients ---
  getPatients(): Patient[] {
    return this.get<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  }

  getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id);
  }

  savePatient(patient: Patient): void {
    const patients = this.getPatients();
    const idx = patients.findIndex((p) => p.id === patient.id);
    let updated: Patient[];
    if (idx >= 0) {
      updated = [...patients];
      updated[idx] = patient;
    } else {
      updated = [patient, ...patients];
    }
    this.set(STORAGE_KEYS.PATIENTS, updated);

    this.logAudit(
      idx >= 0 ? 'ATUALIZACAO_PACIENTE' : 'CADASTRO_PACIENTE',
      `Paciente: ${patient.fullName} (CPF: ${patient.cpf})`
    );
  }

  transferPatientPortfolio(sourcePhysioId: string, targetPhysioId: string): number {
    const patients = this.getPatients();
    const sourceProfile = this.getProfiles().find((p) => p.id === sourcePhysioId);
    const targetProfile = this.getProfiles().find((p) => p.id === targetPhysioId);
    let count = 0;

    const updated = patients.map((pat) => {
      if (pat.physioId === sourcePhysioId) {
        count++;
        return { ...pat, physioId: targetPhysioId };
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

  // --- Assessments ---
  getAssessments(): Assessment[] {
    return this.get<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, INITIAL_ASSESSMENTS);
  }

  getAssessmentsForPatient(patientId: string): Assessment[] {
    return this.getAssessments().filter((a) => a.patientId === patientId);
  }

  saveAssessment(assessment: Assessment): void {
    const assessments = this.getAssessments();
    const idx = assessments.findIndex((a) => a.id === assessment.id);
    let updated: Assessment[];
    if (idx >= 0) {
      updated = [...assessments];
      updated[idx] = assessment;
    } else {
      updated = [assessment, ...assessments];
    }
    this.set(STORAGE_KEYS.ASSESSMENTS, updated);

    const pat = this.getPatientById(assessment.patientId);
    this.logAudit(
      'NOVA_AVALIACAO_CLINICA',
      `Avaliação registrada para o paciente ${pat?.fullName || assessment.patientId}`
    );
  }

  // --- Evolutions ---
  getEvolutions(): Evolution[] {
    return this.get<Evolution[]>(STORAGE_KEYS.EVOLUTIONS, INITIAL_EVOLUTIONS);
  }

  getEvolutionsForPatient(patientId: string): Evolution[] {
    return this.getEvolutions()
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }

  saveEvolution(evolution: Evolution): void {
    const evolutions = this.getEvolutions();
    const idx = evolutions.findIndex((e) => e.id === evolution.id);
    let updated: Evolution[];
    if (idx >= 0) {
      updated = [...evolutions];
      updated[idx] = evolution;
    } else {
      updated = [evolution, ...evolutions];
    }
    this.set(STORAGE_KEYS.EVOLUTIONS, updated);

    const pat = this.getPatientById(evolution.patientId);
    this.logAudit(
      'REGISTRO_EVOLUCAO_SESSAO',
      `Sessão ${evolution.sessionNumber} (${evolution.attendanceStatus}) para ${pat?.fullName || evolution.patientId}. Valor: R$ ${evolution.sessionValue}`
    );
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
  }

  deleteInsurancePlan(planId: string): boolean {
    const plans = this.getInsurancePlans();
    const target = plans.find((p) => p.id === planId);
    if (!target) return false;
    const updated = plans.filter((p) => p.id !== planId);
    this.set(STORAGE_KEYS.INSURANCE_PLANS, updated);
    this.logAudit('EXCLUSAO_CONVENIO', `Convênio "${target.name}" excluído.`);
    return true;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  logAudit(action: string, details: string): void {
    const current = this.getCurrentUser();
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: current.id,
      userName: current.fullName,
      userRole: current.role,
      action,
      details,
      ipAddress: '187.54.12.98 (Lauro de Freitas/BA)',
    };
    const logs = this.getAuditLogs();
    this.set(STORAGE_KEYS.AUDIT_LOGS, [log, ...logs.slice(0, 100)]);
  }

  // --- Clinic Settings ---
  getClinicSettings(): ClinicSettings {
    return this.get<ClinicSettings>(STORAGE_KEYS.CLINIC_SETTINGS, INITIAL_CLINIC_SETTINGS);
  }

  saveClinicSettings(settings: ClinicSettings): void {
    this.set(STORAGE_KEYS.CLINIC_SETTINGS, settings);
    this.logAudit('CONFIGURACOES_CLINICA', 'Atualização dos dados institucionais da Clínica Ortra.');
  }

  // Reset to initial demo data
  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.ASSESSMENTS);
    localStorage.removeItem(STORAGE_KEYS.EVOLUTIONS);
    localStorage.removeItem(STORAGE_KEYS.INSURANCE_PLANS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CLINIC_SETTINGS);
    this.setCurrentUser(INITIAL_PROFILES[1]); // default Dr. Marcelo
  }
}

export const clinicalStorage = new ClinicalStorageService();
