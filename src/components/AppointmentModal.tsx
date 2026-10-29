/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Plus,
  Repeat,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  Trash2,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Appointment,
  AppointmentModality,
  AppointmentStatus,
  Patient,
  UserProfile,
} from '../types/index.ts';
import { generateUUID } from '../services/storageService.ts';
import {
  formatPhysioDisplayName,
  formatDateCompact,
} from '../utils/clinicalCalculations.ts';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointments: Appointment[]) => Promise<void> | void;
  patients: Patient[];
  physiotherapists: UserProfile[];
  currentUser: UserProfile;
  initialDate?: string;
  existingAppointment?: Appointment | null;
  onOpenNewPatientModal?: () => void;
}

const SERVICE_OPTIONS = [
  'Cinesioterapia Ortopédica',
  'Eletroterapia & Analgesia',
  'Fisioterapia Traumato-Ortopédica',
  'Terapia Manual & Descompressão',
  'Reeducação Postural Global (RPG)',
  'Pilates Clínico Funcional',
  'Avaliação Cinético-Funcional',
  'Fisioterapia Preventiva / Retorno',
];

interface WeekdayConfig {
  dayOfWeek: number; // 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
  name: string;
  shortName: string;
  selected: boolean;
  startTime: string;
  endTime: string;
}

const INITIAL_WEEKDAY_CONFIGS: WeekdayConfig[] = [
  { dayOfWeek: 1, name: 'Segunda-feira', shortName: 'Seg', selected: false, startTime: '08:00', endTime: '08:50' },
  { dayOfWeek: 2, name: 'Terça-feira', shortName: 'Ter', selected: true, startTime: '08:00', endTime: '08:50' },
  { dayOfWeek: 3, name: 'Quarta-feira', shortName: 'Qua', selected: false, startTime: '08:00', endTime: '08:50' },
  { dayOfWeek: 4, name: 'Quinta-feira', shortName: 'Qui', selected: true, startTime: '08:00', endTime: '08:50' },
  { dayOfWeek: 5, name: 'Sexta-feira', shortName: 'Sex', selected: false, startTime: '08:00', endTime: '08:50' },
  { dayOfWeek: 6, name: 'Sábado', shortName: 'Sáb', selected: false, startTime: '08:00', endTime: '08:50' },
];

interface GeneratedSessionPreview {
  tempId: string;
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
  included: boolean;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patients,
  physiotherapists,
  currentUser,
  initialDate,
  existingAppointment,
  onOpenNewPatientModal,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Scheduling Tab Mode: 'single' | 'recurring'
  const [scheduleMode, setScheduleMode] = useState<'single' | 'recurring'>('single');

  // Basic Information
  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [physioId, setPhysioId] = useState(currentUser.id);
  const [date, setDate] = useState(initialDate || todayStr);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:50');
  const [modality, setModality] = useState<AppointmentModality>('particular');
  const [serviceType, setServiceType] = useState('Cinesioterapia Ortopédica');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [sessionValue, setSessionValue] = useState<number>(120);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Advanced Recurring Plan Options
  const [weekdayConfigs, setWeekdayConfigs] = useState<WeekdayConfig[]>(INITIAL_WEEKDAY_CONFIGS);
  const [timeMode, setTimeMode] = useState<'unified' | 'per_day'>('unified');
  const [durationMode, setDurationMode] = useState<'weeks' | 'total_sessions'>('weeks');
  const [recurrenceWeeks, setRecurrenceWeeks] = useState<number>(4);
  const [targetTotalSessions, setTargetTotalSessions] = useState<number>(10);
  const [excludedSessionDates, setExcludedSessionDates] = useState<Set<string>>(new Set());
  const [showAllPreviewSessions, setShowAllPreviewSessions] = useState(false);

  // Reset or Populate State on Modal Open
  useEffect(() => {
    if (existingAppointment) {
      setScheduleMode('single');
      setPatientId(existingAppointment.patientId);
      setPhysioId(existingAppointment.physioId);
      setDate(existingAppointment.date);
      setStartTime(existingAppointment.startTime);
      setEndTime(existingAppointment.endTime);
      setModality(existingAppointment.modality);
      setServiceType(existingAppointment.serviceType);
      setStatus(existingAppointment.status);
      setSessionValue(existingAppointment.sessionValue || 0);
      setNotes(existingAppointment.notes || '');
    } else {
      setDate(initialDate || todayStr);
      const availablePhysios = physiotherapists.filter((p) => p.role === 'physio');
      if (currentUser.role === 'physio' && !currentUser.isAdmin) {
        setPhysioId(currentUser.id);
      } else {
        setPhysioId(availablePhysios[0]?.id || currentUser.id);
      }
      setStartTime('08:00');
      setEndTime('08:50');
      setStatus('scheduled');
      setNotes('');
      setScheduleMode('single');
      setExcludedSessionDates(new Set());
    }
    setErrorMessage(null);
  }, [isOpen, existingAppointment, initialDate]);

  // When patient changes, automatically sync modality and default sessionValue
  const handleSelectPatient = (id: string) => {
    setPatientId(id);
    const selected = patients.find((p) => p.id === id);
    if (selected) {
      if (selected.healthInsurance) {
        const ins = selected.healthInsurance.toLowerCase();
        if (ins.includes('particular')) {
          setModality('particular');
        } else if (ins.includes('ortra')) {
          setModality('cartao_ortra');
        } else {
          setModality('convenio');
        }
      }
      if (selected.defaultSessionValue) {
        setSessionValue(selected.defaultSessionValue);
      }
    }
  };

  // Auto calculate end time (+50 min)
  const calculateEndTime = (start: string): string => {
    const [h, m] = start.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const totalMinutes = h * 60 + m + 50;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }
    return '08:50';
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    setEndTime(calculateEndTime(newStartTime));
  };

  // Toggle Weekday Selection
  const handleToggleWeekday = (dayOfWeek: number) => {
    setWeekdayConfigs((prev) =>
      prev.map((cfg) => (cfg.dayOfWeek === dayOfWeek ? { ...cfg, selected: !cfg.selected } : cfg))
    );
  };

  // Update specific weekday time
  const handleWeekdayTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setWeekdayConfigs((prev) =>
      prev.map((cfg) => {
        if (cfg.dayOfWeek === dayOfWeek) {
          const updated = { ...cfg, [field]: value };
          if (field === 'startTime') {
            updated.endTime = calculateEndTime(value);
          }
          return updated;
        }
        return cfg;
      })
    );
  };

  // Quick Preset Selection
  const applyPreset = (type: '2x_ter_qui' | '3x_seg_qua_sex' | 'daily' | 'saturdays') => {
    setWeekdayConfigs((prev) =>
      prev.map((cfg) => {
        if (type === '2x_ter_qui') {
          return { ...cfg, selected: cfg.dayOfWeek === 2 || cfg.dayOfWeek === 4 };
        }
        if (type === '3x_seg_qua_sex') {
          return { ...cfg, selected: cfg.dayOfWeek === 1 || cfg.dayOfWeek === 3 || cfg.dayOfWeek === 5 };
        }
        if (type === 'daily') {
          return { ...cfg, selected: cfg.dayOfWeek >= 1 && cfg.dayOfWeek <= 5 };
        }
        if (type === 'saturdays') {
          return { ...cfg, selected: cfg.dayOfWeek === 6 };
        }
        return cfg;
      })
    );
  };

  // Generated Recurring Sessions Calculation
  const generatedSessions: GeneratedSessionPreview[] = useMemo(() => {
    if (scheduleMode !== 'recurring') return [];

    const selectedDays = weekdayConfigs.filter((d) => d.selected);
    if (selectedDays.length === 0 || !date) return [];

    const [y, m, d] = date.split('-').map(Number);
    const startObj = new Date(y, m - 1, d, 12, 0, 0);

    const list: GeneratedSessionPreview[] = [];
    const maxDays = durationMode === 'weeks' ? Math.max(1, recurrenceWeeks) * 7 : 365;
    const current = new Date(startObj);

    for (let i = 0; i < maxDays; i++) {
      const jsDay = current.getDay(); // 0 is Sun, 1 is Mon...
      const matched = selectedDays.find((cfg) => cfg.dayOfWeek === jsDay);

      if (matched) {
        const yr = current.getFullYear();
        const mo = String(current.getMonth() + 1).padStart(2, '0');
        const dy = String(current.getDate()).padStart(2, '0');
        const dateStr = `${yr}-${mo}-${dy}`;

        const finalStart = timeMode === 'unified' ? startTime : matched.startTime;
        const finalEnd = timeMode === 'unified' ? endTime : matched.endTime;

        list.push({
          tempId: `${dateStr}_${finalStart}`,
          date: dateStr,
          dayName: matched.name,
          startTime: finalStart,
          endTime: finalEnd,
          included: !excludedSessionDates.has(dateStr),
        });

        if (durationMode === 'total_sessions' && list.length >= targetTotalSessions) {
          break;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return list;
  }, [
    scheduleMode,
    weekdayConfigs,
    date,
    timeMode,
    startTime,
    endTime,
    durationMode,
    recurrenceWeeks,
    targetTotalSessions,
    excludedSessionDates,
  ]);

  // Active included sessions to be submitted
  const activeSessionsToSubmit = useMemo(
    () => generatedSessions.filter((s) => s.included),
    [generatedSessions]
  );

  // Toggle single session inclusion
  const toggleSessionInclusion = (dateStr: string) => {
    setExcludedSessionDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  // Restore all excluded sessions
  const restoreAllSessions = () => {
    setExcludedSessionDates(new Set());
  };

  if (!isOpen) return null;

  // Filtered patients for dropdown/search
  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return p.fullName.toLowerCase().includes(q) || p.cpf?.includes(q) || p.phone?.includes(q);
  });

  const selectedPatient = patients.find((p) => p.id === patientId);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setErrorMessage('Por favor, selecione um paciente para agendar.');
      return;
    }
    if (!physioId) {
      setErrorMessage('Por favor, selecione o fisioterapeuta responsável.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (existingAppointment) {
        // Single Appointment Update
        const updated: Appointment = {
          ...existingAppointment,
          patientId,
          physioId,
          date,
          startTime,
          endTime,
          modality,
          serviceType,
          status,
          sessionValue: Number(sessionValue) || 0,
          notes: notes.trim(),
          updatedAt: new Date().toISOString(),
        };
        await onSave([updated]);
      } else if (scheduleMode === 'recurring') {
        // Recurring Plan Series
        if (activeSessionsToSubmit.length === 0) {
          setErrorMessage('Nenhuma sessão selecionada. Escolha ao menos um dia da semana para o plano.');
          setIsSubmitting(false);
          return;
        }

        const recurrenceGroupId = generateUUID();
        const newAppointments: Appointment[] = activeSessionsToSubmit.map((sessionItem) => ({
          id: generateUUID(),
          patientId,
          physioId,
          date: sessionItem.date,
          startTime: sessionItem.startTime,
          endTime: sessionItem.endTime,
          modality,
          serviceType,
          status: 'scheduled',
          sessionValue: Number(sessionValue) || 0,
          notes: notes.trim(),
          recurrenceGroupId,
          createdAt: new Date().toISOString(),
        }));

        await onSave(newAppointments);
      } else {
        // New Single Appointment
        const newApt: Appointment = {
          id: generateUUID(),
          patientId,
          physioId,
          date,
          startTime,
          endTime,
          modality,
          serviceType,
          status: 'scheduled',
          sessionValue: Number(sessionValue) || 0,
          notes: notes.trim(),
          createdAt: new Date().toISOString(),
        };
        await onSave([newApt]);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao salvar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedWeekdaysCount = weekdayConfigs.filter((d) => d.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div
        className={`relative w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 transition-all duration-300 ${
          scheduleMode === 'recurring' ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              {scheduleMode === 'recurring' ? (
                <Repeat className="h-6 w-6 text-emerald-300" />
              ) : (
                <Calendar className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {existingAppointment
                  ? 'Editar Agendamento'
                  : scheduleMode === 'recurring'
                  ? 'Plano de Tratamento Recorrente'
                  : 'Novo Agendamento'}
              </h2>
              <p className="text-xs text-emerald-100">
                {existingAppointment
                  ? 'Atualize os dados e o status da sessão'
                  : scheduleMode === 'recurring'
                  ? 'Configure dias, horários e duração de sessões em série'
                  : 'Cadastre a sessão na agenda do profissional'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mode Selector (Apenas para novos agendamentos) */}
        {!existingAppointment && (
          <div className="bg-slate-100/90 p-2 border-b border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScheduleMode('single')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                scheduleMode === 'single'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>Sessão Avulsa / Individual</span>
            </button>

            <button
              type="button"
              onClick={() => setScheduleMode('recurring')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                scheduleMode === 'recurring'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Repeat className="h-4 w-4 text-emerald-600" />
              <span>Plano Recorrente / Pacote</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto no-scrollbar">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Paciente & Fisioterapeuta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" /> Paciente *
                </label>
                {onOpenNewPatientModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewPatientModal();
                    }}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Novo Paciente
                  </button>
                )}
              </div>

              {patients.length > 5 && (
                <input
                  type="text"
                  placeholder="Filtrar paciente por nome ou CPF..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full mb-1.5 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}

              <select
                value={patientId}
                onChange={(e) => handleSelectPatient(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="">Selecione o paciente...</option>
                {filteredPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} {p.phone ? `(${p.phone})` : ''} - {p.healthInsurance || 'Particular'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Profissional Responsável *
              </label>
              {currentUser.role === 'physio' && !currentUser.isAdmin ? (
                <div className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 flex items-center justify-between">
                  <span>{formatPhysioDisplayName(currentUser)}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Sua Agenda</span>
                </div>
              ) : (
                <select
                  value={physioId}
                  onChange={(e) => setPhysioId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  {physiotherapists
                    .filter((ph) => ph.role === 'physio')
                    .map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        {formatPhysioDisplayName(ph)} {ph.crefito ? `(${ph.crefito})` : ''}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>

          {/* ====================================================================
              CONFIGURAÇÃO AVANÇADA: PLANO RECORRENTE
             ==================================================================== */}
          {scheduleMode === 'recurring' && !existingAppointment ? (
            <div className="space-y-4 pt-1">
              {/* Presets Rápidos */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                  Atalhos Rápidos de Frequência:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('2x_ter_qui')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition-colors shadow-2xs"
                  >
                    2x / semana (Ter / Qui)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('3x_seg_qua_sex')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition-colors shadow-2xs"
                  >
                    3x / semana (Seg / Qua / Sex)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('daily')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition-colors shadow-2xs"
                  >
                    Diário (Seg a Sex)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('saturdays')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition-colors shadow-2xs"
                  >
                    Apenas Sábados
                  </button>
                </div>
              </div>

              {/* 1. Escolha de Dias da Semana */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Dias da Semana de Atendimento ({selectedWeekdaysCount} selecionados)
                  </label>
                  <span className="text-[11px] text-slate-500">Clique para ativar/desativar</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {weekdayConfigs.map((cfg) => (
                    <button
                      key={cfg.dayOfWeek}
                      type="button"
                      onClick={() => handleToggleWeekday(cfg.dayOfWeek)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        cfg.selected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold block">{cfg.shortName}</span>
                      <span className="text-[10px] opacity-80 block truncate">{cfg.name.split('-')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Horários: Mesmo Horário vs Horários Independentes por Dia */}
              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-600" /> 2. Definição de Horários
                  </span>

                  <div className="inline-flex p-0.5 bg-white border border-slate-200 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setTimeMode('unified')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        timeMode === 'unified'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Mesmo Horário
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeMode('per_day')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        timeMode === 'per_day'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Horário por Dia
                    </button>
                  </div>
                </div>

                {timeMode === 'unified' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Horário de Início (todos os dias selecionados)
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Horário de Término
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-slate-500">
                      Configure os horários individualmente para cada dia selecionado:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {weekdayConfigs
                        .filter((c) => c.selected)
                        .map((cfg) => (
                          <div
                            key={cfg.dayOfWeek}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1 text-xs"
                          >
                            <span className="font-bold text-slate-800 block">{cfg.name}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={cfg.startTime}
                                onChange={(e) =>
                                  handleWeekdayTimeChange(cfg.dayOfWeek, 'startTime', e.target.value)
                                }
                                className="px-2 py-1 text-xs border border-slate-200 rounded-lg flex-1 font-semibold"
                              />
                              <span className="text-slate-400">às</span>
                              <input
                                type="time"
                                value={cfg.endTime}
                                onChange={(e) =>
                                  handleWeekdayTimeChange(cfg.dayOfWeek, 'endTime', e.target.value)
                                }
                                className="px-2 py-1 text-xs border border-slate-200 rounded-lg flex-1 font-semibold"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Duração e Início do Plano */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Data de Início do Plano *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Modo de Repetição
                    </label>
                    <div className="inline-flex gap-2 text-[11px] font-semibold">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="durationMode"
                          checked={durationMode === 'weeks'}
                          onChange={() => setDurationMode('weeks')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Por Semanas</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="durationMode"
                          checked={durationMode === 'total_sessions'}
                          onChange={() => setDurationMode('total_sessions')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Total Sessões</span>
                      </label>
                    </div>
                  </div>

                  {durationMode === 'weeks' ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={recurrenceWeeks}
                          onChange={(e) => setRecurrenceWeeks(Math.max(1, Number(e.target.value)))}
                          className="w-20 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                        />
                        <span className="text-xs text-slate-600 font-medium">semanas de tratamento</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[2, 4, 6, 8, 12].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setRecurrenceWeeks(w)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              recurrenceWeeks === w
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {w} sem
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={targetTotalSessions}
                          onChange={(e) => setTargetTotalSessions(Math.max(1, Number(e.target.value)))}
                          className="w-20 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                        />
                        <span className="text-xs text-slate-600 font-medium">sessões no total</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[5, 10, 15, 20].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setTargetTotalSessions(s)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              targetTotalSessions === s
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {s} sessões
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Pré-visualização Interativa das Sessões Geradas */}
              {generatedSessions.length > 0 && (
                <div className="p-4 bg-teal-50/40 border border-teal-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/80 pb-2">
                    <div>
                      <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block">
                        Pré-visualização do Plano de Tratamento
                      </span>
                      <span className="text-[11px] text-teal-700">
                        {activeSessionsToSubmit.length} sessões ativas geradas · Início em{' '}
                        {formatDateCompact(date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {excludedSessionDates.size > 0 && (
                        <button
                          type="button"
                          onClick={restoreAllSessions}
                          className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Restaurar todas
                        </button>
                      )}
                      <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-teal-200">
                        R$ {(activeSessionsToSubmit.length * (Number(sessionValue) || 0)).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Sessões em Grid Compacto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                    {(showAllPreviewSessions ? generatedSessions : generatedSessions.slice(0, 9)).map(
                      (item, idx) => (
                        <div
                          key={item.tempId}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                            item.included
                              ? 'bg-white border-teal-200 shadow-2xs'
                              : 'bg-slate-100/60 border-slate-200 text-slate-400 line-through opacity-60'
                          }`}
                        >
                          <div className="min-w-0 pr-1">
                            <span className="font-bold text-[11px] block truncate">
                              #{idx + 1} {item.dayName.split('-')[0]}, {formatDateCompact(item.date).split(',')[1]}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {item.startTime} às {item.endTime}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleSessionInclusion(item.date)}
                            className={`p-1 rounded transition-colors ${
                              item.included
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-teal-600 hover:text-teal-800 hover:bg-teal-50'
                            }`}
                            title={item.included ? 'Desmarcar esta sessão' : 'Reativar esta sessão'}
                          >
                            {item.included ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {generatedSessions.length > 9 && (
                    <button
                      type="button"
                      onClick={() => setShowAllPreviewSessions(!showAllPreviewSessions)}
                      className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center justify-center gap-1 w-full pt-1"
                    >
                      {showAllPreviewSessions ? (
                        <>
                          <span>Mostrar menos</span>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Ver todas as {generatedSessions.length} sessões</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ====================================================================
               MODO INDIVIDUAL: DATA E HORÁRIOS SIMPLES
               ==================================================================== */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Data *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" /> Início *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" /> Término *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Dados Clínicos e Financeiros Comuns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Modalidade
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as AppointmentModality)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="particular">Particular</option>
                <option value="convenio">Convênio</option>
                <option value="cartao_ortra">Cartão Ortra</option>
                <option value="retorno">Retorno / Cortesia</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-emerald-600" /> Tipo de Atendimento
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                {SERVICE_OPTIONS.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Valor / Sessão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sessionValue}
                onChange={(e) => setSessionValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Observações Clínicas */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-emerald-600" /> Observações Clínicas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Paciente com dor lombar aguda ao levantar; Trazer exames de ressonância..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 hover:shadow-md"
            >
              <CheckCircle className="h-4 w-4" />
              {isSubmitting
                ? 'Gravando...'
                : existingAppointment
                ? 'Atualizar Agendamento'
                : scheduleMode === 'recurring'
                ? `Confirmar ${activeSessionsToSubmit.length} Sessões do Plano`
                : 'Salvar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
