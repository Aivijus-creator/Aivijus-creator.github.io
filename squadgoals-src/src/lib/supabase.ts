import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Where the Supabase connection comes from, in priority order:
 * 1. window.SQUADGOALS_CONFIG in index.html / squadgoals.html (edit it once, publish)
 * 2. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at build time
 * 3. Values pasted into the setup screen (saved in this browser only)
 */
export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

declare global {
  interface Window {
    SQUADGOALS_CONFIG?: Partial<SupabaseConfig>;
  }
}

const LOCAL_CONFIG_KEY = 'squadgoals_supabase_config_v1';

export type ConfigSource = 'file' | 'env' | 'browser';

function clean(config: Partial<SupabaseConfig> | null | undefined): SupabaseConfig | null {
  const url = (config?.supabaseUrl ?? '').trim().replace(/\/+$/, '');
  const key = (config?.supabaseAnonKey ?? '').trim();
  if (!url || !key) return null;
  return { supabaseUrl: url, supabaseAnonKey: key };
}

/** Returns an error message if the values cannot be used, otherwise null. */
export function validateConfig(config: SupabaseConfig): string | null {
  let parsed: URL;
  try {
    parsed = new URL(config.supabaseUrl);
  } catch {
    return 'The project URL is not a valid URL (it looks like https://abcd1234.supabase.co).';
  }
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    return 'The project URL must start with https://';
  }
  if (isSecretKey(config.supabaseAnonKey)) {
    return 'That is a secret (service_role) key. Never put it in a web page: use the anon / publishable key instead.';
  }
  return null;
}

/** Detects service_role JWTs and sb_secret_ keys, which must never ship to a browser. */
function isSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

export function resolveConfig(): { config: SupabaseConfig; source: ConfigSource } | null {
  const fromFile = clean(typeof window !== 'undefined' ? window.SQUADGOALS_CONFIG : null);
  if (fromFile) return { config: fromFile, source: 'file' };

  const fromEnv = clean({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  });
  if (fromEnv) return { config: fromEnv, source: 'env' };

  try {
    const stored = localStorage.getItem(LOCAL_CONFIG_KEY);
    const fromBrowser = clean(stored ? JSON.parse(stored) : null);
    if (fromBrowser) return { config: fromBrowser, source: 'browser' };
  } catch {
    /* ignore */
  }
  return null;
}

export function saveBrowserConfig(config: SupabaseConfig): void {
  localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
}

export function clearBrowserConfig(): void {
  localStorage.removeItem(LOCAL_CONFIG_KEY);
}

let client: SupabaseClient | null = null;
let clientKey = '';

export function getSupabase(config: SupabaseConfig): SupabaseClient {
  const key = `${config.supabaseUrl}|${config.supabaseAnonKey}`;
  if (!client || clientKey !== key) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'squadgoals-auth',
      },
    });
    clientKey = key;
  }
  return client;
}
