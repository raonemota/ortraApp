/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Activity,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  Patient,
  UserProfile,
  Evolution,
  AttendanceStatus,
  PaymentStatus,
} from '../types/index.ts';
import { EvaSlider } from './EvaSlider.tsx';
import { clinicalStorage, generateUUID, ensureUUID } from '../services/storageService.ts';

interface EvolutionModalProps {
  patient: Patient;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onEvolutionSaved: (evolution: Evolution) => void;
  existingEvolution?: Evolution | null;
  nextSessionNumber: number;
}

export const EvolutionModal: React.FC<EvolutionModalProps> = ({
  patient,
  currentUser,
  isOpen,
  onClose,
  onEvolutionSaved,
  existingEvolution,
  nextSessionNumber,
}) => {
  // Pre-fill current date-time
  const now = new Date();
  const defaultDateTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

  const [sessionDateTime, setSessionDateTime] = useState(
    existingEvolution
      ? existingEvolution.sessionDate.slice(0, 16)
      : defaultDateTime
  );
  const [description, setDescription] = useState(
    existingEvolution?.description || ''
  );
  const [evaBefore, setEvaBefore] = useState(
    existingEvolution?.evaBefore ?? 5
  );
  const [evaAfter, setEvaAfter] = useState(
    existingEvolution?.evaAfter ?? 3
  );
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(
    existingEvolution?.attendanceStatus || 'completed'
  );
  const [sessionValue, setSessionValue] = useState<number>(
    existingEvolution?.sessionValue ?? (patient.defaultSessionValue || 160)
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    existingEvolution?.paymentStatus || 'paid'
  );
  const [paymentMethod, setPaymentMethod] = useState(
    existingEvolution?.paymentMethod || 'Pix'
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (attendanceStatus === 'completed' && !description.trim()) {
      setError('Por favor, descreva as condutas executadas na sessão.');
      return;
    }

    const evolutionData: Evolution = {
      id: existingEvolution ? existingEvolution.id : generateUUID(),
      patientId: ensureUUID(patient.id),
      physioId: ensureUUID(currentUser.id),
      sessionDate: new Date(sessionDateTime).toISOString(),
      sessionNumber: existingEvolution
        ? existingEvolution.sessionNumber
        : nextSessionNumber,
      description: description.trim() || 'Falta registrada.',
      evaBefore,
      evaAfter,
      attendanceStatus,
      sessionValue: attendanceStatus === 'completed' ? Number(sessionValue) : 0,
      paymentStatus: attendanceStatus === 'completed' ? paymentStatus : 'paid',
      paymentMethod,
      createdAt: existingEvolution ? existingEvolution.createdAt : new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      const res = await clinicalStorage.saveEvolution(evolutionData);
      if (!res.success) {
        setError(`Erro ao salvar evolução no Supabase: ${res.error || 'Falha de comunicação'}`);
        setIsSaving(false);
        return;
      }
      onEvolutionSaved(evolutionData);
      onClose();
    } catch (err: any) {
      setError(`Falha inesperada ao salvar: ${err?.message || 'Erro de rede'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evolution-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-teal-400" />
            <div>
              <h2 id="evolution-modal-title" className="text-base font-bold">
                {existingEvolution
                  ? `Editar Evolução da Sessão #${existingEvolution.sessionNumber}`
                  : `Evolução Diária da Sessão #${nextSessionNumber}`}
              </h2>
              <p className="text-xs text-slate-300">
                {patient.fullName} · {patient.healthInsurance}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar evolução"
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date, Time and Attendance Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="session-datetime" className="block text-xs font-semibold text-slate-700 mb-1">
                Data e Horário do Atendimento
              </label>
              <input
                id="session-datetime"
                type="datetime-local"
                required
                value={sessionDateTime}
                onChange={(e) => setSessionDateTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:ring-1"
              />
            </div>

            <div>
              <label htmlFor="attendance-status-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Status da Presença
              </label>
              <select
                id="attendance-status-select"
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value as AttendanceStatus)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:border-teal-600 focus:ring-1"
              >
                <option value="completed">Sessão Realizada</option>
                <option value="missed_justified">Falta Justificada (Aviso prévio)</option>
                <option value="missed_unjustified">Falta Não Justificada</option>
              </select>
            </div>
          </div>

          {/* EVA Before & After Session */}
          {attendanceStatus === 'completed' && (
            <div className="space-y-3">
              <EvaSlider
                value={evaBefore}
                onChange={setEvaBefore}
                label="1. Nível de Dor ao Iniciar a Sessão (EVA Entrada)"
                id="eva-before-slider"
              />

              <EvaSlider
                value={evaAfter}
                onChange={setEvaAfter}
                label="2. Nível de Dor ao Finalizar a Sessão (EVA Saída)"
                id="eva-after-slider"
              />
            </div>
          )}

          {/* Condutas e Descrição */}
          <div>
            <label htmlFor="evolution-desc" className="block text-xs font-semibold text-slate-700 mb-1">
              {attendanceStatus === 'completed'
                ? 'Conduta Terapêutica Realizada e Resposta do Paciente *'
                : 'Motivo da Falta / Observação'}
            </label>
            <textarea
              id="evolution-desc"
              rows={4}
              required={attendanceStatus === 'completed'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                attendanceStatus === 'completed'
                  ? 'Descreva as técnicas aplicadas (cinesioterapia, terapia manual, eletroterapia, carga utilizada, tolerância e orientações para casa)...'
                  : 'Ex: Paciente comunicou com 24h de antecedência por viagem de trabalho.'
              }
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1"
            />
          </div>

          {/* Dados Financeiros da Sessão (RF10) */}
          {attendanceStatus === 'completed' && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-teal-700" />
                <span>Controle Financeiro da Sessão</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="session-val-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Valor Cobrado (R$)
                  </label>
                  <input
                    id="session-val-input"
                    type="number"
                    min={0}
                    step={5}
                    value={sessionValue}
                    onChange={(e) => setSessionValue(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="payment-status-select" className="block text-xs font-medium text-slate-700 mb-1">
                    Status do Pagamento
                  </label>
                  <select
                    id="payment-status-select"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente a Receber</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="payment-method-select" className="block text-xs font-medium text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    id="payment-method-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Faturamento Convênio">Faturamento Convênio</option>
                  </select>
                </div>
              </div>
            </div>
          )}

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
                  ? 'Salvando no Supabase...'
                  : existingEvolution
                  ? 'Salvar Alterações'
                  : 'Registrar Evolução da Sessão'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
