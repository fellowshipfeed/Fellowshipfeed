'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const errorMessages: Record<string, string> = {
  auth: 'Sign-in failed. Check your email and password and try again.',
  'no-profile': 'Your account is not linked to a profile yet. Contact your administrator.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  const bannerError = queryError ? errorMessages[queryError] ?? 'Something went wrong. Try again.' : '';

  return (
    <div className="w-full max-w-md bg-white border border-line rounded-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center font-display font-semibold">F</div>
        <div>
          <div className="font-display text-xl font-medium">FellowshipFeed</div>
          <div className="text-xs text-ink-muted">Welcome to FellowshipFeed</div>
        </div>
      </div>

      {bannerError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-4">{bannerError}</div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-ink-muted font-semibold block mb-2">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@yourchurch.org"
            className="w-full px-3 py-2.5 border border-line rounded-md bg-cream-soft focus:outline-none focus:border-accent focus:bg-white"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-ink-muted font-semibold block mb-2">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full px-3 py-2.5 border border-line rounded-md bg-cream-soft focus:outline-none focus:border-accent focus:bg-white"
          />
        </div>
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white font-medium py-2.5 rounded-md hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-xs text-ink-muted text-center">
          Accounts are created by your parish administrator.
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={<div className="w-full max-w-md bg-white border border-line rounded-xl p-8 text-sm text-ink-muted">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
