/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { clinicalStorage } from '../services/storageService.ts';
import { supabase } from '../services/supabaseClient.ts';

interface ForcePasswordChangeModalProps {
  user: UserProfile;
  onPasswordChanged: (updatedUser: UserProfile) => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  user,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated: UserProfile = {
        ...user,
        password: newPassword,
        mustChangePassword: false,
      };

      await clinicalStorage.saveProfile(updated);

      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (authErr) {
        console.warn('Aviso ao sincronizar senha no Supabase Auth:', authErr);
      }

      clinicalStorage.logAudit(
        'TROCA_SENHA_OBRIGATORIA',
        `Usuário ${user.fullName} (${user.email}) atualizou a senha temporária com sucesso.`
      );
      onPasswordChanged(updated);
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar a senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 id="force-password-title" className="text-lg font-bold text-slate-900">
              Primeiro Acesso: Troca de Senha Obrigatória
            </h2>
            <p className="text-xs text-slate-500">
              Clínica Ortra · Segurança da Informação & LGPD
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          Olá, <strong className="text-slate-800">{user.fullName}</strong>. Por motivos de segurança e cumprimento das diretrizes clínicas do COFFITO e LGPD, é obrigatório substituir sua senha provisória antes de acessar o prontuário eletrônico.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Nova Senha Pessoal
            </label>
            <div className="relative">
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                required
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-3 pr-10 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
              <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha digitada"
                required
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-3 pr-10 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
              <ShieldCheck className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Recomendações de Segurança:</p>
            <p>• Utilize letras maiúsculas, minúsculas, números e símbolos.</p>
            <p>• Nunca compartilhe sua senha de prontuário com terceiros.</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Atualizando credenciais...' : 'Definir Senha Definitiva e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
