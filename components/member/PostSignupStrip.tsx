'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { FeedPost, SignupField } from '@/lib/types';

type Props = {
  post: FeedPost;
  userId: string;
  onSignedUp: () => void;
};

export function PostSignupStrip({ post, userId, onSignedUp }: Props) {
  const config = post.signup_config;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  if (!config) return null;

  const capacity = config.capacity;
  const full = capacity != null && post.signup_count >= capacity;
  const signedUp = post.user_signed_up;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const supabase = createClient();
    const { error: insertError } = await supabase.from('post_signups').insert({
      post_id: post.id,
      user_id: userId,
      responses,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setOpen(false);
    onSignedUp();
  }

  function renderField(field: SignupField) {
    const value = responses[field.id] ?? '';
    const common =
      'mt-1 w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent';

    if (field.type === 'longText' || field.type === 'allergies') {
      return (
        <textarea
          value={value}
          onChange={e => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
          required={field.required}
          rows={3}
          className={`${common} resize-none`}
          placeholder={field.hint}
        />
      );
    }

    return (
      <input
        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        value={value}
        onChange={e => setResponses(prev => ({ ...prev, [field.id]: e.target.value }))}
        required={field.required}
        className={common}
        placeholder={field.hint}
      />
    );
  }

  return (
    <>
      <div
        className={`rounded-[10px] border px-3.5 py-3 mb-3.5 flex items-center gap-3 ${
          full && !signedUp
            ? 'bg-cream-soft border-ink-muted'
            : 'border-success bg-gradient-to-r from-success-soft to-white'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 ${
            full && !signedUp ? 'bg-ink-muted' : 'bg-success'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8l3 3 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-ink">{config.title}</div>
          <div className="text-xs text-ink-soft flex items-center gap-2 mt-0.5">
            <span>
              {post.signup_count}
              {capacity != null ? ` of ${capacity}` : ''} signed up
            </span>
            {capacity != null && (
              <span className="inline-block h-1 flex-1 max-w-[100px] bg-line rounded overflow-hidden">
                <span
                  className="block h-full bg-success"
                  style={{ width: `${Math.min(100, (post.signup_count / capacity) * 100)}%` }}
                />
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={signedUp || (full && !signedUp)}
          onClick={() => setOpen(true)}
          className={`shrink-0 text-[13px] font-medium px-4 py-2 rounded-md ${
            signedUp
              ? 'bg-white border border-success text-success'
              : full
                ? 'bg-ink-muted text-white cursor-not-allowed'
                : 'bg-success text-white hover:opacity-90'
          }`}
        >
          {signedUp ? "✓ You're signed up" : full ? 'Spots filled' : 'Sign up'}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-display text-lg font-medium mb-1">{config.title}</h3>
            <p className="text-sm text-ink-soft mb-4">Fill in the details below to sign up.</p>
            <form onSubmit={submit} className="space-y-3">
              {config.form_fields.map(field => (
                <label key={field.id} className="block">
                  <span className="text-xs font-medium text-ink-soft">
                    {field.label}
                    {field.required ? ' *' : ''}
                  </span>
                  {renderField(field)}
                </label>
              ))}
              {error && <p className="text-sm text-red-700">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-line rounded-md py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-success text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Confirm sign-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
