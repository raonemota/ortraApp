/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  CreditCard,
  Calendar,
  Phone,
  Briefcase,
  AlertTriangle,
  Building,
  DollarSign,
  HeartPulse,
  Loader2,
} from 'lucide-react';
import { Patient, UserProfile, HealthInsurancePlan } from '../types/index.ts';
import {
  validateCPF,
  formatCPF,
  formatPhone,
  calculateAge,
} from '../utils/clinicalCalculations.ts';
import { clinicalStorage, generateUUID, ensureUUID } from '../services/storageService.ts';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientSaved: (patient: Patient) => void;
  currentUser: UserProfile;
  initialPatient?: Patient | null;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onPatientSaved,
  currentUser,
  initialPatient,
}) => {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [healthInsurance, setHealthInsurance] = useState('Particular');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [defaultSessionValue, setDefaultSessionValue] = useState(160);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const plans: HealthInsurancePlan[] = clinicalStorage.getInsurancePlans();

  useEffect(() => {
    if (initialPatient) {
      setFullName(initialPatient.fullName);
      setCpf(initialPatient.cpf);
      setBirthDate(initialPatient.birthDate);
      setPhone(initialPatient.phone);
      setHealthInsurance(initialPatient.healthInsurance);
      setEmergencyName(initialPatient.emergencyContact?.name || '');
      setEmergencyRelationship(initialPatient.emergencyContact?.relationship || '');
      setEmergencyPhone(initialPatient.emergencyContact?.phone || '');
      setProfession(initialPatient.profession);
      setDefaultSessionValue(initialPatient.defaultSessionValue || 160);
      setNotes(initialPatient.notes || '');
    } else {
      setFullName('');
      setCpf('');
      setBirthDate('');
      setPhone('');
      setHealthInsurance('Particular');
      setEmergencyName('');
      setEmergencyRelationship('');
      setEmergencyPhone('');
      setProfession('');
      setDefaultSessionValue(160);
      setNotes('');
    }
    setError(null);
  }, [initialPatient, isOpen]);

  // Update session value when insurance changes
  const handleInsuranceChange = (selectedName: string) => {
    setHealthInsurance(selectedName);
    const matched = plans.find((p) => p.name === selectedName);
    if (matched) {
      setDefaultSessionValue(matched.baseSessionValue);
    }
  };

  if (!isOpen) return null;

  const currentAge = birthDate ? calculateAge(birthDate) : null;
  const isCpfValid = cpf ? validateCPF(cpf) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Informe o nome completo do paciente.');
      return;
    }

    if (!validateCPF(cpf)) {
      setError('CPF inválido. Por favor, verifique os 11 dígitos informados.');
      return;
    }

    if (!birthDate) {
      setError('Data de nascimento é obrigatória para o prontuário.');
      return;
    }

    const patientData: Patient = {
      id: initialPatient ? initialPatient.id : generateUUID(),
      physioId: ensureUUID(initialPatient ? initialPatient.physioId : currentUser.id),
      fullName: fullName.trim(),
      cpf: formatCPF(cpf),
      birthDate,
      phone: formatPhone(phone),
      healthInsurance,
      emergencyContact: {
        name: emergencyName.trim(),
        relationship: emergencyRelationship.trim(),
        phone: formatPhone(emergencyPhone),
      },
      profession: profession.trim(),
      defaultSessionValue: Number(defaultSessionValue) || 150,
      onboardingChecklist: initialPatient?.onboardingChecklist || {
        consentLgpdSigned: false,
        identificationVerified: false,
        rulesExplained: false,
        firstAssessmentScheduled: false,
      },
      createdAt: initialPatient ? initialPatient.createdAt : new Date().toISOString(),
      notes: notes.trim(),
    };

    setIsSaving(true);
    try {
      const res = await clinicalStorage.savePatient(patientData);
      if (!res.success) {
        setError(`Erro ao salvar paciente na base Supabase: ${res.error || 'Falha de gravação'}`);
        setIsSaving(false);
        return;
      }
      onPatientSaved(patientData);
      onClose();
    } catch (err: any) {
      setError(`Falha inesperada: ${err?.message || 'Erro de rede'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="h-5 w-5 text-teal-400" />
            <div>
              <h2 id="patient-form-title" className="text-base font-bold">
                {initialPatient ? 'Editar Cadastro de Paciente' : 'Cadastro de Paciente'}
              </h2>
              <p className="text-xs text-slate-300">
                Clínica Ortra · Prontuário Fisioterapêutico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dados Pessoais */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <User className="h-4 w-4 text-teal-700" />
              <span>Identificação do Paciente</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label htmlFor="patient-full-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  id="patient-full-name"
                  type="text"
                  required
                  placeholder="Ex: Maria Clara dos Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="patient-cpf" className="block text-xs font-semibold text-slate-700 mb-1">
                  CPF (com validação matemática) *
                </label>
                <div className="relative">
                  <input
                    id="patient-cpf"
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:ring-1 ${
                      cpf && !isCpfValid
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                        : isCpfValid
                        ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-600'
                        : 'border-slate-300 focus:border-teal-600 focus:ring-teal-600'
                    }`}
                  />
                  {cpf && (
                    <span
                      className={`absolute right-3 top-2.5 text-xs font-bold ${
                        isCpfValid ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {isCpfValid ? 'Válido' : 'Inválido'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="patient-birth" className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Nascimento *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="patient-birth"
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                  {currentAge !== null && (
                    <span className="shrink-0 px-2.5 py-2 text-xs font-bold rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                      {currentAge} anos
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="patient-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  id="patient-phone"
                  type="text"
                  required
                  placeholder="(71) 90000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="patient-profession" className="block text-xs font-semibold text-slate-700 mb-1">
                  Profissão / Ocupação
                </label>
                <input
                  id="patient-profession"
                  type="text"
                  placeholder="Ex: Arquiteto, Bancário, Autônomo"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Plano e Financeiro */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Building className="h-4 w-4 text-teal-700" />
              <span>Convênio e Valor de Sessão</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="patient-insurance" className="block text-xs font-semibold text-slate-700 mb-1">
                  Plano / Modalidade *
                </label>
                <select
                  id="patient-insurance"
                  value={healthInsurance}
                  onChange={(e) => handleInsuranceChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (Tabela R$ {p.baseSessionValue})
                    </option>
                  ))}
                  <option value="Outro Convênio">Outro Convênio</option>
                </select>
              </div>

              <div>
                <label htmlFor="patient-session-value" className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Padrão da Sessão (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">R$</span>
                  <input
                    id="patient-session-value"
                    type="number"
                    min={0}
                    step={5}
                    value={defaultSessionValue}
                    onChange={(e) => setDefaultSessionValue(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contato de Emergência */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <HeartPulse className="h-4 w-4 text-rose-600" />
              <span>Contato de Emergência</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="emergency-name" className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Contato
                </label>
                <input
                  id="emergency-name"
                  type="text"
                  placeholder="Nome"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1"
                />
              </div>

              <div>
                <label htmlFor="emergency-rel" className="block text-xs font-medium text-slate-700 mb-1">
                  Parentesco / Vínculo
                </label>
                <input
                  id="emergency-rel"
                  type="text"
                  placeholder="Ex: Cônjuge, Filho, Mãe"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1"
                />
              </div>

              <div>
                <label htmlFor="emergency-phone" className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone de Emergência
                </label>
                <input
                  id="emergency-phone"
                  type="text"
                  placeholder="(71) 90000-0000"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(formatPhone(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1"
                />
              </div>
            </div>
          </div>

          {/* Observações administrativas */}
          <div>
            <label htmlFor="patient-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Administrativas / Alergias
            </label>
            <textarea
              id="patient-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Paciente alérgico a látex / preferência de horário matutino"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1"
            />
          </div>

          <div className="bg-slate-50 border-t border-slate-200 -mx-3 -mb-3 p-3 flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg shadow-sm transition-colors"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {isSaving
                  ? 'Gravando no Supabase...'
                  : initialPatient
                  ? 'Salvar Alterações'
                  : 'Salvar Paciente na Base'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
