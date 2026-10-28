/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Activity,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Plus,
  Trash2,
  UploadCloud,
  FileCheck2,
  Calendar,
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  Patient,
  UserProfile,
  Assessment,
  GoniometryMeasurement,
  MuscleStrengthMeasurement,
  OrthopedicTest,
  AttachedFile,
} from '../types/index.ts';
import { EvaSlider } from './EvaSlider.tsx';
import { getOxfordGradeDescription } from '../utils/clinicalCalculations.ts';
import { clinicalStorage, generateUUID, ensureUUID } from '../services/storageService.ts';
import { supabase } from '../services/supabaseClient.ts';

interface NewAssessmentViewProps {
  patient: Patient;
  currentUser: UserProfile;
  onBack: () => void;
  onSaved: (assessment: Assessment) => void;
  existingAssessment?: Assessment | null;
}

export const NewAssessmentView: React.FC<NewAssessmentViewProps> = ({
  patient,
  currentUser,
  onBack,
  onSaved,
  existingAssessment,
}) => {
  const [activeTab, setActiveTab] = useState<'anamnesis' | 'physical' | 'diagnosis'>(
    'anamnesis'
  );

  // Tab 1: Anamnese
  const [qp, setQp] = useState(existingAssessment?.anamnesis.qp || '');
  const [hda, setHda] = useState(existingAssessment?.anamnesis.hda || '');
  const [hpp, setHpp] = useState(existingAssessment?.anamnesis.hpp || '');
  const [medications, setMedications] = useState(
    existingAssessment?.anamnesis.medications || ''
  );
  const [examNotes, setExamNotes] = useState(
    existingAssessment?.anamnesis.examNotes || ''
  );
  const [physicalActivity, setPhysicalActivity] = useState(
    existingAssessment?.anamnesis.lifeHabits.physicalActivity || ''
  );
  const [sleepQuality, setSleepQuality] = useState(
    existingAssessment?.anamnesis.lifeHabits.sleepQuality || 'Boa'
  );
  const [tobacco, setTobacco] = useState(
    existingAssessment?.anamnesis.lifeHabits.tobacco || false
  );
  const [alcohol, setAlcohol] = useState(
    existingAssessment?.anamnesis.lifeHabits.alcohol || false
  );
  const [workPosturalDemands, setWorkPosturalDemands] = useState(
    existingAssessment?.anamnesis.lifeHabits.workPosturalDemands || ''
  );
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    existingAssessment?.anamnesis.attachedFiles || []
  );

  // Tab 2: Exame Físico
  const [evaInitial, setEvaInitial] = useState(
    existingAssessment?.physicalExam.evaInitial ?? 6
  );
  const [inspectionPalpation, setInspectionPalpation] = useState(
    existingAssessment?.physicalExam.inspectionPalpation || ''
  );
  const [goniometry, setGoniometry] = useState<GoniometryMeasurement[]>(
    existingAssessment?.physicalExam.goniometry || [
      { joint: 'Joelho', movement: 'Flexão Ativa', degrees: 110, reference: '0-135°', notes: 'Dor no final do arco' },
      { joint: 'Joelho', movement: 'Extensão Ativa', degrees: 0, reference: '0°', notes: 'Sem déficit' },
    ]
  );
  const [muscleStrength, setMuscleStrength] = useState<MuscleStrengthMeasurement[]>(
    existingAssessment?.physicalExam.muscleStrength || [
      { muscleGroup: 'Quadríceps', grade: 4, notes: 'Fraqueza leve' },
      { muscleGroup: 'Isquiotibiais', grade: 5, notes: 'Normal' },
      { muscleGroup: 'Glúteo Médio', grade: 3, notes: 'Déficit estabilizador' },
    ]
  );
  const [orthopedicTests, setOrthopedicTests] = useState<OrthopedicTest[]>(
    existingAssessment?.physicalExam.orthopedicTests || [
      { name: 'Teste de Clarke (Compressão Patelar)', region: 'Joelho', result: 'positive', notes: 'Apreensão álgica' },
      { name: 'Teste de Lasègue', region: 'Coluna / Ciático', result: 'negative', notes: 'Sem irradiação até 70°' },
      { name: 'Teste de Neer', region: 'Ombro', result: 'negative', notes: 'Sem dor subacromial' },
    ]
  );

  // Tab 3: Diagnóstico e Plano
  const [kineticFunctionalDiagnosis, setKineticFunctionalDiagnosis] = useState(
    existingAssessment?.diagnosisAndPlan.kineticFunctionalDiagnosis || ''
  );
  const [goalShortTerm, setGoalShortTerm] = useState(
    existingAssessment?.diagnosisAndPlan.treatmentGoals.shortTerm || ''
  );
  const [goalMediumTerm, setGoalMediumTerm] = useState(
    existingAssessment?.diagnosisAndPlan.treatmentGoals.mediumTerm || ''
  );
  const [goalLongTerm, setGoalLongTerm] = useState(
    existingAssessment?.diagnosisAndPlan.treatmentGoals.longTerm || ''
  );
  const [therapeuticPlan, setTherapeuticPlan] = useState<string[]>(
    existingAssessment?.diagnosisAndPlan.therapeuticPlan || [
      'Cinesioterapia Ativa e Resistida',
      'Terapia Manual / Liberação Miofascial',
      'Eletroterapia Analgésica (TENS)',
    ]
  );
  const [planDetails, setPlanDetails] = useState(
    existingAssessment?.diagnosisAndPlan.planDetails ||
      'Sessões indicadas: 2 vezes por semana, com reavaliação clínica após 10 sessões.'
  );

  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Helper to toggle therapeutic technique
  const toggleTherapeuticTechnique = (tech: string) => {
    if (therapeuticPlan.includes(tech)) {
      setTherapeuticPlan(therapeuticPlan.filter((t) => t !== tech));
    } else {
      setTherapeuticPlan([...therapeuticPlan, tech]);
    }
  };

  // Add Goniometry Row
  const addGoniometryRow = () => {
    setGoniometry([
      ...goniometry,
      { joint: '', movement: '', degrees: 90, reference: '0-180°', notes: '' },
    ]);
  };

  const removeGoniometryRow = (idx: number) => {
    setGoniometry(goniometry.filter((_, i) => i !== idx));
  };

  // Add Muscle Strength Row
  const addMuscleRow = () => {
    setMuscleStrength([
      ...muscleStrength,
      { muscleGroup: '', grade: 5, notes: '' },
    ]);
  };

  const removeMuscleRow = (idx: number) => {
    setMuscleStrength(muscleStrength.filter((_, i) => i !== idx));
  };

  // Add Orthopedic Test Row
  const addOrthopedicTest = () => {
    setOrthopedicTests([
      ...orthopedicTests,
      { name: '', region: '', result: 'negative', notes: '' },
    ]);
  };

  const removeOrthopedicTest = (idx: number) => {
    setOrthopedicTests(orthopedicTests.filter((_, i) => i !== idx));
  };

  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // File Upload to Supabase Storage Bucket 'docs'
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingFile(true);

    try {
      const uploadedList: AttachedFile[] = [];

      for (const f of Array.from(files)) {
        const sanitized = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `paciente_${patient.id}/${Date.now()}_${sanitized}`;

        // Upload to bucket 'docs'
        const { error: uploadError } = await supabase.storage
          .from('docs')
          .upload(storagePath, f, { upsert: true });

        if (uploadError) {
          console.warn('Erro ao enviar documento para o bucket docs:', uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from('docs')
          .getPublicUrl(storagePath);

        uploadedList.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: f.name,
          size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
          type: f.type || 'document',
          date: new Date().toISOString().split('T')[0],
          url: urlData?.publicUrl || '',
          path: storagePath,
        });
      }

      setAttachedFiles((prev) => [...prev, ...uploadedList]);
    } catch (err: any) {
      console.error('Falha no upload para o bucket docs:', err);
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSaveAssessment = async () => {
    setError(null);

    if (!qp.trim()) {
      setError('Por favor, informe a Queixa Principal (QP) na Aba de Anamnese.');
      setActiveTab('anamnesis');
      return;
    }

    if (!kineticFunctionalDiagnosis.trim()) {
      setError('Por favor, defina o Diagnóstico Cinético-Funcional na Aba 3.');
      setActiveTab('diagnosis');
      return;
    }

    const assessmentRecord: Assessment = {
      id: existingAssessment ? existingAssessment.id : generateUUID(),
      patientId: ensureUUID(patient.id),
      physioId: ensureUUID(currentUser.id),
      createdAt: existingAssessment ? existingAssessment.createdAt : new Date().toISOString(),
      anamnesis: {
        qp: qp.trim(),
        hda: hda.trim(),
        hpp: hpp.trim(),
        medications: medications.trim(),
        examNotes: examNotes.trim(),
        lifeHabits: {
          physicalActivity,
          sleepQuality,
          tobacco,
          alcohol,
          workPosturalDemands,
        },
        attachedFiles,
      },
      physicalExam: {
        evaInitial,
        inspectionPalpation: inspectionPalpation.trim(),
        goniometry,
        muscleStrength,
        orthopedicTests,
      },
      diagnosisAndPlan: {
        kineticFunctionalDiagnosis: kineticFunctionalDiagnosis.trim(),
        treatmentGoals: {
          shortTerm: goalShortTerm.trim(),
          mediumTerm: goalMediumTerm.trim(),
          longTerm: goalLongTerm.trim(),
        },
        therapeuticPlan,
        planDetails: planDetails.trim(),
      },
    };

    const res = await clinicalStorage.saveAssessment(assessmentRecord);
    if (!res.success) {
      setError(`Erro ao salvar avaliação no Supabase: ${res.error || 'Falha de comunicação'}`);
      return;
    }
    setIsSaved(true);
    setTimeout(() => {
      onSaved(assessmentRecord);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Paciente</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {existingAssessment ? 'Editar Avaliação Cinético-Funcional' : 'Nova Avaliação Cinético-Funcional'}
            </h1>
            <p className="text-xs text-slate-500">
              Paciente: <strong className="text-slate-800">{patient.fullName}</strong> · CPF: {patient.cpf} · {patient.healthInsurance}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveAssessment}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isSaved ? 'Gravado com Sucesso!' : 'Salvar Avaliação'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Navigation (RF06, RF07, RF08) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('anamnesis')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'anamnesis'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Aba 1: Anamnese (Subjetiva)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('physical')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'physical'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Aba 2: Exame Físico (Objetiva)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diagnosis')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'diagnosis'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Aba 3: Diagnóstico e Plano</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {/* ========================================================= */}
        {/* ABA 1: ANAMNESE (RF06) */}
        {/* ========================================================= */}
        {activeTab === 'anamnesis' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-700" />
                <span>Anamnese e Avaliação Subjetiva</span>
              </h2>
              <p className="text-xs text-slate-500">
                Histórico clínico, hábitos de vida e motivos da consulta inicial.
              </p>
            </div>

            {/* QP e HDA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="qp-field" className="block text-xs font-semibold text-slate-700 mb-1">
                  QP (Queixa Principal) *
                </label>
                <textarea
                  id="qp-field"
                  rows={3}
                  required
                  value={qp}
                  onChange={(e) => setQp(e.target.value)}
                  placeholder="Motivo resumido da consulta (Ex: Dor no joelho esquerdo ao descer escadas há 3 semanas)"
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="hda-field" className="block text-xs font-semibold text-slate-700 mb-1">
                  HDA (História da Doença Atual) *
                </label>
                <textarea
                  id="hda-field"
                  rows={3}
                  value={hda}
                  onChange={(e) => setHda(e.target.value)}
                  placeholder="Início dos sintomas, fatores de melhora e piora, irradiação, postura que agrava..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* HPP e Medicamentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hpp-field" className="block text-xs font-semibold text-slate-700 mb-1">
                  HPP (Histórico Patológico Pregresso)
                </label>
                <textarea
                  id="hpp-field"
                  rows={3}
                  value={hpp}
                  onChange={(e) => setHpp(e.target.value)}
                  placeholder="Cirurgias prévias, comorbidades (diabetes, hipertensão, osteoporose), traumas e fraturas"
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="meds-field" className="block text-xs font-semibold text-slate-700 mb-1">
                  Medicamentos em Uso
                </label>
                <textarea
                  id="meds-field"
                  rows={3}
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="Analgésicos, anti-inflamatórios, relaxantes musculares, anti-hipertensivos em uso"
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Hábitos de Vida */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hábitos de Vida e Ergonomia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="activity-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Atividade Física Habitual
                  </label>
                  <input
                    id="activity-input"
                    type="text"
                    value={physicalActivity}
                    onChange={(e) => setPhysicalActivity(e.target.value)}
                    placeholder="Ex: Pilates 2x/sem, Sedentário"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="sleep-select" className="block text-xs font-medium text-slate-700 mb-1">
                    Qualidade do Sono
                  </label>
                  <select
                    id="sleep-select"
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
                  >
                    <option value="Boa / Reparador">Boa / Reparador</option>
                    <option value="Regular / Despertares frequentes">Regular / Despertares frequentes</option>
                    <option value="Ruim / Insônia álgica">Ruim / Insônia álgica</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="work-posture-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Demandas Posturais no Trabalho
                  </label>
                  <input
                    id="work-posture-input"
                    type="text"
                    value={workPosturalDemands}
                    onChange={(e) => setWorkPosturalDemands(e.target.value)}
                    placeholder="Ex: Sentado 8h diárias, carrega peso"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tobacco}
                    onChange={(e) => setTobacco(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Tabagismo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alcohol}
                    onChange={(e) => setAlcohol(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Etilismo</span>
                </label>
              </div>
            </div>

            {/* Exames Complementares e Anexo de Arquivos (Storage) */}
            <div className="space-y-3">
              <label htmlFor="exam-notes-field" className="block text-xs font-semibold text-slate-700">
                Exames Complementares (Laudos, Raios-X, Ressonância)
              </label>
              <textarea
                id="exam-notes-field"
                rows={2}
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                placeholder="Síntese dos laudos médicos e conclusões de imagem..."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1"
              />

              {/* Upload Área Segura */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="exam-file-upload"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="exam-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  {isUploadingFile ? (
                    <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                  ) : (
                    <UploadCloud className="h-8 w-8 text-teal-600" />
                  )}
                  <span className="text-xs font-semibold text-slate-800">
                    {isUploadingFile ? 'Enviando documento para o Supabase (bucket docs)...' : 'Anexar laudos em PDF ou imagens de exames'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Armazenamento em nuvem seguro (Bucket docs) com conformidade LGPD
                  </span>
                </label>

                {attachedFiles.length > 0 && (
                  <div className="mt-4 space-y-1.5 text-left max-w-md mx-auto">
                    {attachedFiles.map((file, i) => (
                      <div
                        key={file.id || i}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck2 className="h-4 w-4 text-teal-600 shrink-0" />
                          <span className="truncate font-medium text-slate-800">{file.name}</span>
                          <span className="text-[10px] text-slate-400">({file.size})</span>
                          {file.url && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-600 hover:text-teal-800 flex items-center gap-0.5 font-semibold text-[10px]"
                            >
                              <span>Abrir</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          aria-label={`Remover anexo ${file.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('physical')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span>Avançar para Exame Físico</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: EXAME FÍSICO (RF07) */}
        {/* ========================================================= */}
        {activeTab === 'physical' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-700" />
                <span>Exame Físico e Avaliação Objetiva</span>
              </h2>
              <p className="text-xs text-slate-500">
                Graduação de dor EVA, inspeção, goniometria articular, força muscular e testes ortopédicos.
              </p>
            </div>

            {/* EVA Component */}
            <EvaSlider
              value={evaInitial}
              onChange={setEvaInitial}
              label="Escala Visual Analógica de Dor Inicial (EVA)"
            />

            {/* Inspeção e Palpação */}
            <div>
              <label htmlFor="inspection-field" className="block text-xs font-semibold text-slate-700 mb-1">
                Inspeção Estática/Dinâmica e Palpação
              </label>
              <textarea
                id="inspection-field"
                rows={3}
                value={inspectionPalpation}
                onChange={(e) => setInspectionPalpation(e.target.value)}
                placeholder="Presença de edemas (+/4+), cicatrizes, alterações tróficas, retrações fasciais, postura antálgica..."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1"
              />
            </div>

            {/* ADM e Goniometria */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    ADM e Goniometria Articular
                  </h3>
                  <p className="text-[11px] text-slate-500">Graus de movimento articular mensurados</p>
                </div>
                <button
                  type="button"
                  onClick={addGoniometryRow}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Articulação</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Articulação</th>
                      <th className="py-2.5 px-3">Movimento</th>
                      <th className="py-2.5 px-3 w-28">Graus (°)</th>
                      <th className="py-2.5 px-3 w-28">Referência</th>
                      <th className="py-2.5 px-3">Observações Clínicas</th>
                      <th className="py-2.5 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {goniometry.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Ex: Joelho E"
                            value={row.joint}
                            onChange={(e) => {
                              const updated = [...goniometry];
                              updated[idx].joint = e.target.value;
                              setGoniometry(updated);
                            }}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Ex: Flexão Ativa"
                            value={row.movement}
                            onChange={(e) => {
                              const updated = [...goniometry];
                              updated[idx].movement = e.target.value;
                              setGoniometry(updated);
                            }}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={row.degrees}
                              onChange={(e) => {
                                const updated = [...goniometry];
                                updated[idx].degrees = Number(e.target.value);
                                setGoniometry(updated);
                              }}
                              className="w-16 border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-900"
                            />
                            <span className="text-slate-400">°</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="0-135°"
                            value={row.reference}
                            onChange={(e) => {
                              const updated = [...goniometry];
                              updated[idx].reference = e.target.value;
                              setGoniometry(updated);
                            }}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Dor no arco final"
                            value={row.notes || ''}
                            onChange={(e) => {
                              const updated = [...goniometry];
                              updated[idx].notes = e.target.value;
                              setGoniometry(updated);
                            }}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeGoniometryRow(idx)}
                            aria-label={`Remover goniometria linha ${idx + 1}`}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Força Muscular (Escala de Oxford 0 a 5) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Força Muscular (Escala de Oxford de 0 a 5)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Graduação padronizada de contração e resistência contra a gravidade
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMuscleRow}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Grupo Muscular</span>
                </button>
              </div>

              <div className="space-y-2">
                {muscleStrength.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-wrap items-center gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-[180px]">
                      <input
                        type="text"
                        placeholder="Grupo Muscular (Ex: Quadríceps)"
                        value={row.muscleGroup}
                        onChange={(e) => {
                          const updated = [...muscleStrength];
                          updated[idx].muscleGroup = e.target.value;
                          setMuscleStrength(updated);
                        }}
                        className="w-full border border-slate-300 bg-white rounded-md px-3 py-1.5 text-xs font-medium"
                      />
                    </div>

                    <div className="w-48">
                      <select
                        value={row.grade}
                        onChange={(e) => {
                          const updated = [...muscleStrength];
                          updated[idx].grade = parseInt(e.target.value, 10);
                          setMuscleStrength(updated);
                        }}
                        className="w-full border border-slate-300 bg-white rounded-md px-2 py-1.5 text-xs font-bold text-teal-800"
                      >
                        <option value={0}>Grau 0: Paralisia completa</option>
                        <option value={1}>Grau 1: Contração palpável</option>
                        <option value={2}>Grau 2: Sem gravidade</option>
                        <option value={3}>Grau 3: Contra a gravidade</option>
                        <option value={4}>Grau 4: Resistência moderada</option>
                        <option value={5}>Grau 5: Força normal</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <input
                        type="text"
                        placeholder="Observações complementares"
                        value={row.notes || ''}
                        onChange={(e) => {
                          const updated = [...muscleStrength];
                          updated[idx].notes = e.target.value;
                          setMuscleStrength(updated);
                        }}
                        className="w-full border border-slate-300 bg-white rounded-md px-3 py-1.5 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMuscleRow(idx)}
                      aria-label={`Remover grupo muscular ${idx + 1}`}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Testes Especiais / Ortopédicos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Testes Especiais e Manobras Ortopédicas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lasègue, Phalen, Neer, Clarke, Gaveta, Lachman, etc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOrthopedicTest}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Teste</span>
                </button>
              </div>

              <div className="space-y-2">
                {orthopedicTests.map((test, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Nome do Teste (Ex: Teste de Clarke)"
                        value={test.name}
                        onChange={(e) => {
                          const updated = [...orthopedicTests];
                          updated[idx].name = e.target.value;
                          setOrthopedicTests(updated);
                        }}
                        className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <div className="w-32">
                      <input
                        type="text"
                        placeholder="Região (Ex: Joelho)"
                        value={test.region}
                        onChange={(e) => {
                          const updated = [...orthopedicTests];
                          updated[idx].region = e.target.value;
                          setOrthopedicTests(updated);
                        }}
                        className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-600"
                      />
                    </div>

                    <div className="w-36">
                      <select
                        value={test.result}
                        onChange={(e) => {
                          const updated = [...orthopedicTests];
                          updated[idx].result = e.target.value as any;
                          setOrthopedicTests(updated);
                        }}
                        className={`w-full border rounded-md px-2 py-1.5 text-xs font-bold ${
                          test.result === 'positive'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : test.result === 'negative'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="positive">Positivo (+)</option>
                        <option value="negative">Negativo (-)</option>
                        <option value="inconclusive">Inconclusivo</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <input
                        type="text"
                        placeholder="Observações / reprodução de sintomas"
                        value={test.notes || ''}
                        onChange={(e) => {
                          const updated = [...orthopedicTests];
                          updated[idx].notes = e.target.value;
                          setOrthopedicTests(updated);
                        }}
                        className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeOrthopedicTest(idx)}
                      aria-label={`Remover teste ${idx + 1}`}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('anamnesis')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Voltar à Anamnese
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('diagnosis')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span>Avançar para Diagnóstico e Plano</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: DIAGNÓSTICO E PLANO (RF08) */}
        {/* ========================================================= */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-teal-700" />
                <span>Diagnóstico Cinético-Funcional e Conduta Terapêutica</span>
              </h2>
              <p className="text-xs text-slate-500">
                Conclusão clínica privativa da fisioterapia e estruturação das metas de reabilitação.
              </p>
            </div>

            {/* Diagnóstico Cinético-Funcional */}
            <div>
              <label htmlFor="diag-field" className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnóstico Cinético-Funcional *
              </label>
              <textarea
                id="diag-field"
                rows={3}
                required
                value={kineticFunctionalDiagnosis}
                onChange={(e) => setKineticFunctionalDiagnosis(e.target.value)}
                placeholder="Ex: Disfunção femoropatelar à esquerda com déficit de força em estabilizadores de pelve e vasto medial, crepitação articular e limitação funcional para descida de escadas."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Objetivos de Tratamento */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Objetivos do Tratamento (Metas Temporais)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                  <span className="block text-xs font-bold text-teal-800 mb-1">
                    Curto Prazo (Sessões 1 a 5)
                  </span>
                  <textarea
                    rows={3}
                    value={goalShortTerm}
                    onChange={(e) => setGoalShortTerm(e.target.value)}
                    placeholder="Alívio álgico (redução do EVA), contenção de processo inflamatório, ganho de ADM inicial."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                  <span className="block text-xs font-bold text-sky-800 mb-1">
                    Médio Prazo (Sessões 6 a 12)
                  </span>
                  <textarea
                    rows={3}
                    value={goalMediumTerm}
                    onChange={(e) => setGoalMediumTerm(e.target.value)}
                    placeholder="Ativação de estabilizadores profundos, aumento de força muscular (Oxford 4), ganho funcional."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                  <span className="block text-xs font-bold text-indigo-800 mb-1">
                    Longo Prazo (Sessões 13+)
                  </span>
                  <textarea
                    rows={3}
                    value={goalLongTerm}
                    onChange={(e) => setGoalLongTerm(e.target.value)}
                    placeholder="Fortalecimento global em cadeia fechada, retorno esportivo/laboral e autonomia."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Conduta e Recursos Terapêuticos */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recursos Terapêuticos Selecionados
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[
                  'Cinesioterapia Ativa e Resistida',
                  'Terapia Manual / Mobilização',
                  'Liberação Miofascial',
                  'Eletroterapia Analgésica (TENS)',
                  'Eletroestimulação Muscular (FES)',
                  'Termoterapia / Bolsas Quentes',
                  'Crioterapia Pós-Sessão',
                  'Pilates Clínico / Solo',
                  'Treino Proprioceptivo / Equilíbrio',
                  'Mobilização Neural (Flossing)',
                  'Dry Needling / Agulhamento Seco',
                  'Orientações Ergonômicas',
                ].map((technique) => {
                  const isSelected = therapeuticPlan.includes(technique);
                  return (
                    <button
                      key={technique}
                      type="button"
                      onClick={() => toggleTherapeuticTechnique(technique)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-700 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{technique}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detalhes do Plano e Frequência */}
            <div>
              <label htmlFor="plan-details-field" className="block text-xs font-semibold text-slate-700 mb-1">
                Planejamento e Frequência Recomendada
              </label>
              <textarea
                id="plan-details-field"
                rows={2}
                value={planDetails}
                onChange={(e) => setPlanDetails(e.target.value)}
                placeholder="Ex: Frequência sugerida: 2 vezes por semana, com reavaliação clínica após 10 sessões."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-1"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('physical')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Voltar ao Exame Físico
              </button>

              <button
                type="button"
                onClick={handleSaveAssessment}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Salvar Avaliação Cinético-Funcional</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
