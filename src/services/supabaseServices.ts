import { supabase } from './supabaseClient';
import { Patient, Assessment, Evolution, UserProfile } from '../types/index';

export const supabaseService = {
  // ===============================
  // 1. PACIENTES
  // ===============================
  async getPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      cpf: p.cpf,
      birthDate: p.birth_date,
      phone: p.phone,
      emergencyContact: p.emergency_contact,
      emergencyContactName: p.emergency_contact_name,
      profession: p.profession,
      attendanceType: p.attendance_type,
      insuranceName: p.insurance_name,
      insuranceCardNumber: p.insurance_card_number,
      addressCity: p.address_city,
      addressState: p.address_state,
      notes: p.notes,
      createdAt: p.created_at,
    }));
  },

  async savePatient(patient: Partial<Patient>): Promise<Patient> {
    const payload = {
      full_name: patient.fullName,
      cpf: patient.cpf,
      birth_date: patient.birthDate,
      phone: patient.phone,
      emergency_contact: patient.emergencyContact,
      emergency_contact_name: patient.emergencyContactName,
      profession: patient.profession,
      attendance_type: patient.attendanceType || 'particular',
      insurance_name: patient.insuranceName,
      insurance_card_number: patient.insuranceCardNumber,
      notes: patient.notes,
    };

    if (patient.id) {
      // Atualização
      const { data, error } = await supabase
        .from('patients')
        .update(payload)
        .eq('id', patient.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // Inserção
      const { data, error } = await supabase
        .from('patients')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // ===============================
  // 2. AVALIAÇÕES CLÍNICAS (PRONTUÁRIO)
  // ===============================
  async getAssessmentsByPatient(patientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('clinical_evaluations')
      .select('*')
      .eq('patient_id', patientId)
      .order('evaluation_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async saveAssessment(assessment: any, physioId: string): Promise<any> {
    const { data, error } = await supabase
      .from('clinical_evaluations')
      .insert([
        {
          patient_id: assessment.patientId,
          physiotherapist_id: physioId,
          evaluation_date: assessment.evaluationDate || new Date().toISOString().split('T')[0],
          chief_complaint: assessment.chiefComplaint,
          history_current_illness: assessment.historyCurrentIllness,
          history_past_illness: assessment.historyPastIllness,
          medications_in_use: assessment.medicationsInUse,
          lifestyle_habits: assessment.lifestyleHabits || {},
          pain_eva_scale: assessment.painEvaScale,
          inspection_palpation: assessment.inspectionPalpation,
          range_of_motion_goniometry: assessment.rangeOfMotion || {},
          muscle_strength_oxford: assessment.muscleStrength || {},
          functional_kinetic_diagnosis: assessment.diagnosis,
          therapeutic_plan: assessment.plan,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===============================
  // 3. EVOLUÇÕES DE SESSÃO
  // ===============================
  async getEvolutionsByPatient(patientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('session_evolutions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async saveEvolution(evolution: any, physioId: string): Promise<any> {
    const { data, error } = await supabase
      .from('session_evolutions')
      .insert([
        {
          patient_id: evolution.patientId,
          physiotherapist_id: physioId,
          session_date: evolution.sessionDate || new Date().toISOString().split('T')[0],
          session_number: evolution.sessionNumber,
          eva_pre_session: evolution.evaPre,
          eva_post_session: evolution.evaPost,
          treatment_performed: evolution.treatmentPerformed,
          patient_response: evolution.patientResponse,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===============================
  // 4. CHECKLIST INICIAL
  // ===============================
  async saveChecklist(checklist: any, physioId: string): Promise<any> {
    const { data, error } = await supabase
      .from('patient_checklists')
      .insert([
        {
          patient_id: checklist.patientId,
          physiotherapist_id: physioId,
          has_medical_referral: checklist.hasMedicalReferral,
          referral_doctor_name: checklist.referralDoctorName,
          referral_doctor_crm: checklist.referralDoctorCrm,
          has_imaging_exams: checklist.hasImagingExams,
          lgpd_consent_signed: checklist.lgpdConsentSigned,
          pacemaker_or_implants: checklist.pacemakerOrImplants,
          implant_details: checklist.implantDetails,
          red_flags_identified: checklist.redFlagsIdentified,
          red_flags_notes: checklist.redFlagsNotes,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};