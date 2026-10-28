/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { clinicalStorage } from './services/storageService.ts';
import { supabase } from './services/supabaseClient.ts';
import {
  UserProfile,
  Patient,
  Assessment,
  Evolution,
} from './types/index.ts';
import { hasAdminPrivileges } from './utils/clinicalCalculations.ts';

// Components
import { Header } from './components/Header.tsx';
import { LoginView } from './components/LoginView.tsx';
import { PatientsListView } from './components/PatientsListView.tsx';
import { PatientDetailView } from './components/PatientDetailView.tsx';
import { NewAssessmentView } from './components/NewAssessmentView.tsx';
import { FinancialReportsView } from './components/FinancialReportsView.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { PatientFormModal } from './components/PatientFormModal.tsx';
import { EvolutionModal } from './components/EvolutionModal.tsx';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal.tsx';
import { PrintProntuarioModal } from './components/PrintProntuarioModal.tsx';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    clinicalStorage.isAuthenticated()
  );

  // Active view: 'patients' | 'financial' | 'admin'
  const [currentView, setCurrentView] = useState<'patients' | 'financial' | 'admin'>('patients');

  // Application Data States
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => clinicalStorage.getCurrentUser());
  const [profiles, setProfiles] = useState<UserProfile[]>(() => clinicalStorage.getProfiles());
  const [patients, setPatients] = useState<Patient[]>(() => clinicalStorage.getPatients());
  const [assessments, setAssessments] = useState<Assessment[]>(() =>
    clinicalStorage.getAssessments()
  );
  const [evolutions, setEvolutions] = useState<Evolution[]>(() => clinicalStorage.getEvolutions());

  // Deep clinical view state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);

  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [evolutionPatient, setEvolutionPatient] = useState<Patient | null>(null);

  const [printableData, setPrintableData] = useState<{
    patient: Patient;
    assessment: Assessment;
  } | null>(null);

  // Reload records from clinicalStorage
  const refreshData = () => {
    setProfiles(clinicalStorage.getProfiles());
    setPatients(clinicalStorage.getPatients());
    setAssessments(clinicalStorage.getAssessments());
    setEvolutions(clinicalStorage.getEvolutions());
  };

  // Sync with Supabase & listen for auth changes on mount
  useEffect(() => {
    // Check existing Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      } else if (session?.user) {
        setIsAuthenticated(true);
      }
    });

    clinicalStorage.syncFromSupabase().then((res) => {
      if (res.ok) {
        refreshData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // RBAC safety check: if user loses admin privileges and is in admin view, return to patients
  useEffect(() => {
    if (currentView === 'admin' && !hasAdminPrivileges(currentUser)) {
      setCurrentView('patients');
    }
  }, [currentView, currentUser]);

  // User Switcher (For demonstration & testing)
  const handleUserSwitch = (newUser: UserProfile) => {
    clinicalStorage.setCurrentUser(newUser);
    setCurrentUser(newUser);
    if (!hasAdminPrivileges(newUser) && currentView === 'admin') {
      setCurrentView('patients');
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await clinicalStorage.logout();
    setIsAuthenticated(false);
  };

  // Login Success Handler
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    refreshData();
  };

  // If user is not authenticated, render Login View
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Selected Patient
  const selectedPatient = selectedPatientId
    ? patients.find((p) => p.id === selectedPatientId) || null
    : null;

  // Assessments and Evolutions for selected patient
  const patientAssessments = selectedPatient
    ? assessments.filter((a) => a.patientId === selectedPatient.id)
    : [];
  const patientEvolutions = selectedPatient
    ? evolutions.filter((e) => e.patientId === selectedPatient.id)
    : [];

  // Handlers for Patient Creation
  const handlePatientSaved = (savedPatient: Patient) => {
    refreshData();
    setSelectedPatientId(savedPatient.id);
  };

  // Handler for New Evolution
  const handleOpenEvolution = (pat: Patient) => {
    setEvolutionPatient(pat);
  };

  const handleEvolutionSaved = () => {
    refreshData();
  };

  // Handler for Assessment Saved
  const handleAssessmentSaved = () => {
    refreshData();
    setIsCreatingAssessment(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Compulsory Password Change Modal */}
      {currentUser.mustChangePassword && (
        <ForcePasswordChangeModal
          user={currentUser}
          onPasswordChanged={(updatedUser) => {
            setCurrentUser(updatedUser);
            refreshData();
          }}
        />
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        profiles={profiles}
        currentView={currentView}
        onViewChange={(view) => {
          setSelectedPatientId(null);
          setIsCreatingAssessment(false);
          setCurrentView(view);
        }}
        onUserSwitch={handleUserSwitch}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: PATIENTS & CLINICAL RECORDS */}
        {currentView === 'patients' && (
          <>
            {isCreatingAssessment && selectedPatient ? (
              <NewAssessmentView
                patient={selectedPatient}
                currentUser={currentUser}
                onBack={() => setIsCreatingAssessment(false)}
                onSaved={handleAssessmentSaved}
              />
            ) : selectedPatient ? (
              <PatientDetailView
                patient={selectedPatient}
                currentUser={currentUser}
                physioList={profiles}
                assessments={patientAssessments}
                evolutions={patientEvolutions}
                onBack={() => setSelectedPatientId(null)}
                onNewAssessment={() => setIsCreatingAssessment(true)}
                onNewEvolution={() => setEvolutionPatient(selectedPatient)}
                onEditPatient={() => {
                  setEditingPatient(selectedPatient);
                  setIsPatientModalOpen(true);
                }}
                onPrintAssessment={(ass) =>
                  setPrintableData({ patient: selectedPatient, assessment: ass })
                }
              />
            ) : (
              <PatientsListView
                currentUser={currentUser}
                patients={patients}
                physioList={profiles}
                evolutions={evolutions}
                assessments={assessments}
                onSelectPatient={(p) => setSelectedPatientId(p.id)}
                onOpenNewPatientModal={() => {
                  setEditingPatient(null);
                  setIsPatientModalOpen(true);
                }}
                onQuickEvolution={handleOpenEvolution}
              />
            )}
          </>
        )}

        {/* VIEW 2: FINANCIAL CONTROL & REPASSE */}
        {currentView === 'financial' && (
          <FinancialReportsView
            currentUser={currentUser}
            patients={patients}
            evolutions={evolutions}
            onEvolutionsUpdated={refreshData}
          />
        )}

        {/* VIEW 3: ADMIN PANEL (Protected: Admin or Physio-Admin only) */}
        {currentView === 'admin' && hasAdminPrivileges(currentUser) && (
          <AdminPanel
            currentUser={currentUser}
            profiles={profiles}
            patients={patients}
            onProfilesUpdated={refreshData}
            onPatientsUpdated={refreshData}
          />
        )}
      </main>

      {/* Modals & Overlays */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        currentUser={currentUser}
        initialPatient={editingPatient}
        onClose={() => {
          setIsPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onPatientSaved={handlePatientSaved}
      />

      {evolutionPatient && (
        <EvolutionModal
          patient={evolutionPatient}
          currentUser={currentUser}
          isOpen={Boolean(evolutionPatient)}
          existingEvolution={null}
          nextSessionNumber={evolutions.filter((e) => e.patientId === evolutionPatient.id).length + 1}
          onClose={() => setEvolutionPatient(null)}
          onEvolutionSaved={handleEvolutionSaved}
        />
      )}

      {printableData && (
        <PrintProntuarioModal
          isOpen={Boolean(printableData)}
          patient={printableData.patient}
          assessment={printableData.assessment}
          physio={profiles.find((p) => p.id === printableData.assessment.physioId) || currentUser}
          onClose={() => setPrintableData(null)}
        />
      )}

      {/* Institutional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400">
            © 2026 Clínica Ortra de Ortopedia e Fisioterapia · Lauro de Freitas - BA · CNPJ: 14.892.301/0001-44
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Conformidade COFFITO & LGPD</span>
            <span>·</span>
            <span>Segurança da Informação por Design</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
