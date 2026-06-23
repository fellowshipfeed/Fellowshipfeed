'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { PendingPost } from '@/lib/types';
import { SIGNUP_PRESETS, buildSignupConfig, type PostSignupConfig } from '@/lib/signup-fields';

type PresetKey = keyof typeof SIGNUP_PRESETS;

function defaultSignupTitle(post: PendingPost) {
  const snippet = post.body.trim().slice(0, 60);
  return post.group?.name ? `${post.group.name} sign-up` : snippet || 'Event sign-up';
}

export function ApprovalQueue({
  initialPending,
  currentUserId,
  onPendingChange,
}: {
  initialPending: PendingPost[];
  currentUserId: string;
  onPendingChange?: (pending: PendingPost[]) => void;
}) {
  const [pending, setPending] = useState<PendingPost[]>(initialPending);
  const [message, setMessage] = useState('');
  const [signupEnabled, setSignupEnabled] = useState<Record<string, boolean>>({});
  const [signupTitles, setSignupTitles] = useState<Record<string, string>>({});
  const [signupCapacity, setSignupCapacity] = useState<Record<string, string>>({});
  const [signupPresets, setSignupPresets] = useState<Record<string, Set<PresetKey>>>({});

  function getPresets(postId: string): Set<PresetKey> {
    return signupPresets[postId] ?? new Set<PresetKey>(['name', 'email']);
  }

  function togglePreset(postId: string, key: PresetKey) {
    setSignupPresets(prev => {
      const next = new Set(prev[postId] ?? ['name', 'email']);
      if (next.has(key)) {
        if (key === 'name' || key === 'email') return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return { ...prev, [postId]: next };
    });
  }

  function buildConfig(post: PendingPost): PostSignupConfig | null {
    if (!signupEnabled[post.id]) return null;
    const capacityRaw = signupCapacity[post.id]?.trim();
    return buildSignupConfig(
      signupTitles[post.id]?.trim() || defaultSignupTitle(post),
      capacityRaw ? Number(capacityRaw) : null,
      getPresets(post.id),
    );
  }

  function updatePending(next: PendingPost[]) {
    setPending(next);
    onPendingChange?.(next);
  }

  async function approve(post: PendingPost) {
    const signupConfig = buildConfig(post);
    const supabase = createClient();
    const update: Record<string, unknown> = {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: currentUserId,
    };
    if (signupConfig) {
      update.signup_config = signupConfig;
    }

    let { error } = await supabase.from('posts').update(update).eq('id', post.id);

    if (error && signupConfig && error.message.includes('signup_config')) {
      const { signup_config: _removed, ...withoutSignup } = update;
      const retry = await supabase.from('posts').update(withoutSignup).eq('id', post.id);
      error = retry.error;
      if (!error) {
        setMessage(
          'Approved — sign-ups need migration 08_admin_events_signups.sql in Supabase. Post is live without sign-up.',
        );
        updatePending(pending.filter(x => x.id !== post.id));
        setTimeout(() => setMessage(''), 5000);
        await supabase.from('moderation_log').insert({
          post_id: post.id,
          admin_id: currentUserId,
          action: 'approved',
        });
        return;
      }
    }

    if (error) {
      setMessage('Error: ' + error.message);
      return;
    }
    await supabase.from('moderation_log').insert({
      post_id: post.id,
      admin_id: currentUserId,
      action: 'approved',
    });
    updatePending(pending.filter(x => x.id !== post.id));
    setMessage(signupConfig ? 'Approved with sign-up enabled.' : 'Approved — now live in the feed.');
    setTimeout(() => setMessage(''), 3000);
  }

  async function reject(id: string) {
    const reason = window.prompt('Reason (the member will see this — be kind):');
    if (reason === null) return;
    const supabase = createClient();
    await supabase.from('posts').update({ status: 'rejected' }).eq('id', id);
    await supabase.from('moderation_log').insert({
      post_id: id,
      admin_id: currentUserId,
      action: 'rejected',
      reason,
    });
    updatePending(pending.filter(x => x.id !== id));
    setMessage('Rejected — member has been notified.');
    setTimeout(() => setMessage(''), 3000);
  }

  if (pending.length === 0) {
    return (
      <div className="bg-white border border-dashed border-line rounded-xl p-12 text-center">
        <div className="text-2xl mb-2">✓</div>
        <h3 className="font-display text-lg font-medium mb-1">All clear</h3>
        <p className="text-sm text-ink-soft max-w-xs mx-auto">
          Nothing to review right now. Member posts appear here as they come in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded p-3">{message}</div>
      )}
      {pending.map(p => {
        const time = new Date(p.created_at).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const enabled = signupEnabled[p.id] ?? false;
        const presets = getPresets(p.id);

        return (
          <div key={p.id} className="bg-white border border-line rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-accent mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
              {p.group?.name || 'Parish-wide'}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-accent-soft text-accent font-semibold text-xs flex items-center justify-center">
                {p.author?.initials}
              </div>
              <div>
                <div className="font-medium text-sm">{p.author?.name}</div>
                <div className="text-[11px] text-ink-muted">Submitted {time}</div>
              </div>
            </div>
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap mb-4">{p.body}</div>

            <div className="border border-line-soft rounded-lg p-4 mb-4 bg-cream-soft/50">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => {
                    setSignupEnabled(prev => ({ ...prev, [p.id]: e.target.checked }));
                    if (e.target.checked && !signupTitles[p.id]) {
                      setSignupTitles(prev => ({ ...prev, [p.id]: defaultSignupTitle(p) }));
                    }
                  }}
                  className="rounded border-line"
                />
                Add sign-up to this post
              </label>

              {enabled && (
                <div className="mt-3 space-y-3 pl-6">
                  <label className="block">
                    <span className="text-xs text-ink-muted font-medium">Sign-up title</span>
                    <input
                      value={signupTitles[p.id] ?? defaultSignupTitle(p)}
                      onChange={e =>
                        setSignupTitles(prev => ({ ...prev, [p.id]: e.target.value }))
                      }
                      className="mt-1 w-full border border-line rounded-md px-3 py-1.5 text-sm bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-muted font-medium">Capacity (optional)</span>
                    <input
                      type="number"
                      min={1}
                      value={signupCapacity[p.id] ?? ''}
                      onChange={e =>
                        setSignupCapacity(prev => ({ ...prev, [p.id]: e.target.value }))
                      }
                      placeholder="Unlimited"
                      className="mt-1 w-32 border border-line rounded-md px-3 py-1.5 text-sm bg-white"
                    />
                  </label>
                  <div>
                    <span className="text-xs text-ink-muted font-medium block mb-2">
                      Sign-up fields
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(SIGNUP_PRESETS) as PresetKey[]).map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => togglePreset(p.id, key)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            presets.has(key)
                              ? 'bg-accent text-white border-accent'
                              : 'bg-white text-ink-soft border-line'
                          }`}
                        >
                          {SIGNUP_PRESETS[key].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-line-soft">
              <button
                type="button"
                onClick={() => reject(p.id)}
                className="text-sm px-3 py-1.5 border border-line rounded-md text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => approve(p)}
                className="ml-auto text-sm px-4 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800 font-medium flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8l3 3 7-7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
