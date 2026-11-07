import React, { useEffect, useRef, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import App from './App';
import { AuthScreen, FullScreenStatus, SetupScreen } from './components/AuthScreen';
import {
  ConfigSource,
  SupabaseConfig,
  getSupabase,
  resolveConfig,
  saveBrowserConfig,
  clearBrowserConfig,
  validateConfig,
} from './lib/supabase';
import { Account, loadAccount } from './lib/cloud';
import { AccountData, loadSettings } from './utils/storage';

export default function Root() {
  const [resolved, setResolved] = useState<{ config: SupabaseConfig; source: ConfigSource } | null>(() =>
    resolveConfig()
  );

  // Apply the saved light/dark preference before anyone is signed in.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', loadSettings().darkMode);
  }, []);

  const saveConfig = (config: SupabaseConfig) => {
    saveBrowserConfig(config);
    setResolved({ config, source: 'browser' });
  };

  if (!resolved) return <SetupScreen onSave={saveConfig} />;

  const problem = validateConfig(resolved.config);
  if (problem) {
    return (
      <SetupScreen
        initial={resolved.source === 'browser' ? resolved.config : null}
        problem={
          resolved.source === 'file'
            ? `SQUADGOALS_CONFIG at the top of the HTML file needs fixing: ${problem}`
            : problem
        }
        onSave={saveConfig}
      />
    );
  }

  return (
    <AuthGate
      supabase={getSupabase(resolved.config)}
      onDisconnect={
        resolved.source === 'browser'
          ? () => {
              clearBrowserConfig();
              setResolved(null);
            }
          : undefined
      }
    />
  );
}

function describeLoadError(e: unknown): string {
  const message =
    e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  if (/schema cache|does not exist|relation .* not found|PGRST20[45]/i.test(message)) {
    return `The database tables are missing. Run supabase/schema.sql in your Supabase project's SQL Editor, then retry. (${message})`;
  }
  if (/failed to fetch|network/i.test(message)) {
    return 'Can’t reach the server. Check your internet connection and retry.';
  }
  return message;
}

const AuthGate: React.FC<{ supabase: SupabaseClient; onDisconnect?: () => void }> = ({
  supabase,
  onDisconnect,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loaded, setLoaded] = useState<{ account: Account; data: AccountData } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setAuthReady(true);
      })
      .catch(() => active && setAuthReady(true));
    // Keep this callback synchronous: supabase-js warns against awaiting inside it.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const current = userRef.current;
    setLoaded(null);
    setLoadError(null);
    if (!current) return;
    let cancelled = false;
    loadAccount(supabase, current)
      .then((result) => !cancelled && setLoaded(result))
      .catch((e) => !cancelled && setLoadError(describeLoadError(e)));
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, attempt]);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    setSession(null);
  };

  const buttonClass =
    'px-4 py-2 rounded-xl text-xs font-bold border border-[#EDE6D8] dark:border-[#332E2A] bg-white dark:bg-[#221F1C] hover:border-[#FF7A00] transition-colors cursor-pointer';

  if (!authReady) return <FullScreenStatus label="Loading SquadGoals…" />;
  if (!user) return <AuthScreen supabase={supabase} />;
  if (loadError) {
    return (
      <FullScreenStatus
        label="Couldn’t load your account"
        error={loadError}
        actions={
          <>
            <button className={buttonClass} onClick={() => setAttempt((n) => n + 1)}>
              Retry
            </button>
            <button className={buttonClass} onClick={signOut}>
              Log Out
            </button>
            {onDisconnect && (
              <button className={buttonClass} onClick={onDisconnect}>
                Change project
              </button>
            )}
          </>
        }
      />
    );
  }
  if (!loaded || loaded.account.userId !== userId) return <FullScreenStatus label="Loading your habits…" />;

  return (
    <App
      key={loaded.account.userId}
      supabase={supabase}
      account={loaded.account}
      initialData={loaded.data}
      onSignedOut={signOut}
    />
  );
};
