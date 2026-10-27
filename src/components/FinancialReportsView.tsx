/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
} from 'lucide-react';
import {
  UserProfile,
  Patient,
  Evolution,
  HealthInsurancePlan,
} from '../types/index.ts';
import {
  formatCurrencyBRL,
  calculateFinancialMetrics,
  hasAdminPrivileges,
  formatPhysioDisplayName,
} from '../utils/clinicalCalculations.ts';
import { clinicalStorage } from '../services/storageService.ts';

interface FinancialReportsViewProps {
  currentUser: UserProfile;
  patients: Patient[];
  evolutions: Evolution[];
  onEvolutionsUpdated: () => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  currentUser,
  patients,
  evolutions,
  onEvolutionsUpdated,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('month');
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const isAdmin = hasAdminPrivileges(currentUser);

  // Filtered patients for dropdown
  const visiblePatients = useMemo(() => {
    if (isAdmin) return patients;
    return patients.filter((p) => p.physioId === currentUser.id);
  }, [patients, isAdmin, currentUser.id]);

  // Filter evolutions
  const filteredEvolutions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Physio only sees their own sessions unless has admin privileges
    let list = evolutions.filter((e) => {
      if (isAdmin) return true;
      return e.physioId === currentUser.id;
    });

    if (patientFilter !== 'all') {
      list = list.filter((e) => e.patientId === patientFilter);
    }

    if (paymentFilter !== 'all') {
      list = list.filter((e) => e.paymentStatus === paymentFilter);
    }

    if (periodFilter === 'today') {
      list = list.filter((e) => e.sessionDate.startsWith(todayStr));
    } else if (periodFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      list = list.filter((e) => new Date(e.sessionDate) >= oneWeekAgo);
    } else if (periodFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      list = list.filter((e) => new Date(e.sessionDate) >= startOfMonth);
    }

    return list.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [evolutions, isAdmin, currentUser.id, patientFilter, paymentFilter, periodFilter]);

  // Compute metrics with user commission rate
  const metrics = useMemo(() => {
    return calculateFinancialMetrics(
      filteredEvolutions.map((e) => ({
        sessionValue: e.sessionValue,
        paymentStatus: e.paymentStatus,
        attendanceStatus: e.attendanceStatus,
      })),
      currentUser.commissionRate || 60
    );
  }, [filteredEvolutions, currentUser.commissionRate]);

  // Toggle payment status directly
  const handleTogglePayment = (evolution: Evolution) => {
    const nextStatus = evolution.paymentStatus === 'paid' ? 'pending' : 'paid';
    const updated: Evolution = {
      ...evolution,
      paymentStatus: nextStatus,
    };
    clinicalStorage.saveEvolution(updated);
    onEvolutionsUpdated();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Data', 'Paciente', 'Sessao', 'Presenca', 'Valor', 'Status Pagamento', 'Forma', 'Fisioterapeuta'],
      ...filteredEvolutions.map((e) => {
        const pat = patients.find((p) => p.id === e.patientId);
        return [
          new Date(e.sessionDate).toLocaleDateString('pt-BR'),
          `"${pat?.fullName || e.patientId}"`,
          `Sessão #${e.sessionNumber}`,
          e.attendanceStatus === 'completed' ? 'Realizada' : 'Falta',
          e.sessionValue.toString(),
          e.paymentStatus === 'paid' ? 'Pago' : 'Pendente',
          e.paymentMethod || 'N/A',
          formatPhysioDisplayName(currentUser),
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_ortra_${periodFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Controle Financeiro e Repasse
            </h1>
            <span className="text-xs text-slate-500">
              · Comissão do Profissional: <strong>{currentUser.commissionRate}%</strong>
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Acompanhamento de atendimentos, faturamento bruto e valor líquido repassado pela Clínica Ortra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Faturamento Bruto */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Faturamento Bruto</span>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-teal-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatCurrencyBRL(metrics.grossTotal)}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            {metrics.completedCount} sessões realizadas ({metrics.missedCount} faltas)
          </p>
        </div>

        {/* Card 2: Repasse Líquido Fisioterapeuta */}
        <div className="rounded-xl sm:rounded-2xl border border-teal-200 bg-teal-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-teal-800 mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              Seu Repasse Líquido ({currentUser.commissionRate}%)
            </span>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-teal-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-900">
            {formatCurrencyBRL(metrics.physioNetEarned)}
          </div>
          <p className="text-[11px] sm:text-xs text-teal-700 mt-1">
            Calculado sobre as sessões já pagas ({formatCurrencyBRL(metrics.paidTotal)})
          </p>
        </div>

        {/* Card 3: Retenção da Clínica Ortra */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              Clínica Ortra ({100 - (currentUser.commissionRate || 60)}%)
            </span>
            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatCurrencyBRL(metrics.clinicRetained)}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Custos estruturais e taxa institucional
          </p>
        </div>

        {/* Card 4: Pendente a Receber */}
        <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Pendente a Receber</span>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900">
            {formatCurrencyBRL(metrics.pendingTotal)}
          </div>
          <p className="text-[11px] sm:text-xs text-amber-700 mt-1">
            Faturamento de convênios / recibos abertos
          </p>
        </div>
      </div>

      {/* Filter Toolbar (Mobile-Safe: no overflow, clean stacking) */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Period Selector (Segmented buttons with horizontal scroll if needed) */}
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-full">
          <button
            type="button"
            onClick={() => setPeriodFilter('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 whitespace-nowrap ${
              periodFilter === 'today'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 whitespace-nowrap ${
              periodFilter === 'week'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 whitespace-nowrap ${
              periodFilter === 'month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Este Mês
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 whitespace-nowrap ${
              periodFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas
          </button>
        </div>

        {/* Filters for Patient and Payment (Responsive & Full-Width Contained) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          {/* Patient select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-1 sm:flex-initial min-w-0">
            <User className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 truncate"
            >
              <option value="all">Todos os Pacientes</option>
              {visiblePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-1 sm:flex-initial min-w-0">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
            >
              <option value="all">Todos os Status</option>
              <option value="paid">Somente Pagos</option>
              <option value="pending">Somente Pendentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Data e Hora</th>
                <th className="py-2.5 px-3">Paciente</th>
                <th className="py-2.5 px-3">Sessão #</th>
                <th className="py-2.5 px-3">Presença</th>
                <th className="py-2.5 px-3">Valor Bruto</th>
                <th className="py-2.5 px-3">Repasse ({currentUser.commissionRate}%)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvolutions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhuma sessão encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEvolutions.map((ev) => {
                  const pat = patients.find((p) => p.id === ev.patientId);
                  const isPaid = ev.paymentStatus === 'paid';
                  const isCompleted = ev.attendanceStatus === 'completed';
                  const physioCut = isCompleted
                    ? (ev.sessionValue * (currentUser.commissionRate || 60)) / 100
                    : 0;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-900">
                          {new Date(ev.sessionDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(ev.sessionDate).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">
                          {pat?.fullName || 'Paciente'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {pat?.healthInsurance || 'Particular'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        #{ev.sessionNumber}
                      </td>

                      <td className="py-2.5 px-3">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Realizada</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 text-[11px]">
                            <AlertCircle className="h-3 w-3" />
                            <span>Falta</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrencyBRL(ev.sessionValue)}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-teal-800 whitespace-nowrap">
                        {formatCurrencyBRL(physioCut)}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(ev)}
                          className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                        >
                          {isPaid ? 'Marcar Pendente' : 'Marcar Pago'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
