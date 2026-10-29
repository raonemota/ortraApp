/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Clock,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  FileText,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  Appointment,
  AppointmentStatus,
  Patient,
  UserProfile,
} from '../types/index.ts';
import {
  hasAdminPrivileges,
  formatPhysioDisplayName,
  isReceptionist,
  formatDateCompact,
} from '../utils/clinicalCalculations.ts';

export type ScheduleViewMode = 'day' | 'week' | 'month';

interface ScheduleViewProps {
  currentUser: UserProfile;
  physioList: UserProfile[];
  patients: Patient[];
  appointments: Appointment[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenNewAppointment: (prefilledDate?: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onStartEvolution: (patient: Patient, appointment: Appointment) => void;
  onViewPatientRecord: (patientId: string) => void;
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: any }
> = {
  scheduled: {
    label: 'Agendado',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'Em Atendimento',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: Activity,
  },
  completed: {
    label: 'Concluído',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle,
  },
  missed: {
    label: 'Falta',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelado',
    bg: 'bg-zinc-100',
    text: 'text-zinc-500',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
    icon: XCircle,
  },
};

const WEEKDAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Returns the 7 dates of the week (Monday to Sunday) containing dateStr (YYYY-MM-DD)
 */
function getWeekDates(dateStr: string): string[] {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    const dayOfWeek = current.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(monday);
      nextDate.setDate(monday.getDate() + i);
      const yr = nextDate.getFullYear();
      const mo = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dy = String(nextDate.getDate()).padStart(2, '0');
      dates.push(`${yr}-${mo}-${dy}`);
    }
    return dates;
  } catch {
    return [dateStr];
  }
}

/**
 * Returns month matrix cells (Monday to Sunday) for the month containing dateStr
 */
function getMonthCalendarGrid(dateStr: string) {
  try {
    const [year, month] = dateStr.split('-').map(Number);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Monday aligned: Sun is 6 leading offset, Mon is 0...
    const firstDayWeekday = firstDayOfMonth.getDay();
    const leadingDays = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    const prevMonthLastDate = new Date(year, month - 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // 1. Leading days from previous month
    for (let i = leadingDays - 1; i >= 0; i--) {
      const day = prevMonthLastDate - i;
      const prevDate = new Date(year, month - 2, day);
      const yr = prevDate.getFullYear();
      const mo = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dy = String(day).padStart(2, '0');
      const fullDate = `${yr}-${mo}-${dy}`;
      cells.push({
        dateStr: fullDate,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: fullDate === todayStr,
      });
    }

    // 2. Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const yr = year;
      const mo = String(month).padStart(2, '0');
      const dy = String(d).padStart(2, '0');
      const fullDate = `${yr}-${mo}-${dy}`;
      cells.push({
        dateStr: fullDate,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: fullDate === todayStr,
      });
    }

    // 3. Trailing days from next month to complete rows of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month, d);
      const yr = nextDate.getFullYear();
      const mo = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dy = String(d).padStart(2, '0');
      const fullDate = `${yr}-${mo}-${dy}`;
      cells.push({
        dateStr: fullDate,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: fullDate === todayStr,
      });
    }

    return cells;
  } catch {
    return [];
  }
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  currentUser,
  physioList,
  patients,
  appointments,
  selectedDate,
  onSelectDate,
  onOpenNewAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onUpdateStatus,
  onStartEvolution,
  onViewPatientRecord,
}) => {
  const isAdmin = hasAdminPrivileges(currentUser);
  const isRec = isReceptionist(currentUser);
  const canSwitchPhysio = isAdmin || isRec;

  // View Mode: 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('day');

  // Filters
  const [selectedPhysioFilter, setSelectedPhysioFilter] = useState<string>(
    canSwitchPhysio ? 'all' : currentUser.id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Map patient lookup
  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  // Map physio lookup
  const physioMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    physioList.forEach((ph) => map.set(ph.id, ph));
    return map;
  }, [physioList]);

  // Base filtered appointments according to physio permissions and status/search filters
  const scopedAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Regra de Isolamento: Fisioterapeuta só vê suas próprias sessões
      if (!canSwitchPhysio) {
        if (apt.physioId !== currentUser.id) return false;
      } else if (selectedPhysioFilter !== 'all') {
        if (apt.physioId !== selectedPhysioFilter) return false;
      }

      if (statusFilter !== 'all' && apt.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pat = patientMap.get(apt.patientId);
        const matchName = pat?.fullName.toLowerCase().includes(q);
        const matchPhone = pat?.phone?.includes(q);
        const matchService = apt.serviceType.toLowerCase().includes(q);
        const matchNotes = apt.notes && apt.notes.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchService && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, canSwitchPhysio, currentUser.id, selectedPhysioFilter, statusFilter, searchQuery, patientMap]);

  // Helper date shifts for Day, Week, and Month
  const shiftDay = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    onSelectDate(dateObj.toISOString().split('T')[0]);
  };

  const shiftWeek = (weeks: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + weeks * 7);
    onSelectDate(dateObj.toISOString().split('T')[0]);
  };

  const shiftMonth = (months: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1 + months, 1);
    const yr = dateObj.getFullYear();
    const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
    // Preserve day or clamp
    const daysInTarget = new Date(yr, dateObj.getMonth() + 1, 0).getDate();
    const clampedDay = Math.min(d, daysInTarget);
    const dy = String(clampedDay).padStart(2, '0');
    onSelectDate(`${yr}-${mo}-${dy}`);
  };

  // Week Dates list
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  // Month Cells list
  const monthCells = useMemo(() => getMonthCalendarGrid(selectedDate), [selectedDate]);

  // Titles based on active view mode
  const currentTitle = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      if (viewMode === 'day') {
        return new Intl.DateTimeFormat('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(dateObj);
      }

      if (viewMode === 'week') {
        const first = weekDates[0];
        const last = weekDates[6];
        const [y1, m1, d1] = first.split('-').map(Number);
        const [y2, m2, d2] = last.split('-').map(Number);
        const date1 = new Date(y1, m1 - 1, d1);
        const date2 = new Date(y2, m2 - 1, d2);

        const fmtDayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
        return `Semana de ${fmtDayMonth.format(date1)} a ${fmtDayMonth.format(date2)} de ${y2}`;
      }

      if (viewMode === 'month') {
        return new Intl.DateTimeFormat('pt-BR', {
          month: 'long',
          year: 'numeric',
        }).format(dateObj);
      }
    } catch {
      return selectedDate;
    }
    return selectedDate;
  }, [viewMode, selectedDate, weekDates]);

  // Compact title for mobile
  const compactTitle = useMemo(() => {
    if (viewMode === 'day') return formatDateCompact(selectedDate);
    if (viewMode === 'week') {
      const first = weekDates[0];
      const last = weekDates[6];
      const [, m1, d1] = first.split('-');
      const [, m2, d2] = last.split('-');
      return `${d1}/${m1} a ${d2}/${m2}`;
    }
    try {
      const [y, m] = selectedDate.split('-').map(Number);
      return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(y, m - 1, 1));
    } catch {
      return selectedDate;
    }
  }, [viewMode, selectedDate, weekDates]);

  // Day Appointments for the selected date
  const dayAppointments = useMemo(() => {
    return scopedAppointments
      .filter((apt) => apt.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [scopedAppointments, selectedDate]);

  // Appointments grouped by date in the current week
  const weekAppointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    weekDates.forEach((d) => map.set(d, []));
    scopedAppointments.forEach((apt) => {
      if (map.has(apt.date)) {
        map.get(apt.date)!.push(apt);
      }
    });
    // Sort each day
    map.forEach((list) => list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [scopedAppointments, weekDates]);

  // Appointments grouped by date in the current month
  const monthAppointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    scopedAppointments.forEach((apt) => {
      const currentList = map.get(apt.date) || [];
      currentList.push(apt);
      map.set(apt.date, currentList);
    });
    map.forEach((list) => list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [scopedAppointments]);

  // Dynamic Metrics based on active view mode (Day / Week / Month)
  const currentMetrics = useMemo(() => {
    let relevantList: Appointment[] = [];
    if (viewMode === 'day') {
      relevantList = dayAppointments;
    } else if (viewMode === 'week') {
      relevantList = scopedAppointments.filter((a) => weekDates.includes(a.date));
    } else if (viewMode === 'month') {
      const [y, m] = selectedDate.split('-');
      const prefix = `${y}-${m}`;
      relevantList = scopedAppointments.filter((a) => a.date.startsWith(prefix));
    }

    const total = relevantList.length;
    const confirmed = relevantList.filter((a) => a.status === 'confirmed').length;
    const inProgress = relevantList.filter((a) => a.status === 'in_progress').length;
    const completed = relevantList.filter((a) => a.status === 'completed').length;
    const missed = relevantList.filter((a) => a.status === 'missed' || a.status === 'cancelled').length;

    return { total, confirmed, inProgress, completed, missed };
  }, [viewMode, dayAppointments, scopedAppointments, weekDates, selectedDate]);

  // Clean phone to WhatsApp link
  const getWhatsAppLink = (patientName: string, phone?: string, startTime?: string) => {
    if (!phone) return null;
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) return null;
    const fullNumber = cleanDigits.length === 11 || cleanDigits.length === 10 ? `55${cleanDigits}` : cleanDigits;
    const msg = encodeURIComponent(
      `Olá ${patientName}, tudo bem? Aqui é da Clínica Ortra Fisioterapia. Confirmamos seu atendimento agendado para ${formatDateCompact(selectedDate)} às ${startTime || ''}. Qualquer dúvida estamos à disposição!`
    );
    return `https://wa.me/${fullNumber}?text=${msg}`;
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Left: View Mode Switcher (Dia | Semana | Mês) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Dia</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="h-3.5 w-3.5 text-emerald-600" />
                <span>Semana</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mês</span>
              </button>
            </div>

            {/* Date Navigation depending on View Mode */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'day') shiftDay(-1);
                  else if (viewMode === 'week') shiftWeek(-1);
                  else shiftMonth(-1);
                }}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors text-xs font-semibold"
                title={
                  viewMode === 'day'
                    ? 'Dia anterior'
                    : viewMode === 'week'
                    ? 'Semana anterior'
                    : 'Mês anterior'
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => onSelectDate(todayStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                  selectedDate === todayStr
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'day') shiftDay(1);
                  else if (viewMode === 'week') shiftWeek(1);
                  else shiftMonth(1);
                }}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors text-xs font-semibold"
                title={
                  viewMode === 'day'
                    ? 'Próximo dia'
                    : viewMode === 'week'
                    ? 'Próxima semana'
                    : 'Próximo mês'
                }
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Direct date picker */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && onSelectDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Center: Current Title */}
          <div className="text-left lg:text-center">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">{currentTitle}</span>
              <span className="sm:hidden">{compactTitle}</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              {viewMode === 'day' && 'Painel diário de atendimentos ortopédicos'}
              {viewMode === 'week' && 'Planejamento semanal de atendimentos'}
              {viewMode === 'month' && 'Visão panorâmica e ocupação mensal da clínica'}
            </p>
          </div>

          {/* Right: New Appointment Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenNewAppointment(selectedDate)}
              className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 sm:gap-2 hover:shadow-md active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Agendamento</span>
              <span className="sm:hidden">+ Agendar</span>
            </button>
          </div>
        </div>

        {/* Filters Bar: Physio, Status & Search */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Physio Selector: Apenas Admin e Recepção alternam entre profissionais */}
            {canSwitchPhysio ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                  <span className="sm:hidden">Fisio:</span>
                  <span className="hidden sm:inline">Profissional:</span>
                </label>
                <select
                  value={selectedPhysioFilter}
                  onChange={(e) => setSelectedPhysioFilter(e.target.value)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[200px] sm:max-w-none truncate"
                >
                  {isAdmin && <option value="all">Todos os Profissionais (Visão Geral)</option>}
                  {isRec && <option value="all">Todos os Fisioterapeutas</option>}
                  {physioList
                    .filter((ph) => ph.role === 'physio')
                    .map((ph) => (
                      <option key={ph.id} value={ph.id}>
                        {formatPhysioDisplayName(ph)} {ph.crefito ? `(${ph.crefito})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Sua Agenda: {formatPhysioDisplayName(currentUser)}</span>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos os Status</option>
                <option value="scheduled">Agendados</option>
                <option value="confirmed">Confirmados</option>
                <option value="in_progress">Em Atendimento</option>
                <option value="completed">Concluídos</option>
                <option value="missed">Faltas</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente ou sessão..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {viewMode === 'day' ? 'Total do Dia' : viewMode === 'week' ? 'Total da Semana' : 'Total do Mês'}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{currentMetrics.total}</span>
            <span className="text-xs text-slate-400 font-medium">sessões</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
            Confirmados
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-700">{currentMetrics.confirmed}</span>
            <span className="text-xs text-blue-400 font-medium">pacientes</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Em Atendimento
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-800">{currentMetrics.inProgress}</span>
            <span className="text-xs text-amber-500 font-medium">na sala</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Concluídos
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">{currentMetrics.completed}</span>
            <span className="text-xs text-emerald-400 font-medium">evoluídos</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
            Faltas / Cancel.
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-700">{currentMetrics.missed}</span>
            <span className="text-xs text-rose-400 font-medium">ausências</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN SCHEDULE CONTENT AREA: DAY, WEEK, OR MONTH */}

      {/* =========================================================================
          VIEW MODE 1: DIA (VISÃO DIÁRIA DETALHADA COM AÇÕES RÁPIDAS)
         ========================================================================= */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          {dayAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Nenhum paciente agendado para este dia
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                Não há atendimentos programados para {currentTitle} com os filtros selecionados.
              </p>
              <button
                type="button"
                onClick={() => onOpenNewAppointment(selectedDate)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agendar Atendimento para {compactTitle}
              </button>
            </div>
          ) : (
            dayAppointments.map((apt) => {
              const patient = patientMap.get(apt.patientId);
              const physio = physioMap.get(apt.physioId);
              const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;
              const waLink = patient ? getWhatsAppLink(patient.fullName, patient.phone, apt.startTime) : null;

              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
                >
                  {/* Left: Time & Patient Information */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Time block */}
                    <div className="bg-slate-900 text-white rounded-xl p-2.5 sm:p-3 text-center min-w-[76px] sm:min-w-[88px] shrink-0 shadow-xs">
                      <span className="block text-sm sm:text-base font-black tracking-tight">
                        {apt.startTime}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium">
                        às {apt.endTime}
                      </span>
                    </div>

                    {/* Patient Information */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {!isRec ? (
                          <button
                            type="button"
                            onClick={() => onViewPatientRecord(apt.patientId)}
                            className="text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-600 transition-colors truncate text-left"
                          >
                            {patient ? patient.fullName : 'Paciente não encontrado'}
                          </button>
                        ) : (
                          <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {patient ? patient.fullName : 'Paciente não encontrado'}
                          </span>
                        )}

                        {/* Interactive Status Selector */}
                        <div className="relative inline-block">
                          <select
                            value={apt.status}
                            onChange={(e) => onUpdateStatus(apt.id, e.target.value as AppointmentStatus)}
                            className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            <option value="scheduled">Agendado</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="in_progress">Em Atendimento</option>
                            <option value="completed">Concluído</option>
                            <option value="missed">Falta</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>

                        {/* Modality tag */}
                        <span className="text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {apt.modality === 'particular' ? (
                            'Particular'
                          ) : apt.modality === 'convenio' ? (
                            patient?.healthInsurance || 'Convênio'
                          ) : apt.modality === 'cartao_ortra' ? (
                            'Cartão Ortra'
                          ) : (
                            'Retorno'
                          )}
                        </span>
                      </div>

                      {/* Service & Physio info */}
                      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-emerald-800">
                          <Activity className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          {apt.serviceType}
                        </span>

                        {physio && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="sm:hidden">Fisio:</span>
                            <span className="hidden sm:inline">Fisioterapeuta:</span>
                            <span>{formatPhysioDisplayName(physio)}</span>
                          </span>
                        )}

                        {patient?.phone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {patient.phone}
                          </span>
                        )}
                      </div>

                      {/* Notes if any */}
                      {apt.notes && (
                        <div className="mt-1 p-2 bg-amber-50/70 border border-amber-100 rounded-lg text-xs text-amber-900 flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="italic">{apt.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    {/* WhatsApp Quick Confirmation Link */}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
                        title="Confirmar via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                        <span className="sm:hidden">Whats</span>
                      </a>
                    )}

                    {/* Ver Prontuário: Apenas Fisioterapeutas e Admins */}
                    {!isRec && (
                      <button
                        type="button"
                        onClick={() => onViewPatientRecord(apt.patientId)}
                        className="p-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                        title="Acessar prontuário do paciente"
                      >
                        <FileText className="h-4 w-4 text-slate-600" />
                        <span className="hidden sm:inline">Prontuário</span>
                        <span className="sm:hidden">Ficha</span>
                      </button>
                    )}

                    {/* Iniciar Atendimento / Evolução */}
                    {!isRec && patient && (
                      <button
                        type="button"
                        onClick={() => onStartEvolution(patient, apt)}
                        className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-xs ${
                          apt.status === 'completed'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                        title="Registrar evolução clínica da sessão"
                      >
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {apt.status === 'completed' ? 'Nova Evolução' : 'Evoluir Sessão'}
                        </span>
                        <span className="sm:hidden">Evoluir</span>
                      </button>
                    )}

                    {/* Edit Appointment */}
                    <button
                      type="button"
                      onClick={() => onEditAppointment(apt)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar agendamento"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete Appointment */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Deseja realmente cancelar este agendamento?')) {
                          onDeleteAppointment(apt.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir da agenda"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: SEMANA (VISÃO SEMANAL EM GRADE COM 7 DIAS)
         ========================================================================= */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          {/* Quick Mobile Day Selector Tabs */}
          <div className="lg:hidden flex overflow-x-auto no-scrollbar gap-2 pb-2">
            {weekDates.map((dateStr, idx) => {
              const dayList = weekAppointmentsByDate.get(dateStr) || [];
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const dayNum = dateStr.split('-')[2];
              const weekday = WEEKDAY_NAMES[idx];

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-xs font-semibold shrink-0 min-w-[70px] transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : isToday
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-80">{weekday}</span>
                  <span className="text-base font-black">{dayNum}</span>
                  <span
                    className={`mt-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : dayList.length > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayList.length} {dayList.length === 1 ? 'sessão' : 'sessões'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop 7-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weekDates.map((dateStr, idx) => {
              const dayList = weekAppointmentsByDate.get(dateStr) || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayNum = dateStr.split('-')[2];
              const weekday = WEEKDAY_NAMES[idx];

              return (
                <div
                  key={dateStr}
                  className={`flex flex-col rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500'
                      : isToday
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Column Header */}
                  <div
                    onClick={() => onSelectDate(dateStr)}
                    className={`p-3 border-b cursor-pointer flex items-center justify-between rounded-t-2xl transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : isToday
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                        : 'bg-slate-50/80 hover:bg-slate-100/80 text-slate-800 border-slate-100'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] uppercase font-bold tracking-wider block opacity-90">
                        {weekday}
                      </span>
                      <span className="text-base font-black">{dayNum}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {dayList.length}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNewAppointment(dateStr);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isSelected
                            ? 'hover:bg-white/20 text-white'
                            : 'hover:bg-slate-200 text-slate-600'
                        }`}
                        title={`Novo agendamento para ${dayNum}/${dateStr.split('-')[1]}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Appointments list for this day */}
                  <div className="p-2 space-y-2 flex-1 min-h-[140px] max-h-[480px] overflow-y-auto no-scrollbar">
                    {dayList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-3 text-center text-slate-400">
                        <span className="text-[11px] font-medium">Sem sessões</span>
                        <button
                          type="button"
                          onClick={() => onOpenNewAppointment(dateStr)}
                          className="mt-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Agendar</span>
                        </button>
                      </div>
                    ) : (
                      dayList.map((apt) => {
                        const pat = patientMap.get(apt.patientId);
                        const physio = physioMap.get(apt.physioId);
                        const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;

                        return (
                          <div
                            key={apt.id}
                            className="p-2 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs transition-all text-xs space-y-1 relative group"
                          >
                            {/* Time & Status indicator */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-slate-900 text-[11px]">
                                {apt.startTime}
                              </span>
                              <span
                                className={`h-2 w-2 rounded-full ${statusConfig.dot}`}
                                title={statusConfig.label}
                              />
                            </div>

                            {/* Patient Name */}
                            <div className="font-bold text-slate-800 text-[11px] truncate">
                              {pat ? pat.fullName : 'Paciente'}
                            </div>

                            {/* Service and modality info */}
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                              <span>{apt.serviceType}</span>
                              <span>·</span>
                              <span className="capitalize">{apt.modality}</span>
                            </div>

                            {/* Show physio name if in clinic-wide view */}
                            {canSwitchPhysio && selectedPhysioFilter === 'all' && physio && (
                              <div className="text-[9px] text-slate-400 truncate">
                                {formatPhysioDisplayName(physio)}
                              </div>
                            )}

                            {/* Action shortcuts on hover / touch */}
                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                              <span className={`text-[9px] font-semibold ${statusConfig.text}`}>
                                {statusConfig.label}
                              </span>

                              <div className="flex items-center gap-1">
                                {!isRec && pat && (
                                  <button
                                    type="button"
                                    onClick={() => onStartEvolution(pat, apt)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Evoluir"
                                  >
                                    <Activity className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onEditAppointment(apt)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded"
                                  title="Editar"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: MÊS (CALENDÁRIO MENSAL COM VISÃO PANORÂMICA)
         ========================================================================= */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Weekdays Row */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600">
              {WEEKDAY_NAMES.map((w) => (
                <div key={w} className="py-2.5">
                  <span className="hidden sm:inline">
                    {w === 'Seg'
                      ? 'Segunda'
                      : w === 'Ter'
                      ? 'Terça'
                      : w === 'Qua'
                      ? 'Quarta'
                      : w === 'Qui'
                      ? 'Quinta'
                      : w === 'Sex'
                      ? 'Sexta'
                      : w === 'Sáb'
                      ? 'Sábado'
                      : 'Domingo'}
                  </span>
                  <span className="sm:hidden">{w}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {monthCells.map((cell) => {
                const dayApts = monthAppointmentsByDate.get(cell.dateStr) || [];
                const isSelected = cell.dateStr === selectedDate;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => onSelectDate(cell.dateStr)}
                    className={`min-h-[75px] sm:min-h-[105px] p-1.5 sm:p-2 cursor-pointer transition-all flex flex-col justify-between ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/50 text-slate-300'
                        : isSelected
                        ? 'bg-emerald-50/40 ring-2 ring-inset ring-emerald-500'
                        : cell.isToday
                        ? 'bg-emerald-50/15 hover:bg-emerald-50/30'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Day number & indicators */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold flex items-center justify-center rounded-lg h-5 w-5 sm:h-6 sm:w-6 ${
                          cell.isToday
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isSelected
                            ? 'bg-slate-900 text-white'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-300'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Count badge */}
                      {dayApts.length > 0 && (
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            dayApts.length >= 6
                              ? 'bg-emerald-100 text-emerald-800 font-black'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {dayApts.length} <span className="hidden sm:inline">sessões</span>
                        </span>
                      )}
                    </div>

                    {/* Preview of appointments (Desktop only) */}
                    <div className="hidden sm:flex flex-col gap-1 mt-1 flex-1 overflow-hidden">
                      {dayApts.slice(0, 2).map((apt) => {
                        const pat = patientMap.get(apt.patientId);
                        const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;

                        return (
                          <div
                            key={apt.id}
                            className="text-[10px] truncate px-1.5 py-0.5 rounded bg-slate-100/80 text-slate-700 flex items-center gap-1"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                            <span className="font-bold text-[9px] shrink-0">{apt.startTime}</span>
                            <span className="truncate">{pat?.fullName || 'Paciente'}</span>
                          </div>
                        );
                      })}

                      {dayApts.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1">
                          +{dayApts.length - 2} mais
                        </span>
                      )}
                    </div>

                    {/* Mobile dot summary */}
                    <div className="sm:hidden flex items-center justify-center gap-0.5 mt-1">
                      {dayApts.slice(0, 3).map((a) => (
                        <span
                          key={a.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            STATUS_CONFIG[a.status]?.dot || 'bg-slate-400'
                          }`}
                        />
                      ))}
                      {dayApts.length > 3 && (
                        <span className="text-[8px] text-slate-400 font-bold">+</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Drawer below Month View */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Atendimentos em {formatDateCompact(selectedDate)} ({dayAppointments.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Abrir em Modo Diário</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenNewAppointment(selectedDate)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Agendar Neste Dia</span>
                </button>
              </div>
            </div>

            {dayAppointments.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Nenhum atendimento agendado para {formatDateCompact(selectedDate)}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {dayAppointments.map((apt) => {
                  const pat = patientMap.get(apt.patientId);
                  const physio = physioMap.get(apt.physioId);
                  const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled;

                  return (
                    <div
                      key={apt.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-all text-xs space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {apt.startTime} - {apt.endTime}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 text-sm block truncate">
                          {pat?.fullName || 'Paciente'}
                        </span>
                        <span className="text-slate-500 text-[11px] block truncate">
                          {apt.serviceType} · <span className="capitalize">{apt.modality}</span>
                        </span>
                        {canSwitchPhysio && physio && (
                          <span className="text-slate-400 text-[10px] block truncate">
                            {formatPhysioDisplayName(physio)}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => onEditAppointment(apt)}
                          className="text-slate-500 hover:text-slate-800 font-medium text-[11px]"
                        >
                          Editar
                        </button>
                        {!isRec && pat && (
                          <button
                            type="button"
                            onClick={() => onStartEvolution(pat, apt)}
                            className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] flex items-center gap-1"
                          >
                            <Activity className="h-3 w-3" />
                            <span>Evoluir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
