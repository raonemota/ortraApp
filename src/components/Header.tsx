/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  ShieldCheck,
  ChevronDown,
  Database,
  Sparkles,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { testSupabaseConnection } from '../services/supabaseClient.ts';
import {
  formatPhysioDisplayName,
  getPersonInitials,
  hasAdminPrivileges,
} from '../utils/clinicalCalculations.ts';

interface HeaderProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  currentView: 'patients' | 'financial' | 'admin';
  onViewChange: (view: 'patients' | 'financial' | 'admin') => void;
  onUserSwitch: (user: UserProfile) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  profiles,
  currentView,
  onViewChange,
  onUserSwitch,
  onLogout,
}) => {
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    testSupabaseConnection().then((res) => {
      setSupabaseConnected(res.ok);
    });
  }, []);

  const isAdmin = hasAdminPrivileges(currentUser);
  const displayName = formatPhysioDisplayName(currentUser);
  const initial = getPersonInitials(currentUser.fullName);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => onViewChange('patients')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <img
                src="/assets/LogoClinicaOrtra.png"
                alt="Clínica Ortra"
                className="h-8 sm:h-9 w-auto object-contain max-w-[130px] sm:max-w-[160px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="hidden xs:block">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60 block w-fit">
                  Fisioterapia
                </span>
                <p className="text-[10px] text-slate-400 font-medium">
                  Lauro de Freitas · BA
                </p>
              </div>
            </button>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-800 pl-4 lg:pl-6">
              <button
                type="button"
                onClick={() => onViewChange('patients')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'patients'
                    ? 'bg-teal-950/80 text-teal-300 border border-teal-800/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Pacientes & Prontuários</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('financial')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'financial'
                    ? 'bg-teal-950/80 text-teal-300 border border-teal-800/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>Financeiro & Repasse</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onViewChange('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentView === 'admin'
                      ? 'bg-teal-950/80 text-teal-300 border border-teal-800/60'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Área Administrativa</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Status: Only symbol and blinking LED */}
            <div
              title="Supabase: Conexão ativa"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/80"
              aria-label="Conexão Supabase Ativa"
            >
              <Database className="h-3.5 w-3.5 text-teal-400" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-800 text-left transition-colors border border-slate-800 focus:outline-none"
              >
                {/* Avatar with correct pure name initial (e.g. M for Marcelo, C for Camila) */}
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-teal-600 text-white font-black text-xs uppercase shadow-xs">
                  {initial}
                </div>

                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 max-w-[130px] truncate block">
                      {displayName}
                    </span>
                    <div className="flex items-center gap-1">
                      {currentUser.role === 'physio' && (
                        <span className="text-[9px] uppercase font-black px-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          Fisio
                        </span>
                      )}
                      {(currentUser.role === 'admin' || currentUser.isAdmin) && (
                        <span className="text-[9px] uppercase font-black px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {currentUser.crefito || currentUser.email}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Switcher & Logout Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-slate-900 shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Alternar Perfil Ativo (Demo)
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1">
                    {profiles.map((p) => {
                      const isCurrent = p.id === currentUser.id;
                      const pDisplayName = formatPhysioDisplayName(p);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onUserSwitch(p);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                            isCurrent
                              ? 'bg-teal-50 font-bold text-teal-900'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <span className="block">{pDisplayName}</span>
                            <span className="text-[10px] text-slate-400">
                              {p.role === 'admin'
                                ? 'Administrador Geral'
                                : p.isAdmin
                                ? 'Fisio & Administrador'
                                : p.crefito}
                              {p.mustChangePassword ? ' · Troca Senha' : ''}
                            </span>
                          </div>
                          {isCurrent && <UserCheck className="h-4 w-4 text-teal-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg text-left transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-rose-600" />
                      <span>Sair do Sistema (Logoff)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Logout Button in Desktop Header */}
            <button
              type="button"
              onClick={onLogout}
              title="Fazer logoff do sistema"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation with Icons */}
        <div className="md:hidden flex items-center justify-around py-1.5 border-t border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => onViewChange('patients')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors ${
              currentView === 'patients'
                ? 'bg-teal-950 text-teal-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Pacientes</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('financial')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors ${
              currentView === 'financial'
                ? 'bg-teal-950 text-teal-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Financeiro</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors ${
                currentView === 'admin'
                  ? 'bg-teal-950 text-teal-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Administrativo</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1 px-2 py-1 rounded-md font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
