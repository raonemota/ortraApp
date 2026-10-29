/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { clinicalStorage } from '../services/storageService.ts';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoggingIn(true);

    try {
      const result = await clinicalStorage.login(email, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(
          result.message || 'E-mail ou senha incorretos. Por favor, verifique suas credenciais de acesso.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        'Não foi possível conectar ao sistema. Por favor, verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background Subtle Ambience */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Brand Banner Header */}
        <div className="bg-slate-950 p-6 text-center border-b border-slate-800">
          <div className="flex justify-center mb-3">
            <img
              src="/assets/LogoClinicaOrtra.png"
              alt="Clínica Ortra"
              className="h-10 sm:h-12 w-auto object-contain max-w-[200px]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Sistema de Prontuário Eletrônico & Gestão Fisioterapêutica
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/80 text-[10px] font-semibold">
            <ShieldCheck className="h-3 w-3 text-teal-400" />
            <span>Acesso Seguro · COFFITO & LGPD</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-9 py-2 text-xs text-slate-900 bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Acessando o prontuário...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Clínica Ortra de Ortopedia e Fisioterapia · Lauro de Freitas - BA
          </p>
        </div>
      </div>
    </div>
  );
};
