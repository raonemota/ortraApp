/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Validates Brazilian CPF with check digits calculation.
 */
export function validateCPF(cpfRaw: string): boolean {
  if (!cpfRaw) return false;
  const clean = cpfRaw.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  // Reject known repeating patterns like 11111111111
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Validate 1st digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  let firstDigit = rev >= 10 ? 0 : rev;
  if (firstDigit !== parseInt(clean.charAt(9), 10)) return false;

  // Validate 2nd digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  let secondDigit = rev >= 10 ? 0 : rev;
  return secondDigit === parseInt(clean.charAt(10), 10);
}

/**
 * Formats a raw CPF into 000.000.000-00 format
 */
export function formatCPF(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  return clean
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/**
 * Formats a Brazilian Phone/WhatsApp into (00) 00000-0000
 */
export function formatPhone(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 10) {
    return clean
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return clean
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Calculates current age from a birth date string (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr: string, referenceDate: Date = new Date()): number {
  if (!birthDateStr) return 0;
  const parts = birthDateStr.split('-');
  if (parts.length < 3) return 0;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);

  const birth = new Date(birthYear, birthMonth, birthDay);
  if (isNaN(birth.getTime())) return 0;

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const m = referenceDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Financial metrics calculation
 */
export interface SessionFinancialItem {
  sessionValue: number;
  paymentStatus: 'paid' | 'pending';
  attendanceStatus: 'completed' | 'missed_justified' | 'missed_unjustified';
}

export interface FinancialSummary {
  totalSessions: number;
  completedCount: number;
  missedCount: number;
  grossTotal: number;
  paidTotal: number;
  pendingTotal: number;
  commissionRate: number; // e.g. 60 means 60%
  physioNetEarned: number;
  clinicRetained: number;
}

export function calculateFinancialMetrics(
  sessions: SessionFinancialItem[],
  commissionRate: number = 60
): FinancialSummary {
  let completedCount = 0;
  let missedCount = 0;
  let grossTotal = 0;
  let paidTotal = 0;
  let pendingTotal = 0;

  for (const session of sessions) {
    if (session.attendanceStatus === 'completed') {
      completedCount++;
      const val = Number(session.sessionValue) || 0;
      grossTotal += val;
      if (session.paymentStatus === 'paid') {
        paidTotal += val;
      } else {
        pendingTotal += val;
      }
    } else {
      missedCount++;
    }
  }

  const rate = Math.min(100, Math.max(0, commissionRate)) / 100;
  const physioNetEarned = paidTotal * rate;
  const clinicRetained = paidTotal * (1 - rate);

  return {
    totalSessions: sessions.length,
    completedCount,
    missedCount,
    grossTotal,
    paidTotal,
    pendingTotal,
    commissionRate,
    physioNetEarned,
    clinicRetained,
  };
}

/**
 * Formats a number to Brazilian Real (R$) currency representation
 */
export function formatCurrencyBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

/**
 * Oxford Muscle Strength Scale Description
 */
export function getOxfordGradeDescription(grade: number): string {
  switch (grade) {
    case 0:
      return 'Grau 0: Paralisia completa / Nenhuma contração visível ou palpável';
    case 1:
      return 'Grau 1: Contração palpável ou visível, sem deslocamento do segmento articular';
    case 2:
      return 'Grau 2: Movimento ativo em amplitude completa eliminando a gravidade';
    case 3:
      return 'Grau 3: Movimento ativo em amplitude completa contra a gravidade';
    case 4:
      return 'Grau 4: Movimento ativo contra a gravidade e resistência moderada';
    case 5:
      return 'Grau 5: Força normal contra a gravidade e resistência máxima';
    default:
      return 'Não avaliado';
  }
}

/**
 * EVA (Escala Visual Analógica) rating info
 */
export function getEvaColorInfo(score: number): {
  label: string;
  badgeClass: string;
  accentHex: string;
} {
  const s = Math.round(score);
  if (s === 0) {
    return {
      label: 'Sem dor (0)',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      accentHex: '#10b981',
    };
  }
  if (s >= 1 && s <= 3) {
    return {
      label: `Dor leve (${s})`,
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      accentHex: '#14b8a6',
    };
  }
  if (s >= 4 && s <= 6) {
    return {
      label: `Dor moderada (${s})`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      accentHex: '#f59e0b',
    };
  }
  if (s >= 7 && s <= 9) {
    return {
      label: `Dor intensa (${s})`,
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
      accentHex: '#f97316',
    };
  }
  return {
    label: 'Dor insuportável (10)',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    accentHex: '#ef4444',
  };
}

/**
 * Strips any Dr./Dra. prefix to get pure person name
 */
export function getCleanPersonName(name: string): string {
  if (!name) return '';
  return name.replace(/^(dr[a]?\.\s*|dr[a]?\s+)/i, '').trim();
}

/**
 * Returns the true initials from pure name (ignoring Dr./Dra.)
 */
export function getPersonInitials(name: string): string {
  const clean = getCleanPersonName(name);
  return clean ? clean.charAt(0).toUpperCase() : 'O';
}

/**
 * Formats clinical professional display name with Dr. or Dra. based on gender
 */
export function formatPhysioDisplayName(profile: {
  fullName: string;
  gender?: 'M' | 'F';
  role?: string;
  crefito?: string;
}): string {
  const clean = getCleanPersonName(profile.fullName);
  if (!clean) return '';

  if ((profile.role === 'admin' || profile.role === 'receptionist') && !profile.crefito) {
    return clean;
  }

  const prefix = profile.gender === 'F' ? 'Dra.' : 'Dr.';
  return `${prefix} ${clean}`;
}

/**
 * Checks if a user has administrative privileges (Pure Admin or Physio-Admin)
 */
export function hasAdminPrivileges(
  user: { role?: string; isAdmin?: boolean } | null | undefined
): boolean {
  if (!user) return false;
  return user.role === 'admin' || Boolean(user.isAdmin);
}

/**
 * Checks if a user is a receptionist
 */
export function isReceptionist(
  user: { role?: string } | null | undefined
): boolean {
  if (!user) return false;
  return user.role === 'receptionist';
}

/**
 * Formats a date string (YYYY-MM-DD) into compact/abbreviated Portuguese for mobile screens
 * Ex: "qui., 29 de out. de 2026"
 */
export function formatDateCompact(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return dateStr;
  }
}

