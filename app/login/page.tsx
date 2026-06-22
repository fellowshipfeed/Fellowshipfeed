'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-line rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center font-display font-semibold">A</div>
          <div>
            <div className="font-display text-xl font-medium">Anchor</div>
            <div className="text-xs text-ink-muted">Sign in to your community</div>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">✉️</div>
            <div className="font-display text-lg font-medium mb-1">Check your inbox</div>
            <p className="text-sm text-ink-soft">We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-ink-muted font-semibold block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yourchurch.org"
                className="w-full px-3 py-2.5 border border-line rounded-md bg-cream-soft focus:outline-none focus:border-accent focus:bg-white"
              />
            </div>
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-accent text-white font-medium py-2.5 rounded-md hover:bg-accent-hover disabled:opacity-60">
              {loading ? 'Sending…' : 'Send me a magic link'}
            </button>
            <p className="text-xs text-ink-muted text-center">No password needed. We'll email you a sign-in link.</p>
          </form>
        )}
      </div>
    </div>
  );
}
