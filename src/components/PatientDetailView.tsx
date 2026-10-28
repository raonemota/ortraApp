/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  Plus,
  Activity,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building,
  CheckCircle,
  Clock,
  Sparkles,
  Edit2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Patient,
  Assessment,
  Evolution,
  UserProfile,
} from '../types/index.ts';
import {
  calculateAge,
  formatCurrencyBRL,
  getEvaColorInfo,
  formatPhysioDisplayName,
  getPersonInitials,
} from '../utils/clinicalCalculations.ts';

interface PatientDetailViewProps {
  patient: Patient;
  currentUser: UserProfile;
  physioList: UserProfile[];
  assessments: Assessment[];
  evolutions: Evolution[];
  onBack: () => void;
  onNewAssessment: () => void;
  onNewEvolution: () => void;
  onEditPatient: () => void;
  onOpenChecklist?: () => void;
  onPrintAssessment: (assessment: Assessment) => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patient,
  currentUser,
  physioList,
  assessments,
  evolutions,
  onBack,
  onNewAssessment,
  onNewEvolution,
  onEditPatient,
  onPrintAssessment,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'evolutions' | 'assessments' | 'pain_chart'>(
    'evolutions'
  );
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(
    assessments[0]?.id || null
  );
  const [showSessionValue, setShowSessionValue] = useState(false);

  const age = calculateAge(patient.birthDate);
  const assignedPhysio = physioList.find((p) => p.id === patient.physioId);

  const checklist = patient.onboardingChecklist || {
    consentLgpdSigned: false,
    identificationVerified: false,
    rulesExplained: false,
    firstAssessmentScheduled: false,
  };
  const checklistPending =
    !checklist.consentLgpdSigned ||
    !checklist.identificationVerified ||
    !checklist.rulesExplained ||
    !checklist.firstAssessmentScheduled;

  // Clean phone digits for WhatsApp
  const cleanPhone = patient.phone.replace(/\D/g, '');

  const emergencyDisplayText = [
    patient.emergencyContact?.name,
    patient.emergencyContact?.relationship ? `(${patient.emergencyContact.relationship})` : null,
    patient.emergencyContact?.phone ? `- ${patient.emergencyContact.phone}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Navigation: botões com ícones e mesmo tamanho em grid mobile balanceado */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 h-11 sm:h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate">Voltar à Lista</span>
        </button>

        <div className="contents sm:flex sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={onEditPatient}
            className="flex items-center justify-center gap-1.5 h-11 sm:h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs w-full sm:w-auto"
          >
            <Edit2 className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate">Editar Cadastro</span>
          </button>
          <button
            type="button"
            onClick={onNewEvolution}
            className="flex items-center justify-center gap-1.5 h-11 sm:h-10 px-3.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-sm w-full sm:w-auto"
          >
            <Activity className="h-4 w-4 shrink-0 text-teal-400" />
            <span className="truncate">Nova Evolução</span>
          </button>
          <button
            type="button"
            onClick={onNewAssessment}
            className="flex items-center justify-center gap-1.5 h-11 sm:h-10 px-3.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition-all shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0 text-white" />
            <span className="truncate">Nova Avaliação</span>
          </button>
        </div>
      </div>

      {/* Patient Profile Card Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 font-black text-lg sm:text-xl uppercase">
              {getPersonInitials(patient.fullName)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{patient.fullName}</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                  {patient.healthInsurance}
                </span>

                {/* Valor por Sessão discreto com botão de ver e ocultar */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-600">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-500">Sessão:</span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {showSessionValue ? formatCurrencyBRL(patient.defaultSessionValue || 160) : 'R$ •••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSessionValue(!showSessionValue)}
                    title={showSessionValue ? 'Ocultar valor da sessão' : 'Exibir valor da sessão'}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                    aria-label={showSessionValue ? 'Ocultar valor' : 'Ver valor'}
                  >
                    {showSessionValue ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                CPF: <strong className="text-slate-700">{patient.cpf}</strong> · {age} anos (Nasc: {new Date(patient.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}) · {patient.profession || 'Ocupação não informada'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Fisioterapeuta Responsável: <strong className="text-slate-800">{assignedPhysio ? formatPhysioDisplayName(assignedPhysio) : 'Clínica Ortra'}</strong> ({assignedPhysio?.crefito || 'CREFITO-7'})
              </p>
            </div>
          </div>
        </div>

        {/* Quick Contact & Emergency Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-teal-600 shrink-0" />
            <span>Telefone: <strong>{patient.phone}</strong></span>
            {cleanPhone && (
              <a
                href={`https://wa.me/55${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded hover:bg-emerald-100"
              >
                WhatsApp
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              Emergência:{' '}
              <strong>{emergencyDisplayText || 'Não informado'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Evoluções vs Avaliações */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('evolutions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'evolutions'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Evoluções Diárias de Sessão ({evolutions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('assessments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'assessments'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Avaliações Cinético-Funcionais ({assessments.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: EVOLUÇÕES DIÁRIAS (RF09) */}
      {activeSubTab === 'evolutions' && (
        <div className="space-y-4">
          {evolutions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 sm:p-10 text-center bg-white">
              <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                Nenhuma evolução registrada para este paciente
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Registre o atendimento diário com as condutas fisioterapêuticas realizadas e evolução clínica do paciente.
              </p>
              <button
                type="button"
                onClick={onNewEvolution}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm"
              >
                Registrar 1ª Evolução
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {evolutions.map((evo) => {

                return (
                  <div
                    key={evo.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 transition-all hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Sessão #{evo.sessionNumber}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(evo.sessionDate).toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(evo.sessionDate).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {evo.attendanceStatus === 'completed' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Presença Confirmada</span>
                          </span>
                        ) : evo.attendanceStatus === 'missed_justified' ? (
                          <span className="text-amber-700 font-semibold">Falta Justificada</span>
                        ) : (
                          <span className="text-rose-700 font-semibold">Falta Não Justificada</span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                      {evo.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: AVALIAÇÕES CINÉTICO-FUNCIONAIS (RF06, RF07, RF08) */}
      {activeSubTab === 'assessments' && (
        <div className="space-y-4">
          {assessments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center bg-white">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                Nenhuma avaliação completa registrada
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Realize a avaliação cinético-funcional estruturada em 3 blocos: Anamnese, Exame Físico com EVA e Conduta.
              </p>
              <button
                type="button"
                onClick={onNewAssessment}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm"
              >
                Iniciar Nova Avaliação
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((ass, idx) => {
                const isExpanded = expandedAssessmentId === ass.id;
                const evaInfo = getEvaColorInfo(ass.physicalExam.evaInitial);

                return (
                  <div
                    key={ass.id}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                  >
                    {/* Header */}
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            Avaliação Cinético-Funcional #{assessments.length - idx}
                          </span>
                          <span className="text-xs text-slate-500">
                            · {new Date(ass.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${evaInfo.badgeClass}`}
                          >
                            {evaInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 truncate max-w-xl">
                          <strong>QP:</strong> {ass.anamnesis.qp}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onPrintAssessment(ass)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Imprimir / PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAssessmentId(isExpanded ? null : ass.id)
                          }
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
                        >
                          <span>{isExpanded ? 'Recolher' : 'Expandir Prontuário'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-6 space-y-6 text-xs text-slate-800">
                        {/* 1. Anamnese */}
                        <div className="space-y-2 border-b border-slate-100 pb-4">
                          <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">
                            1. Anamnese (Avaliação Subjetiva)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <p>
                              <strong className="text-slate-900">Queixa Principal:</strong> {ass.anamnesis.qp}
                            </p>
                            <p>
                              <strong className="text-slate-900">História Atual:</strong> {ass.anamnesis.hda || 'N/A'}
                            </p>
                            <p>
                              <strong className="text-slate-900">Histórico Pregresso:</strong> {ass.anamnesis.hpp || 'Sem comorbidades relatadas'}
                            </p>
                            <p>
                              <strong className="text-slate-900">Medicamentos:</strong> {ass.anamnesis.medications || 'Nenhum'}
                            </p>
                          </div>
                        </div>

                        {/* 2. Exame Físico */}
                        <div className="space-y-2 border-b border-slate-100 pb-4">
                          <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">
                            2. Exame Físico Cinético-Funcional
                          </h4>
                          <p>
                            <strong className="text-slate-900">Inspeção e Palpação:</strong> {ass.physicalExam.inspectionPalpation || 'Sem achados específicos'}
                          </p>

                          {/* Goniometria */}
                          {ass.physicalExam.goniometry?.length > 0 && (
                            <div className="pt-2">
                              <span className="font-bold text-slate-800 block mb-1">Goniometria:</span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {ass.physicalExam.goniometry.map((g, i) => (
                                  <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200">
                                    <strong>{g.joint}</strong> ({g.movement}): {g.degrees}° (Ref: {g.reference})
                                    {g.notes && <span className="text-slate-500 block text-[10px]">{g.notes}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Força Oxford */}
                          {ass.physicalExam.muscleStrength?.length > 0 && (
                            <div className="pt-2">
                              <span className="font-bold text-slate-800 block mb-1">Força Muscular (Oxford):</span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {ass.physicalExam.muscleStrength.map((m, i) => (
                                  <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200">
                                    <strong>{m.muscleGroup}:</strong> Grau {m.grade}/5 {m.notes ? `(${m.notes})` : ''}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Testes Especiais */}
                          {ass.physicalExam.orthopedicTests?.length > 0 && (
                            <div className="pt-2">
                              <span className="font-bold text-slate-800 block mb-1">Testes Ortopédicos:</span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {ass.physicalExam.orthopedicTests.map((t, i) => (
                                  <div key={i} className="p-2 rounded bg-white border border-slate-200 flex justify-between items-center">
                                    <span>{t.name}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        t.result === 'positive'
                                          ? 'bg-rose-50 text-rose-700'
                                          : 'bg-emerald-50 text-emerald-700'
                                      }`}
                                    >
                                      {t.result === 'positive' ? 'Positivo (+)' : 'Negativo (-)'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. Diagnóstico e Plano */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">
                            3. Diagnóstico Cinético-Funcional & Conduta
                          </h4>
                          <p>
                            <strong className="text-slate-900">Diagnóstico:</strong>{' '}
                            <span className="font-medium text-slate-900">
                              {ass.diagnosisAndPlan.kineticFunctionalDiagnosis}
                            </span>
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                              <span className="font-bold block text-teal-800">Curto Prazo:</span>
                              <span>{ass.diagnosisAndPlan.treatmentGoals.shortTerm}</span>
                            </div>
                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                              <span className="font-bold block text-sky-800">Médio Prazo:</span>
                              <span>{ass.diagnosisAndPlan.treatmentGoals.mediumTerm}</span>
                            </div>
                            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                              <span className="font-bold block text-indigo-800">Longo Prazo:</span>
                              <span>{ass.diagnosisAndPlan.treatmentGoals.longTerm}</span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <span className="font-bold block text-slate-800 mb-1">Recursos Terapêuticos:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {ass.diagnosisAndPlan.therapeuticPlan?.map((tech, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200 text-[11px] font-medium">
                                  ✓ {tech}
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="pt-1 text-slate-600">
                            <strong>Conduta / Frequência:</strong> {ass.diagnosisAndPlan.planDetails}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
