/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Building,
  KeyRound,
  UserPlus,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Check,
  X,
  UploadCloud,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import {
  UserProfile,
  HealthInsurancePlan,
  AuditLog,
  ClinicSettings,
  Patient,
} from '../types/index.ts';
import { clinicalStorage, generateUUID } from '../services/storageService.ts';
import { supabase } from '../services/supabaseClient.ts';
import {
  formatCurrencyBRL,
  formatPhysioDisplayName,
  getPersonInitials,
  getCleanPersonName,
} from '../utils/clinicalCalculations.ts';

interface AdminPanelProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  patients: Patient[];
  onProfilesUpdated: () => void;
  onPatientsUpdated: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  profiles,
  patients,
  onProfilesUpdated,
  onPatientsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<
    'physios' | 'transfer' | 'insurance' | 'settings' | 'audit'
  >('physios');

  // New User Form
  const [isAddingPhysio, setIsAddingPhysio] = useState(false);
  const [newUserRole, setNewUserRole] = useState<'physio' | 'receptionist' | 'admin'>('physio');
  const [physioName, setPhysioName] = useState('');
  const [physioGender, setPhysioGender] = useState<'M' | 'F'>('M');
  const [physioIsAdmin, setPhysioIsAdmin] = useState(false);
  const [physioEmail, setPhysioEmail] = useState('');
  const [physioPhone, setPhysioPhone] = useState('');
  const [physioCrefito, setPhysioCrefito] = useState('CREFITO-');
  const [physioCommission, setPhysioCommission] = useState(60);
  const [physioPassword, setPhysioPassword] = useState('Ortra@123456');
  const [showPhysioPassword, setShowPhysioPassword] = useState(false);
  const [isSavingPhysio, setIsSavingPhysio] = useState(false);
  const [physioError, setPhysioError] = useState<string | null>(null);
  const [physioSqlFix, setPhysioSqlFix] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [tempPasswordNotice, setTempPasswordNotice] = useState<{
    email: string;
    tempPass: string;
  } | null>(null);

  // User Deletion Modal / Confirm
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Transfer Portfolio Form
  const [sourcePhysioId, setSourcePhysioId] = useState('');
  const [targetPhysioId, setTargetPhysioId] = useState('');
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  // Insurance Plans Management
  const [plans, setPlans] = useState<HealthInsurancePlan[]>(() =>
    clinicalStorage.getInsurancePlans()
  );
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<HealthInsurancePlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planValue, setPlanValue] = useState(120);
  const [planLogoUrl, setPlanLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Settings
  const [settings, setSettings] = useState<ClinicSettings>(() =>
    clinicalStorage.getClinicSettings()
  );
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Audit Logs
  const auditLogs: AuditLog[] = clinicalStorage.getAuditLogs();

  // Create new user (physio, receptionist, or admin) directly via Supabase database
  const handleCreatePhysio = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhysioError(null);
    setPhysioSqlFix(null);
    const cleanName = getCleanPersonName(physioName);
    if (!cleanName || !physioEmail.trim()) {
      return;
    }
    if (newUserRole === 'physio' && !physioCrefito.trim()) {
      return;
    }

    setIsSavingPhysio(true);
    try {
      const tempPassword = physioPassword.trim() || `Ortra@${Math.floor(100000 + Math.random() * 900000)}`;
      const newProfile: UserProfile = {
        id: generateUUID(),
        fullName: cleanName,
        gender: physioGender,
        isAdmin: newUserRole === 'admin' || physioIsAdmin,
        password: tempPassword,
        email: physioEmail.trim().toLowerCase(),
        phone: physioPhone.trim(),
        crefito: newUserRole === 'physio' ? physioCrefito.trim() : undefined,
        role: newUserRole,
        commissionRate: newUserRole === 'physio' ? (Number(physioCommission) || 60) : 0,
        mustChangePassword: true,
        hasCompletedTour: false,
        active: true,
        createdAt: new Date().toISOString(),
      };

      const res = await clinicalStorage.saveProfile(newProfile, true);
      if (!res.success) {
        if (res.sqlFix) {
          setPhysioSqlFix(res.sqlFix);
          setPhysioError(res.error || 'A tabela profiles possui restrição de chave estrangeira.');
          onProfilesUpdated();
        } else {
          setPhysioError(`Erro ao salvar usuário no Supabase: ${res.error || 'Falha de gravação'}`);
        }
        setIsSavingPhysio(false);
        return;
      }

      clinicalStorage.logAudit(
        'CADASTRO_USUARIO',
        `Usuário cadastrado na base Supabase: ${formatPhysioDisplayName(newProfile)} (${newUserRole === 'receptionist' ? 'Recepção' : newUserRole === 'admin' ? 'Administrador' : newProfile.crefito}). Gerada senha provisória.`
      );

      setTempPasswordNotice({
        email: newProfile.email,
        tempPass: tempPassword,
      });

      setPhysioName('');
      setPhysioGender('M');
      setNewUserRole('physio');
      setPhysioIsAdmin(false);
      setPhysioEmail('');
      setPhysioPhone('');
      setPhysioCrefito('CREFITO-');
      setPhysioCommission(60);
      setPhysioPassword(`Ortra@${Math.floor(100000 + Math.random() * 900000)}`);
      setIsAddingPhysio(false);
      onProfilesUpdated();
    } catch (err: any) {
      setPhysioError(err?.message || 'Falha ao registrar novo profissional');
    } finally {
      setIsSavingPhysio(false);
    }
  };

  // Toggle active status
  const handleTogglePhysioStatus = (p: UserProfile) => {
    const updated = { ...p, active: !p.active };
    clinicalStorage.saveProfile(updated);
    clinicalStorage.logAudit(
      updated.active ? 'ATIVACAO_PROFISSIONAL' : 'INATIVACAO_PROFISSIONAL',
      `Status do profissional ${formatPhysioDisplayName(p)} alterado para ${updated.active ? 'Ativo' : 'Inativo'}`
    );
    onProfilesUpdated();
  };

  // Delete User Confirmation
  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    clinicalStorage.deleteProfile(userToDelete.id);
    setUserToDelete(null);
    onProfilesUpdated();
    onPatientsUpdated();
  };

  // Reset temporary password
  const handleResetPassword = (p: UserProfile) => {
    const tempPass = `Ortra@${Math.floor(100000 + Math.random() * 900000)}`;
    const updated = { ...p, mustChangePassword: true, password: tempPass };
    clinicalStorage.saveProfile(updated);
    clinicalStorage.logAudit(
      'RESET_SENHA_ADMIN',
      `Senha provisória gerada para ${formatPhysioDisplayName(p)} (${p.email}). Troca obrigatória ativada.`
    );
    setTempPasswordNotice({
      email: p.email,
      tempPass,
    });
    onProfilesUpdated();
  };

  // Transfer patient portfolio
  const handleTransfer = () => {
    if (!sourcePhysioId || !targetPhysioId || sourcePhysioId === targetPhysioId) {
      return;
    }
    const count = clinicalStorage.transferPatientPortfolio(sourcePhysioId, targetPhysioId);
    onPatientsUpdated();
    setTransferMessage(`Sucesso! ${count} pacientes foram transferidos com integridade de prontuário.`);
    setTimeout(() => setTransferMessage(null), 5000);
  };

  // Upload logo to Supabase configs bucket
  const handleUploadPlanLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `convenios/${Date.now()}_${sanitizedName}`;

      const { error } = await supabase.storage
        .from('configs')
        .upload(storagePath, file, { upsert: true });

      if (error) {
        console.warn('Erro ao enviar imagem para o bucket configs:', error.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('configs')
        .getPublicUrl(storagePath);

      if (publicUrlData?.publicUrl) {
        setPlanLogoUrl(publicUrlData.publicUrl);
      }
    } catch (err: any) {
      console.error('Falha no upload do logo:', err);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Open Edit Plan
  const startEditPlan = (plan: HealthInsurancePlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanValue(plan.baseSessionValue);
    setPlanLogoUrl(plan.logoUrl || '');
    setIsAddingPlan(true);
  };

  // Save Plan (Create or Update)
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    const planToSave: HealthInsurancePlan = {
      id: editingPlan ? editingPlan.id : `plan_${Date.now()}`,
      name: planName.trim(),
      baseSessionValue: Number(planValue) || 120,
      paymentTermDays: editingPlan ? editingPlan.paymentTermDays : 30,
      active: true,
      logoUrl: planLogoUrl.trim() || undefined,
    };

    clinicalStorage.saveInsurancePlan(planToSave);
    setPlans(clinicalStorage.getInsurancePlans());
    setPlanName('');
    setPlanValue(120);
    setPlanLogoUrl('');
    setEditingPlan(null);
    setIsAddingPlan(false);
  };

  // Delete Plan
  const handleDeletePlan = (planId: string) => {
    if (confirm('Deseja realmente remover esta tabela de convênio?')) {
      clinicalStorage.deleteInsurancePlan(planId);
      setPlans(clinicalStorage.getInsurancePlans());
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    clinicalStorage.saveClinicSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-400" />
            <h1 className="text-base sm:text-lg font-bold">Painel Administrativo</h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
            Gestão de equipe clínica, comissionamentos, transferência de carteira, convênios e conformidade LGPD.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingPhysio(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Cadastrar Novo Fisioterapeuta</span>
        </button>
      </div>

      {/* Temp Password Notice Popup */}
      {tempPasswordNotice && (
        <div className="rounded-xl border border-teal-300 bg-teal-50 p-3 sm:p-4 text-xs text-teal-900 flex items-start justify-between shadow-xs">
          <div className="space-y-1.5">
            <span className="font-bold text-sm block flex items-center gap-1.5 text-teal-800">
              <CheckCircle className="h-4 w-4 text-teal-700" />
              Usuário Registrado com Sucesso no Supabase Authentication
            </span>
            <p>
              E-mail do Profissional: <strong>{tempPasswordNotice.email}</strong>
            </p>
            <p>
              Senha Provisória de Acesso:{' '}
              <code className="bg-teal-200/60 px-2 py-0.5 rounded font-mono font-bold text-slate-900">
                {tempPasswordNotice.tempPass}
              </code>
            </p>
            <p className="text-[11px] text-teal-800/90 leading-relaxed">
              O usuário foi registrado na base de autenticação (<code>auth.users</code>) e vinculado à tabela de perfis (<code>public.profiles</code>).
            </p>
            <p className="text-[11px] text-slate-600">
              No primeiro acesso, o sistema solicitará a troca para uma senha pessoal definitiva.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTempPasswordNotice(null)}
            className="text-teal-700 hover:text-teal-900 font-bold px-2 py-1 text-xs"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Navigation Tabs (Single line with smooth horizontal scroll) */}
      <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2 border-b border-slate-200 pb-2 -mx-1 px-1">
        <button
          type="button"
          onClick={() => setActiveTab('physios')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'physios'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Fisioterapeutas & Comissões ({profiles.filter((p) => p.role === 'physio').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transfer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'transfer'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>Transferência de Carteira</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('insurance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'insurance'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>Convênios & Tabelas ({plans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Dados Institucionais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Auditoria LGPD</span>
        </button>
      </div>

      {/* Tab 1: Fisioterapeutas & Comissões */}
      {activeTab === 'physios' && (
        <div className="space-y-4">
          {/* Add Physio Form */}
          {isAddingPhysio && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                <h3 className="text-xs sm:text-sm font-bold text-teal-950 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-teal-700" />
                  <span>Cadastrar Novo Fisioterapeuta</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPhysio(false);
                    setPhysioCrefito('CREFITO-');
                    setPhysioError(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              {physioError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">{physioError}</p>
                      {physioSqlFix && (
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Para liberar o cadastro de novos usuários no <code>auth.users</code> do Supabase, execute o script abaixo no <strong>SQL Editor</strong> do painel Supabase:
                        </p>
                      )}
                    </div>
                  </div>

                  {physioSqlFix && (
                    <div className="bg-slate-900 rounded-lg p-3 space-y-2 shadow-inner">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-mono text-teal-400 font-bold">SQL Editor Script</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(physioSqlFix);
                            setCopiedSql(true);
                            setTimeout(() => setCopiedSql(false), 2500);
                          }}
                          className="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white font-sans text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                        >
                          {copiedSql ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copiar Script SQL</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-teal-300 font-mono text-[11px] select-all whitespace-pre-wrap overflow-x-auto max-h-48 leading-relaxed">
                        {physioSqlFix}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleCreatePhysio} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  <div>
                    <label htmlFor="new-user-role" className="block text-xs font-semibold text-slate-700 mb-1">
                      Função no Sistema *
                    </label>
                    <select
                      id="new-user-role"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    >
                      <option value="physio">Fisioterapeuta Clínico</option>
                      <option value="receptionist">Recepção / Organização da Agenda</option>
                      <option value="admin">Administrador Geral</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="new-physio-name" className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo (sem Dr/Dra) *
                    </label>
                    <input
                      id="new-physio-name"
                      type="text"
                      required
                      placeholder={newUserRole === 'receptionist' ? 'Ex: Juliana Santana' : 'Ex: Marcelo Carvalho'}
                      value={physioName}
                      onChange={(e) => setPhysioName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="new-physio-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                      Sexo / Tratamento *
                    </label>
                    <select
                      id="new-physio-gender"
                      value={physioGender}
                      onChange={(e) => setPhysioGender(e.target.value as 'M' | 'F')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="M">Masculino {newUserRole === 'physio' ? '(Dr.)' : ''}</option>
                      <option value="F">Feminino {newUserRole === 'physio' ? '(Dra.)' : ''}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="new-physio-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail Institucional *
                    </label>
                    <input
                      id="new-physio-email"
                      type="email"
                      required
                      placeholder="nome@ortra.com.br"
                      value={physioEmail}
                      onChange={(e) => setPhysioEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="new-physio-password" className="block text-xs font-semibold text-slate-700">
                        Senha Inicial de Acesso *
                      </label>
                      <button
                        type="button"
                        onClick={() => setPhysioPassword(`Ortra@${Math.floor(100000 + Math.random() * 900000)}`)}
                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                        title="Gerar nova senha aleatória"
                      >
                        <RefreshCw className="h-3 w-3" /> Gerar Nova
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="new-physio-password"
                        type={showPhysioPassword ? 'text' : 'password'}
                        required
                        value={physioPassword}
                        onChange={(e) => setPhysioPassword(e.target.value)}
                        placeholder="Ex: Ortra@123456"
                        className="w-full rounded-lg border border-slate-300 bg-white pl-2.5 pr-8 py-1.5 text-xs text-slate-900 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPhysioPassword(!showPhysioPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title={showPhysioPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showPhysioPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {newUserRole === 'physio' && (
                    <>
                      <div>
                        <label htmlFor="new-physio-crefito" className="block text-xs font-semibold text-slate-700 mb-1">
                          CREFITO *
                        </label>
                        <input
                          id="new-physio-crefito"
                          type="text"
                          required
                          placeholder="CREFITO-7/12345-F"
                          value={physioCrefito}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('CREFITO-')) {
                              const suffix = val.replace(/^C?R?E?F?I?T?O?-?/i, '');
                              val = 'CREFITO-' + suffix;
                            }
                            setPhysioCrefito(val);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label htmlFor="new-physio-comm" className="block text-xs font-semibold text-slate-700 mb-1">
                          Taxa de Repasse (%)
                        </label>
                        <input
                          id="new-physio-comm"
                          type="number"
                          min={0}
                          max={100}
                          value={physioCommission}
                          onChange={(e) => setPhysioCommission(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                          <input
                            type="checkbox"
                            checked={physioIsAdmin}
                            onChange={(e) => setPhysioIsAdmin(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span>Conceder também perfil Administrador (Fisio & Admin)</span>
                        </label>
                      </div>
                    </>
                  )}

                  {newUserRole === 'receptionist' && (
                    <div className="col-span-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                      <strong>Perfil Recepção / Atendimento:</strong> Acesso focado exclusivamente na organização da agenda de todos os profissionais. Não possui acesso aos prontuários clínicos dos pacientes nem às áreas administrativas e financeiras da clínica.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSavingPhysio}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg shadow-sm transition-colors"
                  >
                    {isSavingPhysio && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{isSavingPhysio ? 'Gravando no Supabase...' : 'Salvar no Banco e Emitir Senha'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Physios */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Profissional</th>
                    <th className="py-2.5 px-3">CREFITO</th>
                    <th className="py-2.5 px-3">Senha de Acesso</th>
                    <th className="py-2.5 px-3">Repasse</th>
                    <th className="py-2.5 px-3">Pacientes</th>
                    <th className="py-2.5 px-3">Função</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((p) => {
                    const activePats = patients.filter((pat) => pat.physioId === p.id);
                    const initial = getPersonInitials(p.fullName);
                    const displayName = formatPhysioDisplayName(p);
                    const isRec = p.role === 'receptionist';
                    const isPureAdmin = p.role === 'admin';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-lg border font-black text-xs uppercase shrink-0 ${
                                isRec
                                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                                  : isPureAdmin
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-teal-50 border-teal-200 text-teal-800'
                              }`}
                            >
                              {initial}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{displayName}</span>
                              <span className="text-[10px] text-slate-400">{p.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {isRec ? '-' : p.crefito || 'CREFITO-7'}
                        </td>

                        <td className="py-2.5 px-3">
                          <code
                            className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 select-all"
                            title="Senha de acesso deste usuário"
                          >
                            {p.password || '******'}
                          </code>
                        </td>

                        <td className="py-2.5 px-3">
                          {isRec ? (
                            <span className="text-slate-400 text-xs">-</span>
                          ) : (
                            <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[11px]">
                              {p.commissionRate}%
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {isRec ? '-' : activePats.length}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            {isRec && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                Recepção / Agenda
                              </span>
                            )}
                            {isPureAdmin && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Administrador
                              </span>
                            )}
                            {p.role === 'physio' && (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                Fisio
                              </span>
                            )}
                            {p.role === 'physio' && p.isAdmin && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Admin
                              </span>
                            )}
                          </div>
                        </td>

                          <td className="py-2.5 px-3">
                            {p.active ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Ativo</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-slate-400 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <span>Inativo</span>
                              </span>
                            )}
                          </td>

                          {/* Standardized Action Buttons with Same Width and Vertical Spacing */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleResetPassword(p)}
                                title="Gerar nova senha provisória"
                                className="w-20 py-1 text-center text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded shadow-2xs transition-colors"
                              >
                                Nova Senha
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTogglePhysioStatus(p)}
                                className={`w-20 py-1 text-center text-[10px] font-bold rounded shadow-2xs transition-colors ${
                                  p.active
                                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                              >
                                {p.active ? 'Inativar' : 'Reativar'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setUserToDelete(p)}
                                title="Excluir este fisioterapeuta"
                                className="w-20 py-1 text-center text-[10px] font-bold text-rose-700 bg-rose-100/70 hover:bg-rose-200 rounded shadow-2xs transition-colors"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete User */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirmar Exclusão de Usuário</h3>
                <p className="text-xs text-slate-500">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Tem certeza que deseja excluir o usuário <strong>{formatPhysioDisplayName(userToDelete)}</strong> ({userToDelete.email})?
              {patients.some((pat) => pat.physioId === userToDelete.id) && (
                <span className="block mt-1 text-amber-700 font-semibold">
                  Atenção: Este profissional possui pacientes vinculados. Recomendamos transferir a carteira na aba Transferência antes de excluir.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Sim, Excluir Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Transferência de Carteira */}
      {activeTab === 'transfer' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-teal-700" />
              <span>Transferência de Carteira de Pacientes</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Preserva os prontuários e transfere a assistência clínica ativa para outro profissional.
            </p>
          </div>

          {transferMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>{transferMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label htmlFor="source-physio-select" className="block text-xs font-semibold text-slate-700">
                1. Profissional de Origem
              </label>
              <select
                id="source-physio-select"
                value={sourcePhysioId}
                onChange={(e) => setSourcePhysioId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
              >
                <option value="">Selecione o profissional de origem...</option>
                {profiles
                  .filter((p) => p.role === 'physio')
                  .map((p) => {
                    const count = patients.filter((pat) => pat.physioId === p.id).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {formatPhysioDisplayName(p)} ({p.active ? 'Ativo' : 'Inativo'}) - {count} pacientes vinculados
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="target-physio-select" className="block text-xs font-semibold text-slate-700">
                2. Profissional de Destino
              </label>
              <select
                id="target-physio-select"
                value={targetPhysioId}
                onChange={(e) => setTargetPhysioId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
              >
                <option value="">Selecione o fisioterapeuta ativo de destino...</option>
                {profiles
                  .filter((p) => p.role === 'physio' && p.active && p.id !== sourcePhysioId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPhysioDisplayName(p)} ({p.crefito})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!sourcePhysioId || !targetPhysioId}
              onClick={handleTransfer}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm transition-colors disabled:opacity-40"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Confirmar Transferência</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Convênios & Tabelas com Edição e Logo */}
      {activeTab === 'insurance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Planos de Saúde, Tabelas e Logotipos
              </h2>
              <p className="text-[11px] text-slate-500">
                A alteração de valores de tabela afeta novos atendimentos. O registro na base de dados das sessões passadas permanece com o valor histórico preservado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setPlanName('');
                setPlanValue(120);
                setPlanLogoUrl('');
                setIsAddingPlan(!isAddingPlan);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Convênio</span>
            </button>
          </div>

          {/* Form to Add / Edit Plan */}
          {isAddingPlan && (
            <form
              onSubmit={handleSavePlan}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  {editingPlan ? `Editar Convênio: ${editingPlan.name}` : 'Cadastrar Novo Convênio'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingPlan(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="plan-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Convênio / Modalidade *
                  </label>
                  <input
                    id="plan-name-input"
                    type="text"
                    required
                    placeholder="Ex: Bradesco Saúde, Petrobras"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="plan-val-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Base da Sessão (R$) *
                  </label>
                  <input
                    id="plan-val-input"
                    type="number"
                    min={0}
                    step={5}
                    value={planValue}
                    onChange={(e) => setPlanValue(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Logotipo do Convênio (Upload Bucket Configs)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="plan-logo-file"
                      accept="image/*"
                      onChange={handleUploadPlanLogo}
                      className="hidden"
                    />
                    <label
                      htmlFor="plan-logo-file"
                      className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 text-teal-600 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-3.5 w-3.5 text-teal-700" />
                          <span>Enviar Imagem (configs)</span>
                        </>
                      )}
                    </label>
                  </div>
                  <input
                    id="plan-logo-input"
                    type="url"
                    placeholder="Ou cole o link direto da imagem..."
                    value={planLogoUrl}
                    onChange={(e) => setPlanLogoUrl(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700"
                  />
                </div>
              </div>

              {planLogoUrl && (
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 w-fit">
                  <span className="text-[11px] text-slate-500 font-medium">Prévia do Logo:</span>
                  <img
                    src={planLogoUrl}
                    alt="Logo Prévia"
                    className="h-7 w-auto object-contain max-w-[100px] rounded border border-slate-100"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                  <button
                    type="button"
                    onClick={() => setPlanLogoUrl('')}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                    title="Remover logotipo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-700 rounded-lg hover:bg-teal-800 shadow-sm"
                >
                  {editingPlan ? 'Salvar Alterações' : 'Cadastrar Convênio'}
                </button>
              </div>
            </form>
          )}

          {/* Cards of Plans with Logos and Edit Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {p.logoUrl ? (
                        <img
                          src={p.logoUrl}
                          alt={p.name}
                          className="h-8 w-8 rounded object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Building className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Repasse médio: {p.paymentTermDays} dias
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0">
                      {formatCurrencyBRL(p.baseSessionValue)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => startEditPlan(p)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Editar</span>
                  </button>

                  {p.id !== 'plan_particular' && (
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(p.id)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Dados Institucionais (White-label) */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3"
        >
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-teal-700" />
              <span>Personalização de Documentos e Identidade Institucional</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Esses dados são impressos automaticamente no cabeçalho e rodapé dos prontuários e recibos da Clínica Ortra.
            </p>
          </div>

          {settingsSaved && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Dados institucionais atualizados com sucesso.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="settings-clinic-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Razão Social
              </label>
              <input
                id="settings-clinic-name"
                type="text"
                value={settings.clinicName}
                onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="settings-cnpj" className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ
              </label>
              <input
                id="settings-cnpj"
                type="text"
                value={settings.cnpj}
                onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="settings-address" className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço Completo (Lauro de Freitas - BA)
              </label>
              <input
                id="settings-address"
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="settings-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp da Recepção
              </label>
              <input
                id="settings-phone"
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="settings-tech-resp" className="block text-xs font-semibold text-slate-700 mb-1">
                Responsável Técnico(a) & CREFITO
              </label>
              <input
                id="settings-tech-resp"
                type="text"
                value={`${settings.technicalResponsible} - ${settings.technicalResponsibleCrefito}`}
                onChange={(e) => setSettings({ ...settings, technicalResponsible: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm"
            >
              Salvar Parâmetros Institucionais
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Logs de Auditoria LGPD */}
      {activeTab === 'audit' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Trilha de Auditoria e Conformidade LGPD
              </h2>
              <p className="text-[11px] text-slate-500">
                Registro imutável de acessos, cadastros e alterações no prontuário.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {auditLogs.length} eventos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-3">Data/Hora</th>
                  <th className="py-2 px-3">Usuário</th>
                  <th className="py-2 px-3">Ação</th>
                  <th className="py-2 px-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10px] sm:text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-2 px-3 font-semibold text-teal-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
