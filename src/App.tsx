/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { UserProfile, Patient } from './types/index';

// Componentes
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { PatientsListView } from './components/PatientsListView';
import { PatientDetailView } from './components/PatientDetailView';
import { NewAssessmentView } from './components/NewAssessmentView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { AdminPanel } from './components/AdminPanel';
import { PatientFormModal } from './components/PatientFormModal';
import { PatientChecklistModal } from './components/PatientChecklistModal';
import { EvolutionModal } from './components/EvolutionModal';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { OnboardingTour } from './components/OnboardingTour';
import { PrintProntuarioModal } from './components/PrintProntuarioModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Navegação
  const [currentView, setCurrentView] = useState<'patients' | 'financial' | 'admin'>('patients');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Estados dos Modais
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [checklistPatient, setChecklistPatient] = useState<Patient | null>(null);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [assessmentPatient, setAssessmentPatient] = useState<Patient | null>(null);
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);
  const [evolutionPatient, setEvolutionPatient] = useState<Patient | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printPatient, setPrintPatient] = useState<Patient | null>(null);

  // Gatilho de recarregamento para as listagens
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Função auxiliar para obter os dados do perfil a partir do Supabase
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        isAdmin: data.role === 'admin',
        phone: data.phone || '',
        crefito: data.crefito || '',
        commissionRate: data.default_session_rate || 0,
        hasCompletedTour: data.has_completed_tour,
        mustChangePassword: data.must_change_password,
        active: data.active,
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  };

  // Inicialização e subscrição de alterações de sessão
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile && profile.active) {
            setCurrentUser(profile);
            setIsAuthenticated(true);
          } else {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Erro ao restaurar sessão:', err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setSelectedPatientId(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile && profile.active) {
            setCurrentUser(profile);
            setIsAuthenticated(true);
          }
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setSelectedPatientId(null);
  };

  const handlePasswordChanged = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, mustChangePassword: false });
    }
  };

  const handleTourCompleted = async () => {
    if (currentUser) {
      await supabase
        .from('profiles')
        .update({ has_completed_tour: true })
        .eq('id', currentUser.id);

      setCurrentUser({ ...currentUser, hasCompletedTour: true });
    }
  };

  // Ecrã de carregamento inicial
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <span className="text-sm">A carregar ambiente seguro...</span>
      </div>
    );
  }

  // Se não estiver autenticado, exibe o LoginView
  if (!isAuthenticated || !currentUser) {
    return <LoginView onLoginSuccess={(profile) => {
      setCurrentUser(profile);
      setIsAuthenticated(true);
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentUser={currentUser}
        profiles={[]}
        currentView={currentView}
        onViewChange={(view) => {
          setSelectedPatientId(null);
          setCurrentView(view);
        }}
        onUserSwitch={() => {}}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        {selectedPatientId ? (
          <PatientDetailView
            patientId={selectedPatientId}
            currentUser={currentUser}
            onBack={() => setSelectedPatientId(null)}
            onOpenEvolution={(patient) => {
              setEvolutionPatient(patient);
              setIsEvolutionOpen(true);
            }}
            onOpenAssessment={(patient) => {
              setAssessmentPatient(patient);
              setIsAssessmentOpen(true);
            }}
            onOpenPrint={(patient) => {
              setPrintPatient(patient);
              setIsPrintModalOpen(true);
            }}
            onOpenEdit={(patient) => {
              setEditingPatient(patient);
              setIsPatientFormOpen(true);
            }}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <>
            {currentView === 'patients' && (
              <PatientsListView
                currentUser={currentUser}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onNewPatient={() => {
                  setEditingPatient(null);
                  setIsPatientFormOpen(true);
                }}
                refreshTrigger={refreshTrigger}
              />
            )}

            {currentView === 'financial' && (
              <FinancialReportsView currentUser={currentUser} />
            )}

            {currentView === 'admin' && currentUser.isAdmin && (
              <AdminPanel currentUser={currentUser} />
            )}
          </>
        )}
      </main>

      {/* Modais de Fluxo */}
      {isPatientFormOpen && (
        <PatientFormModal
          isOpen={isPatientFormOpen}
          initialData={editingPatient}
          onClose={() => {
            setIsPatientFormOpen(false);
            setEditingPatient(null);
          }}
          onSaved={(newPatient) => {
            setIsPatientFormOpen(false);
            setRefreshTrigger((prev) => prev + 1);
            if (!editingPatient && newPatient) {
              setChecklistPatient(newPatient);
              setIsChecklistOpen(true);
            }
          }}
        />
      )}

      {isChecklistOpen && checklistPatient && (
        <PatientChecklistModal
          isOpen={isChecklistOpen}
          patient={checklistPatient}
          currentUser={currentUser}
          onClose={() => {
            setIsChecklistOpen(false);
            setChecklistPatient(null);
          }}
          onCompleted={() => {
            setIsChecklistOpen(false);
            setChecklistPatient(null);
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}

      {isAssessmentOpen && assessmentPatient && (
        <NewAssessmentView
          patient={assessmentPatient}
          currentUser={currentUser}
          onClose={() => {
            setIsAssessmentOpen(false);
            setAssessmentPatient(null);
          }}
          onSaved={() => {
            setIsAssessmentOpen(false);
            setAssessmentPatient(null);
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}

      {isEvolutionOpen && evolutionPatient && (
        <EvolutionModal
          isOpen={isEvolutionOpen}
          patient={evolutionPatient}
          currentUser={currentUser}
          onClose={() => {
            setIsEvolutionOpen(false);
            setEvolutionPatient(null);
          }}
          onSaved={() => {
            setIsEvolutionOpen(false);
            setEvolutionPatient(null);
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}

      {isPrintModalOpen && printPatient && (
        <PrintProntuarioModal
          isOpen={isPrintModalOpen}
          patient={printPatient}
          onClose={() => {
            setIsPrintModalOpen(false);
            setPrintPatient(null);
          }}
        />
      )}

      {/* Validações Obrigatórias do Utilizador */}
      {currentUser.mustChangePassword && (
        <ForcePasswordChangeModal
          isOpen={currentUser.mustChangePassword}
          currentUser={currentUser}
          onSuccess={handlePasswordChanged}
        />
      )}

      {!currentUser.mustChangePassword && !currentUser.hasCompletedTour && (
        <OnboardingTour
          isOpen={!currentUser.hasCompletedTour}
          onClose={handleTourCompleted}
        />
      )}
    </div>
  );
}