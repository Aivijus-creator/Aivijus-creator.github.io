import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Database,
  KeyRound,
  Trophy,
} from 'lucide-react';
import { SupabaseConfig, validateConfig } from '../lib/supabase';

/* ------------------------------------------------------------------ */
/* Shared layout                                                       */
/* ------------------------------------------------------------------ */

const AuthShell: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({ children, wide }) => (
  <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-[#FDFBF7] dark:bg-[#11100F] text-[#2C2C2C] dark:text-[#F5F2EB] overflow-hidden transition-colors duration-300">
    {/* Soft sunset glows */}
    <div className="pointer-events-none absolute -top-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#FF7A00]/15 dark:bg-[#FF7A00]/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-48 -right-32 w-[30rem] h-[30rem] rounded-full bg-[#FF5757]/12 dark:bg-[#FF5757]/10 blur-3xl" />

    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}
    >
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#FF5757] flex items-center justify-center text-white shadow-lg shadow-[#FF7A00]/30">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="mt-3 font-['Outfit'] font-extrabold text-2xl tracking-tight">SquadGoals</h1>
        <p className="mt-1 text-sm text-[#736C61] dark:text-[#A39B8F]">
          Build daily habits together. Race your friends for EXP.
        </p>
      </div>
      {children}
    </motion.div>
  </div>
);

const Field: React.FC<{
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  htmlFor: string;
}> = ({ label, icon, children, hint, htmlFor }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">
      {label}
    </label>
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9386] dark:text-[#7A7268]">
        {icon}
      </span>
      {children}
    </div>
    {hint && <p className="text-[11px] text-[#9B9386] dark:text-[#8C8479]">{hint}</p>}
  </div>
);

const inputClass =
  'w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-[#FDFBF7] dark:bg-[#141210] border border-[#EDE6D8] dark:border-[#332E2A] text-[#2C2C2C] dark:text-[#F5F2EB] placeholder:text-[#B5AC9E] dark:placeholder:text-[#5E574F] focus:outline-hidden focus:border-[#FF7A00] focus:ring-4 focus:ring-[#FF7A00]/12 transition-[border-color,box-shadow] duration-150';

const Alert: React.FC<{ type: 'error' | 'success'; children: React.ReactNode }> = ({ type, children }) => (
  <motion.div
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.15 }}
    role={type === 'error' ? 'alert' : 'status'}
    className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 leading-relaxed ${
      type === 'success'
        ? 'bg-[#EEF8F1] dark:bg-[#13261B] border-[#CDEED8] dark:border-[#10B981]/30 text-[#0E8F63] dark:text-[#34D399]'
        : 'bg-[#FFEBEB] dark:bg-[#2D1618] border-[#FFCCD0] dark:border-[#FF5757]/30 text-[#D93D3D] dark:text-[#FF8A8A]'
    }`}
  >
    {type === 'success' ? (
      <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
    ) : (
      <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
    )}
    <span>{children}</span>
  </motion.div>
);

const PrimaryButton: React.FC<{ loading: boolean; children: React.ReactNode; disabled?: boolean }> = ({
  loading,
  children,
  disabled,
}) => (
  <button
    type="submit"
    disabled={loading || disabled}
    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF7A00] to-[#FF5757] hover:from-[#E86B00] hover:to-[#E64848] shadow-md shadow-[#FF7A00]/25 hover:shadow-lg hover:shadow-[#FF7A00]/35 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Sign in / Sign up                                                   */
/* ------------------------------------------------------------------ */

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match. Please try again.';
  if (/email not confirmed/i.test(message))
    return 'Please confirm your email first. Check your inbox for the link we sent.';
  if (/already registered|already exists/i.test(message))
    return 'An account with this email already exists. Try signing in instead.';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a minute and try again.';
  if (/failed to fetch|network/i.test(message)) return 'Can’t reach the server. Check your internet connection.';
  return message;
}

type AuthTab = 'signin' | 'signup';

export const AuthScreen: React.FC<{ supabase: SupabaseClient }> = ({ supabase }) => {
  const [tab, setTab] = useState<AuthTab>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const cleanEmail = email.trim();
    const cleanName = displayName.trim().replace(/\s+/g, ' ');

    if (tab === 'signup') {
      if (cleanName.length < 1 || cleanName.length > 40) {
        setError('Please enter a display name (up to 40 characters).');
        return;
      }
      if (password.length < 6) {
        setError('Your password needs at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'signup') {
        const redirect = /^https?:$/.test(window.location.protocol)
          ? window.location.origin + window.location.pathname
          : undefined;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { display_name: cleanName }, emailRedirectTo: redirect },
        });
        if (signUpError) {
          setError(friendlyAuthError(signUpError.message));
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email already exists. Try signing in instead.');
        } else if (!data.session) {
          setInfo(`Almost there, ${cleanName}! We sent a confirmation link to ${cleanEmail}. Open it, then sign in here.`);
          setTab('signin');
          setPassword('');
        }
        // With a session, the auth listener switches to the dashboard.
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) setError(friendlyAuthError(signInError.message));
      }
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = tab === 'signup';

  return (
    <AuthShell>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="rounded-3xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2C2825] p-6 sm:p-8 shadow-xl shadow-[#2C2C2C]/[0.06] dark:shadow-black/40"
      >
        {/* Segmented tabs */}
        <div
          role="tablist"
          aria-label="Sign in or create an account"
          className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F2EDE2]/90 dark:bg-[#1E1C19] border border-[#E6DEC8]/60 dark:border-[#2E2A25]"
        >
          {(
            [
              { id: 'signin', label: 'Sign In' },
              { id: 'signup', label: 'Sign Up' },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchTab(t.id)}
                className={`relative py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  active
                    ? 'text-[#2C2C2C] dark:text-[#F5F2EB]'
                    : 'text-[#736C61] dark:text-[#9E9589] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="auth-active-tab"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-white dark:bg-[#2B2723] rounded-lg shadow-xs border border-[#EDE6D8]/80 dark:border-[#3B3530]"
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <h2 id="auth-title" className="font-['Outfit'] font-bold text-xl tracking-tight">
            {isSignUp ? 'Join your squad' : 'Welcome back'}
          </h2>
          <p className="mt-1 text-xs text-[#736C61] dark:text-[#A39B8F]">
            {isSignUp
              ? 'Create an account to save your streaks and climb the team leaderboard.'
              : 'Sign in to pick up your streak where you left off.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <AnimatePresence initial={false}>
            {isSignUp && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <Field
                  label="Display name"
                  htmlFor="auth-name"
                  icon={<User className="w-4 h-4" />}
                  hint="Shown to your friends on the leaderboard."
                >
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="nickname"
                    maxLength={40}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Kostas"
                    className={inputClass}
                    required
                  />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          <Field label="Email" htmlFor="auth-email" icon={<Mail className="w-4 h-4" />}>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              required
            />
          </Field>

          <Field
            label="Password"
            htmlFor="auth-password"
            icon={<Lock className="w-4 h-4" />}
            hint={isSignUp ? 'At least 6 characters.' : undefined}
          >
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Create a password' : 'Your password'}
              className={`${inputClass} pr-11`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#9B9386] hover:text-[#2C2C2C] dark:hover:text-[#F5F2EB] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Field>

          <AnimatePresence mode="popLayout">
            {error && (
              <Alert key="error" type="error">
                {error}
              </Alert>
            )}
            {info && (
              <Alert key="info" type="success">
                {info}
              </Alert>
            )}
          </AnimatePresence>

          <PrimaryButton loading={loading} disabled={!email.trim() || !password}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </PrimaryButton>
        </form>

        <p className="mt-5 text-center text-xs text-[#736C61] dark:text-[#A39B8F]">
          {isSignUp ? 'Already have an account? ' : 'New to the squad? '}
          <button
            type="button"
            onClick={() => switchTab(isSignUp ? 'signin' : 'signup')}
            className="font-bold text-[#FF7A00] hover:text-[#FF5757] transition-colors cursor-pointer"
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-[#9B9386] dark:text-[#7A7268] text-center">
        <Trophy className="w-3.5 h-3.5 shrink-0" />
        Friends see your name, level and EXP on the leaderboard. Your habits stay private.
      </p>
    </AuthShell>
  );
};

/* ------------------------------------------------------------------ */
/* Setup: shown until a Supabase project is connected                  */
/* ------------------------------------------------------------------ */

export const SetupScreen: React.FC<{
  initial?: SupabaseConfig | null;
  problem?: string | null;
  onSave: (config: SupabaseConfig) => void;
}> = ({ initial, problem, onSave }) => {
  const [url, setUrl] = useState(initial?.supabaseUrl ?? '');
  const [key, setKey] = useState(initial?.supabaseAnonKey ?? '');
  const [error, setError] = useState<string | null>(problem ?? null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config = { supabaseUrl: url.trim().replace(/\/+$/, ''), supabaseAnonKey: key.trim() };
    const message = validateConfig(config);
    if (message) {
      setError(message);
      return;
    }
    onSave(config);
  };

  return (
    <AuthShell wide>
      <div className="rounded-3xl bg-white/90 dark:bg-[#1A1816]/90 backdrop-blur-md border border-[#EDE6D8] dark:border-[#2C2825] p-6 sm:p-8 shadow-xl shadow-[#2C2C2C]/[0.06] dark:shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF5EB] dark:bg-[#261B12] border border-[#FADCC0] dark:border-[#FF7A00]/30 text-[#FF7A00] flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-bold text-lg tracking-tight">Connect your squad’s database</h2>
            <p className="text-xs text-[#736C61] dark:text-[#A39B8F]">
              Accounts and the leaderboard run on a free Supabase project.
            </p>
          </div>
        </div>

        <ol className="mt-5 space-y-2.5 text-xs text-[#736C61] dark:text-[#A39B8F] leading-relaxed list-none">
          {[
            <>Create a project at <span className="font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">supabase.com</span>.</>,
            <>
              In <span className="font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">SQL Editor</span>, run the file{' '}
              <code className="px-1 py-0.5 rounded bg-[#F2EDE2] dark:bg-[#26221E] text-[11px]">supabase/schema.sql</code>.
            </>,
            <>
              Copy the <span className="font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">Project URL</span> and the{' '}
              <span className="font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">anon / publishable key</span> from Project
              Settings → API, and paste them into <code className="px-1 py-0.5 rounded bg-[#F2EDE2] dark:bg-[#26221E] text-[11px]">SQUADGOALS_CONFIG</code> at the top of the HTML file so
              everyone gets them.
            </>,
          ].map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FF5757] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-px">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit} className="mt-6 pt-5 border-t border-[#F2ECE1] dark:border-[#262320] space-y-4" noValidate>
          <p className="text-xs font-semibold text-[#2C2C2C] dark:text-[#F5F2EB]">
            Or try it out in this browser only:
          </p>
          <Field label="Project URL" htmlFor="setup-url" icon={<Database className="w-4 h-4" />}>
            <input
              id="setup-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field
            label="Anon / publishable key"
            htmlFor="setup-key"
            icon={<KeyRound className="w-4 h-4" />}
            hint="Safe to share: Row Level Security protects the data. Never use the service_role / secret key."
          >
            <input
              id="setup-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOi… or sb_publishable_…"
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <AnimatePresence>{error && <Alert type="error">{error}</Alert>}</AnimatePresence>
          <PrimaryButton loading={false} disabled={!url.trim() || !key.trim()}>
            Connect
          </PrimaryButton>
        </form>
      </div>
    </AuthShell>
  );
};

/* ------------------------------------------------------------------ */
/* Full-screen status                                                  */
/* ------------------------------------------------------------------ */

export const FullScreenStatus: React.FC<{
  label: string;
  error?: string | null;
  actions?: React.ReactNode;
}> = ({ label, error, actions }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-[#FDFBF7] dark:bg-[#11100F] text-[#2C2C2C] dark:text-[#F5F2EB]">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7A00] to-[#FF5757] flex items-center justify-center text-white shadow-lg shadow-[#FF7A00]/30">
      {error ? <AlertCircle className="w-6 h-6" /> : <Loader2 className="w-6 h-6 animate-spin" />}
    </div>
    <p className="text-sm font-semibold">{label}</p>
    {error && (
      <p className="max-w-md text-center text-xs text-[#736C61] dark:text-[#A39B8F] leading-relaxed">{error}</p>
    )}
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
