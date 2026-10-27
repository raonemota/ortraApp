/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  ShieldCheck,
  FileCheck,
  CalendarCheck,
  UserCheck,
  ArrowRight,
  X,
} from 'lucide-react';
import { Patient, PatientChecklist } from '../types/index.ts';
import { clinicalStorage } from '../services/storageService.ts';

interface PatientChecklistModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onStartAssessment?: (patient: Patient) => void;
  onChecklistUpdated?: (updatedPatient: Patient) => void;
}

export const PatientChecklistModal: React.FC<PatientChecklistModalProps> = ({
  patient,
  isOpen,
  onClose,
  onStartAssessment,
  onChecklistUpdated,
}) => {
  const [checklist, setChecklist] = useState<PatientChecklist>(
    patient.onboardingChecklist || {
      consentLgpdSigned: false,
      identificationVerified: false,
      rulesExplained: false,
      firstAssessmentScheduled: false,
    }
  );

  if (!isOpen) return null;

  const toggleItem = (key: keyof PatientChecklist) => {
    const updatedChecklist = {
      ...checklist,
      [key]: !checklist[key],
    };
    setChecklist(updatedChecklist);

    const updatedPatient: Patient = {
      ...patient,
      onboardingChecklist: updatedChecklist,
    };
    clinicalStorage.savePatient(updatedPatient);
    if (onChecklistUpdated) {
      onChecklistUpdated(updatedPatient);
    }
  };

  const allCompleted =
    checklist.consentLgpdSigned &&
    checklist.identificationVerified &&
    checklist.rulesExplained &&
    checklist.firstAssessmentScheduled;

  const completedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-400" />
            <div>
              <h3 id="checklist-title" className="text-sm font-bold">
                Checklist de Integração do Paciente
              </h3>
              <p className="text-xs text-slate-300">
                {patient.fullName} · CPF: {patient.cpf}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar checklist"
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-3">
            <span>Validações obrigatórias da Clínica Ortra</span>
            <span className="font-semibold text-slate-800">
              {completedCount} de 4 concluídas
            </span>
          </div>

          <div className="space-y-3">
            {/* Item 1: LGPD */}
            <button
              type="button"
              onClick={() => toggleItem('consentLgpdSigned')}
              className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                checklist.consentLgpdSigned
                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="mt-0.5">
                {checklist.consentLgpdSigned ? (
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <FileCheck className="h-4 w-4 text-teal-700" />
                  <span>Termo de Consentimento / LGPD assinado</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Autorização para tratamento de dados de saúde e guarda de prontuário eletrônico.
                </p>
              </div>
            </button>

            {/* Item 2: RG / CPF */}
            <button
              type="button"
              onClick={() => toggleItem('identificationVerified')}
              className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                checklist.identificationVerified
                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="mt-0.5">
                {checklist.identificationVerified ? (
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <UserCheck className="h-4 w-4 text-sky-700" />
                  <span>Documento de Identificação com Foto verificado</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conferência de RG/CNH e dados cadastrais para faturamento do plano/recibo.
                </p>
              </div>
            </button>

            {/* Item 3: Regras de faltas */}
            <button
              type="button"
              onClick={() => toggleItem('rulesExplained')}
              className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                checklist.rulesExplained
                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="mt-0.5">
                {checklist.rulesExplained ? (
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  <span>Regras de faltas, atrasos e reposições explicadas</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aviso prévio mínimo de 24h para cancelamentos justificados.
                </p>
              </div>
            </button>

            {/* Item 4: Primeira Avaliação */}
            <button
              type="button"
              onClick={() => toggleItem('firstAssessmentScheduled')}
              className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                checklist.firstAssessmentScheduled
                  ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="mt-0.5">
                {checklist.firstAssessmentScheduled ? (
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <CalendarCheck className="h-4 w-4 text-teal-700" />
                  <span>Primeira Avaliação Agendada ou em Andamento</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anamnese, exame físico cinético-funcional e conduta terapêutica inicial.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            Fechar e Salvar
          </button>

          {onStartAssessment && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartAssessment(patient);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
            >
              <span>Nova Avaliação Cinético-Funcional</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
