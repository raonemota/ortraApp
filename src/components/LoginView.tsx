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
  CheckCircle,
  Users,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { clinicalStorage } from '../services/storageService.ts';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('raonemota@hotmail.com');
  const [password, setPassword] = useState('admin123');
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
        setErrorMessage(result.message || 'Falha na autenticação via Supabase. Verifique e-mail e senha.');
      }
    } catch (err: any) {
      setErrorMessage(`Erro ao conectar ao Supabase: ${err?.message || 'Falha de rede'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMessage(null);
    setIsLoggingIn(true);
    try {
      const result = await clinicalStorage.login(quickEmail, quickPass);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Falha na autenticação.');
      }
    } catch (err: any) {
      setErrorMessage(`Erro ao conectar: ${err?.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
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
                // Fallback to text if missing
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
        <div className="p-6 space-y-5">
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
                  placeholder="usuario@ortra.com.br"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                  Senha
                </label>
                <span className="text-[10px] text-slate-400">Padrão demo: admin123 / ortra123</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-9 py-2 text-xs text-slate-900 bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Autenticando no Supabase...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Credentials Panel */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Acesso Rápido (Base de Dados Supabase)
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                disabled={isLoggingIn}
                onClick={() => handleQuickLogin('raonemota@hotmail.com', 'admin123')}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Raone Mota
                  </span>
                  <span className="text-[10px] text-slate-500">
                    raonemota@hotmail.com · Administrador Geral
                  </span>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded border border-teal-200">
                  Supabase DB
                </span>
              </button>

              <button
                type="button"
                disabled={isLoggingIn}
                onClick={() => handleQuickLogin('admin@ortra.com.br', 'admin123')}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Dra. Beatriz Ortra
                  </span>
                  <span className="text-[10px] text-slate-500">
                    admin@ortra.com.br · Administradora
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200">
                  Admin
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Clínica Ortra de Ortopedia e Fisioterapia · Lauro de Freitas - BA
          </p>
        </div>
      </div>
    </div>
  );
};
