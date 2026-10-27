/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  FileText,
  Activity,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Building2,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { clinicalStorage } from '../services/storageService.ts';

interface OnboardingTourProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onTourFinished: (updatedUser: UserProfile) => void;
}

interface TourStep {
  title: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  highlights: string[];
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  user,
  isOpen,
  onClose,
  onTourFinished,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      title: 'Bem-vindo ao Sistema de Fisioterapia da Clínica Ortra',
      badge: 'Tradição & Inovação',
      icon: <Building2 className="h-7 w-7 text-teal-700" />,
      description:
        'A Clínica Ortra traz mais de 30 anos de excelência em ortopedia e reabilitação em Lauro de Freitas. Este sistema foi desenhado para agilizar seu fluxo diário, unificando prontuário cinético-funcional e controle financeiro de sessões.',
      highlights: [
        'Prontuário eletrônico em conformidade com o COFFITO e LGPD',
        'Controle financeiro automatizado com repasse calculado em tempo real',
        'Acesso rápido via desktop, tablet ou smartphone na beira da maca',
      ],
    },
    {
      title: 'Gestão de Pacientes e Checklist Inicial',
      badge: 'Integração Ágil',
      icon: <Users className="h-7 w-7 text-sky-700" />,
      description:
        'Cadastre novos pacientes com validação instantânea de CPF e cálculo automático de idade. Após o cadastro, um checklist interativo garante que nenhum documento ou consentimento fique pendente.',
      highlights: [
        'Validação matemática de CPF e máscara de WhatsApp',
        'Checklist obrigatório de termo LGPD e regras de faltas',
        'Definição do convênio e do valor padrão de sessão',
      ],
    },
    {
      title: 'Prontuário Cinético-Funcional em 3 Abas',
      badge: 'Avaliação Estruturada',
      icon: <FileText className="h-7 w-7 text-teal-700" />,
      description:
        'Realize avaliações aprofundadas organizadas em 3 blocos expansíveis: Anamnese detalhada, Exame Físico com Escala EVA, Goniometria e Força (Oxford), e Diagnóstico com Metas de Tratamento.',
      highlights: [
        'Aba 1 (Anamnese): QP, HDA, HPP, medicamentos e anexo seguro de laudos',
        'Aba 2 (Exame Físico): Slider interativo EVA (0 a 10) e testes ortopédicos',
        'Aba 3 (Conduta): Diagnóstico cinético-funcional e metas curto/médio/longo prazo',
      ],
    },
    {
      title: 'Evolução Diária de Sessão',
      badge: 'Atendimento Rápido',
      icon: <Activity className="h-7 w-7 text-emerald-700" />,
      description:
        'A cada atendimento, registre a evolução em menos de 1 minuto: registre a conduta aplicada, dor antes e depois da sessão, presença ou falta justificada e status de pagamento.',
      highlights: [
        'Preenchimento automático de data/hora com edição livre',
        'Comparativo de dor EVA pré e pós-sessão',
        'Lançamento automático para o fechamento financeiro',
      ],
    },
    {
      title: 'Controle Financeiro e Repasse da Clínica',
      badge: 'Transparência Total',
      icon: <DollarSign className="h-7 w-7 text-amber-700" />,
      description:
        'Acompanhe seus rendimentos brutos e líquidos. A taxa de comissão da clínica é aplicada automaticamente sobre as sessões pagas, permitindo exportar relatórios para conferência.',
      highlights: [
        `Sua taxa de repasse atual: ${user.commissionRate}% fisioterapeuta / ${100 - user.commissionRate}% clínica`,
        'Filtros por período (Hoje, Semana, Mês) e status (Pago vs Pendente)',
        'Exportação de relatórios em CSV e impressão em PDF',
      ],
    },
  ];

  const handleFinish = () => {
    const updated: UserProfile = {
      ...user,
      hasCompletedTour: true,
    };
    clinicalStorage.saveProfile(updated);
    clinicalStorage.logAudit(
      'TOUR_ONBOARDING_CONCLUIDO',
      `Fisioterapeuta ${user.fullName} completou o tour de integração.`
    );
    onTourFinished(updated);
    onClose();
  };

  const current = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              Tour Guiado · Clínica Ortra
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Passo {currentStep + 1} de {steps.length}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
              {current.icon}
            </div>
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                {current.badge}
              </span>
              <h3 id="tour-dialog-title" className="text-lg font-bold text-slate-900 mt-0.5">
                {current.title}
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {current.description}
          </p>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Recursos Principais:
            </h4>
            <ul className="space-y-2">
              {current.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Pular Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>
            )}

            {isLast ? (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Concluir e Iniciar Atendimentos</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
              >
                <span>Próximo</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
