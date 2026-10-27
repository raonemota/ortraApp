/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Printer, Building2, Check, FileText } from 'lucide-react';
import { Patient, Assessment, UserProfile } from '../types/index.ts';
import { clinicalStorage } from '../services/storageService.ts';
import { formatCurrencyBRL, calculateAge } from '../utils/clinicalCalculations.ts';

interface PrintProntuarioModalProps {
  patient: Patient;
  assessment: Assessment;
  physio: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintProntuarioModal: React.FC<PrintProntuarioModalProps> = ({
  patient,
  assessment,
  physio,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const settings = clinicalStorage.getClinicSettings();
  const age = calculateAge(patient.birthDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 relative">
        {/* Modal Controls (Hidden in Print) */}
        <div className="sticky top-0 z-20 bg-slate-900 px-6 py-4 text-white flex items-center justify-between print:hidden shadow-md">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-teal-400" />
            <h2 id="print-modal-title" className="text-sm font-bold">
              Visualização de Impressão Institucional · Clínica Ortra
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar visualização"
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 text-slate-900 font-sans print:p-0 print:space-y-4">
          {/* Header Institucional da Clínica Ortra */}
          <div className="border-b-2 border-slate-800 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-900 text-white font-black text-xl">
                O
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {settings.clinicName}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {settings.address}
                </p>
                <p className="text-xs text-slate-500">
                  CNPJ: {settings.cnpj} · Tel: {settings.phone} · {settings.email}
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <span className="font-bold text-slate-800 block">PRONTUÁRIO DE FISIOTERAPIA</span>
              <span>Data: {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Dados do Paciente */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-slate-500 block">Paciente:</span>
                <span className="font-bold text-slate-900 text-sm">{patient.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">CPF:</span>
                <span className="font-semibold text-slate-800">{patient.cpf}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Idade / Nasc:</span>
                <span className="font-semibold text-slate-800">
                  {age} anos ({new Date(patient.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Convênio:</span>
                <span className="font-bold text-teal-800">{patient.healthInsurance}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200">
              <div>
                <span className="text-slate-500 block">Telefone:</span>
                <span className="text-slate-800">{patient.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Profissão:</span>
                <span className="text-slate-800">{patient.profession || 'Não informada'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Contato de Emergência:</span>
                <span className="text-slate-800">
                  {patient.emergencyContact?.name} ({patient.emergencyContact?.relationship}) - {patient.emergencyContact?.phone}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Anamnese */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 border-b border-teal-800/30 pb-1">
              1. Anamnese (Avaliação Subjetiva)
            </h3>
            <div className="space-y-2 text-xs">
              <p>
                <strong className="text-slate-900">Queixa Principal (QP):</strong>{' '}
                <span className="text-slate-700">{assessment.anamnesis.qp}</span>
              </p>
              {assessment.anamnesis.hda && (
                <p>
                  <strong className="text-slate-900">História da Doença Atual (HDA):</strong>{' '}
                  <span className="text-slate-700">{assessment.anamnesis.hda}</span>
                </p>
              )}
              {assessment.anamnesis.hpp && (
                <p>
                  <strong className="text-slate-900">Histórico Pregresso (HPP):</strong>{' '}
                  <span className="text-slate-700">{assessment.anamnesis.hpp}</span>
                </p>
              )}
              {assessment.anamnesis.medications && (
                <p>
                  <strong className="text-slate-900">Medicamentos:</strong>{' '}
                  <span className="text-slate-700">{assessment.anamnesis.medications}</span>
                </p>
              )}
              {assessment.anamnesis.examNotes && (
                <p>
                  <strong className="text-slate-900">Exames Complementares:</strong>{' '}
                  <span className="text-slate-700">{assessment.anamnesis.examNotes}</span>
                </p>
              )}
            </div>
          </div>

          {/* 2. Exame Físico */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 border-b border-teal-800/30 pb-1">
              2. Exame Físico Cinético-Funcional
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-900">
                  Escala Visual Analógica de Dor (EVA):
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-900">
                  {assessment.physicalExam.evaInitial} / 10
                </span>
              </div>
              {assessment.physicalExam.inspectionPalpation && (
                <p>
                  <strong className="text-slate-900">Inspeção / Palpação:</strong>{' '}
                  <span className="text-slate-700">{assessment.physicalExam.inspectionPalpation}</span>
                </p>
              )}

              {/* Goniometria */}
              {assessment.physicalExam.goniometry?.length > 0 && (
                <div className="pt-1">
                  <span className="font-bold text-slate-800 block mb-1">Goniometria Articular:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {assessment.physicalExam.goniometry.map((g, i) => (
                      <div key={i} className="rounded border border-slate-200 p-1.5 text-[11px]">
                        <strong>{g.joint}</strong> ({g.movement}): {g.degrees}° (Ref: {g.reference})
                        {g.notes && <span className="text-slate-500"> - {g.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Força Muscular */}
              {assessment.physicalExam.muscleStrength?.length > 0 && (
                <div className="pt-1">
                  <span className="font-bold text-slate-800 block mb-1">Força Muscular (Oxford):</span>
                  <div className="grid grid-cols-2 gap-2">
                    {assessment.physicalExam.muscleStrength.map((m, i) => (
                      <div key={i} className="rounded border border-slate-200 p-1.5 text-[11px]">
                        <strong>{m.muscleGroup}:</strong> Grau {m.grade}/5 {m.notes ? `(${m.notes})` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Diagnóstico e Conduta */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 border-b border-teal-800/30 pb-1">
              3. Conclusão e Plano Terapêutico
            </h3>
            <div className="space-y-2 text-xs">
              <p>
                <strong className="text-slate-900">Diagnóstico Cinético-Funcional:</strong>{' '}
                <span className="text-slate-800 font-medium">
                  {assessment.diagnosisAndPlan.kineticFunctionalDiagnosis}
                </span>
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="rounded border border-slate-200 p-2">
                  <span className="font-bold text-slate-900 block text-[11px]">Curto Prazo:</span>
                  <span className="text-[11px] text-slate-600">{assessment.diagnosisAndPlan.treatmentGoals.shortTerm}</span>
                </div>
                <div className="rounded border border-slate-200 p-2">
                  <span className="font-bold text-slate-900 block text-[11px]">Médio Prazo:</span>
                  <span className="text-[11px] text-slate-600">{assessment.diagnosisAndPlan.treatmentGoals.mediumTerm}</span>
                </div>
                <div className="rounded border border-slate-200 p-2">
                  <span className="font-bold text-slate-900 block text-[11px]">Longo Prazo:</span>
                  <span className="text-[11px] text-slate-600">{assessment.diagnosisAndPlan.treatmentGoals.longTerm}</span>
                </div>
              </div>

              <div className="pt-1">
                <strong className="text-slate-900 block mb-1">Recursos Terapêuticos:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {assessment.diagnosisAndPlan.therapeuticPlan?.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[11px] text-slate-800 font-medium">
                      ✓ {tech}
                    </span>
                  ))}
                </div>
              </div>

              <p className="pt-1">
                <strong className="text-slate-900">Conduta / Frequência:</strong>{' '}
                <span className="text-slate-700">{assessment.diagnosisAndPlan.planDetails}</span>
              </p>
            </div>
          </div>

          {/* Assinatura do Fisioterapeuta */}
          <div className="pt-8 mt-6 border-t border-slate-300 flex justify-between items-end text-xs">
            <div>
              <p className="text-slate-400 text-[10px]">Documento registrado eletronicamente.</p>
              <p className="text-slate-400 text-[10px]">Clínica Ortra · Lauro de Freitas - Bahia</p>
            </div>
            <div className="text-center w-64">
              <div className="border-b border-slate-800 mb-1"></div>
              <p className="font-bold text-slate-900">{physio.fullName}</p>
              <p className="text-slate-600 font-medium">{physio.crefito || 'CREFITO-7'}</p>
              <p className="text-[10px] text-slate-400">Fisioterapeuta Responsável</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
