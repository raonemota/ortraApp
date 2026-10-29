/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Credentials provided in user configuration
export const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://doamjngwapqntdtlkzeo.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_WCSK77BWiaa65yrMuzZ66A_UPyngvBy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Cliente isolado para provisionar novos usuários no Supabase Auth (auth.users)
 * sem substituir nem sobrescrever a sessão do administrador logado no navegador.
 */
export const authAdminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Helper to check whether Supabase connectivity is active
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Conectado ao Supabase com sucesso.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro de conexão com Supabase' };
  }
}
