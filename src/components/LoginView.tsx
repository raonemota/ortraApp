/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types/index';

interface LoginViewProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Autenticar no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw new Error(
          authError.message === 'Invalid login credentials'
            ? 'Credenciais inválidas. Verifique o e-mail e a palavra-passe.'
            : authError.message
        );
      }

      if (!authData.user) {
        throw new Error('Utilizador não encontrado.');
      }

      // 2. Procurar perfil correspondente na tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error(
          'Perfil de utilizador não encontrado no sistema. Contacte o administrador.'
        );
      }

      if (!profileData.active) {
        await supabase.auth.signOut();
        throw new Error('Esta conta está inativa. Contacte a administração.');
      }

      // 3. Mapear para o tipo UserProfile da aplicação
      const mappedProfile: UserProfile = {
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        role: profileData.role,
        isAdmin: profileData.role === 'admin',
        phone: profileData.phone || '',
        crefito: profileData.crefito || '',
        commissionRate: profileData.default_session_rate || 0,
        hasCompletedTour: profileData.has_completed_tour,
        mustChangePassword: profileData.must_change_password,
        active: profileData.active,
        createdAt: profileData.created_at,
      };

      onLoginSuccess(mappedProfile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro ao tentar iniciar sessão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/logo-ortra.png"
              alt="Clínica Ortra"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                // Fallback para caso o proxy da imagem ainda não esteja configurado
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Portal da Fisioterapia
          </h2>
          <p className="text-sm text-slate-400">
            Aceda com as suas credenciais institucionais
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-sm text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              E-mail Profissional
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@clinicaortra.com.br"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Palavra-passe
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-950 text-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                A autenticar...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Clínica Ortra • Gestão e Prontuário Cinético-Funcional
          </p>
        </div>
      </div>
    </div>
  );
};