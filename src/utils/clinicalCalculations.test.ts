import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCPF,
  formatCPF,
  calculateAge,
  calculateFinancialMetrics,
  formatCurrencyBRL,
  getOxfordGradeDescription,
  getEvaColorInfo,
  getCleanPersonName,
  getPersonInitials,
  formatPhysioDisplayName,
  hasAdminPrivileges,
} from './clinicalCalculations.ts';

test('validateCPF identifies valid and invalid CPFs correctly', () => {
  assert.equal(validateCPF('52998224725'), true);
  assert.equal(validateCPF('529.982.247-25'), true);
  assert.equal(validateCPF('11111111111'), false);
  assert.equal(validateCPF('00000000000'), false);
  assert.equal(validateCPF('12345'), false);
  assert.equal(validateCPF(''), false);
  assert.equal(validateCPF('52998224720'), false);
});

test('formatCPF formats clean digits into 000.000.000-00', () => {
  assert.equal(formatCPF('52998224725'), '529.982.247-25');
  assert.equal(formatCPF('12345678901'), '123.456.789-01');
});

test('calculateAge calculates age properly against reference date', () => {
  const ref = new Date('2026-10-27');
  assert.equal(calculateAge('1990-10-27', ref), 36);
  assert.equal(calculateAge('1990-10-28', ref), 35);
  assert.equal(calculateAge('2000-01-01', ref), 26);
});

test('calculateFinancialMetrics correctly sums gross, net physio and clinic splits', () => {
  const sessions = [
    { sessionValue: 150, paymentStatus: 'paid' as const, attendanceStatus: 'completed' as const },
    { sessionValue: 150, paymentStatus: 'paid' as const, attendanceStatus: 'completed' as const },
    { sessionValue: 200, paymentStatus: 'pending' as const, attendanceStatus: 'completed' as const },
    { sessionValue: 150, paymentStatus: 'pending' as const, attendanceStatus: 'missed_justified' as const },
  ];

  const summary = calculateFinancialMetrics(sessions, 60);
  assert.equal(summary.totalSessions, 4);
  assert.equal(summary.completedCount, 3);
  assert.equal(summary.missedCount, 1);
  assert.equal(summary.grossTotal, 500);
  assert.equal(summary.paidTotal, 300);
  assert.equal(summary.pendingTotal, 200);
  assert.equal(summary.physioNetEarned, 180);
  assert.equal(summary.clinicRetained, 120);
});

test('getPersonInitials extracts correct initial without Dr or Dra prefix', () => {
  assert.equal(getPersonInitials('Marcelo Carvalho'), 'M');
  assert.equal(getPersonInitials('Dr. Marcelo Carvalho'), 'M');
  assert.equal(getPersonInitials('Dra. Camila Santos'), 'C');
  assert.equal(getPersonInitials('Camila Santos'), 'C');
  assert.equal(getPersonInitials('Beatriz Ortra'), 'B');
});

test('formatPhysioDisplayName derives Dr or Dra based on gender', () => {
  assert.equal(
    formatPhysioDisplayName({ fullName: 'Marcelo Carvalho', gender: 'M', role: 'physio', crefito: 'CREFITO-7/14298-F' }),
    'Dr. Marcelo Carvalho'
  );
  assert.equal(
    formatPhysioDisplayName({ fullName: 'Dr. Marcelo Carvalho', gender: 'M', role: 'physio', crefito: 'CREFITO-7/14298-F' }),
    'Dr. Marcelo Carvalho'
  );
  assert.equal(
    formatPhysioDisplayName({ fullName: 'Camila Santos', gender: 'F', role: 'physio', crefito: 'CREFITO-7/22341-F' }),
    'Dra. Camila Santos'
  );
});

test('hasAdminPrivileges identifies admin and physio-admin roles', () => {
  assert.equal(hasAdminPrivileges({ role: 'admin' }), true);
  assert.equal(hasAdminPrivileges({ role: 'physio', isAdmin: true }), true);
  assert.equal(hasAdminPrivileges({ role: 'physio', isAdmin: false }), false);
  assert.equal(hasAdminPrivileges(null), false);
});

test('UUID format regex matches UUIDs correctly', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assert.equal(uuidRegex.test('b0000000-0000-4000-8000-000000000001'), true);
  assert.equal(uuidRegex.test('pat_01'), false);
  assert.equal(uuidRegex.test('user_admin_01'), false);
});
