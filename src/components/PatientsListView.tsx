/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Activity,
  ChevronRight,
  Building,
} from 'lucide-react';
import {
  Patient,
  UserProfile,
  Evolution,
  Assessment,
} from '../types/index.ts';
import {
  calculateAge,
  hasAdminPrivileges,
  formatPhysioDisplayName,
  getPersonInitials,
} from '../utils/clinicalCalculations.ts';
import { clinicalStorage } from '../services/storageService.ts';

interface PatientsListViewProps {
  currentUser: UserProfile;
  patients: Patient[];
  physioList: UserProfile[];
  evolutions: Evolution[];
  assessments: Assessment[];
  onSelectPatient: (patient: Patient) => void;
  onOpenNewPatientModal: () => void;
  onQuickEvolution: (patient: Patient) => void;
  onOpenChecklist: (patient: Patient) => void;
}

export const PatientsListView: React.FC<PatientsListViewProps> = ({
  currentUser,
  patients,
  physioList,
  evolutions,
  assessments,
  onSelectPatient,
  onOpenNewPatientModal,
  onQuickEvolution,
  onOpenChecklist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('all');

  const isAdmin = hasAdminPrivileges(currentUser);
  const [physioFilter, setPhysioFilter] = useState(isAdmin ? 'all' : currentUser.id);

  const plans = clinicalStorage.getInsurancePlans();

  // Unique health insurances
  const uniqueInsurances = useMemo(() => {
    const list = Array.from(new Set(patients.map((p) => p.healthInsurance)));
    return list.filter(Boolean);
  }, [patients]);

  // Filtered patients (Strict RBAC: non-admin physios only see their own patients)
  const filteredPatients = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      // Physio filter
      if (!isAdmin) {
        if (p.physioId !== currentUser.id) return false;
      } else if (physioFilter !== 'all' && p.physioId !== physioFilter) {
        return false;
      }

      // Insurance filter
      if (insuranceFilter !== 'all' && p.healthInsurance !== insuranceFilter) {
        return false;
      }

      // Query filter
      if (query) {
        const matchName = p.fullName.toLowerCase().includes(query);
        const matchCpf = p.cpf.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
        const matchPhone = p.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
        if (!matchName && !matchCpf && !matchPhone) return false;
      }
      return true;
    });
  }, [patients, isAdmin, currentUser.id, physioFilter, insuranceFilter, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            Gestão de Pacientes & Prontuários
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {isAdmin
              ? 'Visão Administrativa Geral: acompanhe todos os pacientes, pendências e prontuários da clínica.'
              : `Sua Carteira de Atendimento: gerencie os pacientes e evoluções sob os cuidados de ${formatPhysioDisplayName(currentUser)}.`}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewPatientModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Cadastrar Novo Paciente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Insurance Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Filter className="h-3 w-3 text-slate-400" />
            <select
              value={insuranceFilter}
              onChange={(e) => setInsuranceFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
            >
              <option value="all">Todos os Convênios</option>
              {uniqueInsurances.map((ins) => (
                <option key={ins} value={ins}>
                  {ins}
                </option>
              ))}
            </select>
          </div>

          {/* Physio Filter (Only for Admins) */}
          {isAdmin ? (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Users className="h-3 w-3 text-slate-400" />
              <select
                value={physioFilter}
                onChange={(e) => setPhysioFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
              >
                <option value="all">Todos os Profissionais</option>
                {physioList
                  .filter((p) => p.role === 'physio')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPhysioDisplayName(p)}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200">
              Meus Pacientes
            </span>
          )}
        </div>
      </div>

      {/* Patients Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full rounded-xl sm:rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center bg-white">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum paciente encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tente redefinir a busca ou cadastre um novo paciente para iniciar o prontuário.
            </p>
            <button
              type="button"
              onClick={onOpenNewPatientModal}
              className="mt-3 px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm"
            >
              Cadastrar Paciente Agora
            </button>
          </div>
        ) : (
          filteredPatients.map((pat) => {
            const age = calculateAge(pat.birthDate);
            const assignedPhysio = physioList.find((p) => p.id === pat.physioId);
            const patEvolutions = evolutions.filter((e) => e.patientId === pat.id);
            const patAssessments = assessments.filter((a) => a.patientId === pat.id);
            const planObj = plans.find((pl) => pl.name === pat.healthInsurance);

            const checklist = pat.onboardingChecklist || {
              consentLgpdSigned: false,
              identificationVerified: false,
              rulesExplained: false,
              firstAssessmentScheduled: false,
            };
            const hasPendingChecklist =
              !checklist.consentLgpdSigned ||
              !checklist.identificationVerified ||
              !checklist.rulesExplained ||
              !checklist.firstAssessmentScheduled;

            const cleanPhone = pat.phone.replace(/\D/g, '');

            return (
              <div
                key={pat.id}
                className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-black text-sm uppercase">
                        {getPersonInitials(pat.fullName)}
                      </div>
                      <div>
                        <h2
                          className="font-bold text-xs sm:text-sm text-slate-900 hover:text-teal-700 cursor-pointer"
                          onClick={() => onSelectPatient(pat)}
                        >
                          {pat.fullName}
                        </h2>
                        <span className="text-[11px] text-slate-500 block">
                          {age} anos · {pat.profession || 'Ocupação N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {planObj?.logoUrl && (
                        <img
                          src={planObj.logoUrl}
                          alt={pat.healthInsurance}
                          className="h-5 w-5 rounded object-cover border border-slate-200"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      )}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {pat.healthInsurance}
                      </span>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">CPF:</span>
                      <span className="font-medium text-slate-800">{pat.cpf}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Contato:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800">{pat.phone}</span>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded hover:bg-emerald-100"
                          >
                            Zap
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Fisioterapeuta:</span>
                      <span className="font-semibold text-teal-800">
                        {assignedPhysio ? formatPhysioDisplayName(assignedPhysio) : 'Clínica Ortra'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Atendimentos:</span>
                      <span className="font-bold text-slate-900">
                        {patEvolutions.length} sessões · {patAssessments.length} avaliações
                      </span>
                    </div>
                  </div>

                  {/* Checklist Status */}
                  <div className="mb-3">
                    {hasPendingChecklist ? (
                      <button
                        type="button"
                        onClick={() => onOpenChecklist(pat)}
                        className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] sm:text-[11px] font-semibold hover:bg-amber-100 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                          <span>Checklist Pendente (LGPD / Docs)</span>
                        </span>
                        <span className="underline">Validar</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Checklist de Integração Completo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onQuickEvolution(pat)}
                    title="Registrar evolução de sessão"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Activity className="h-3.5 w-3.5 text-teal-700" />
                    <span>Evolução</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectPatient(pat)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    <span>Prontuário</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
