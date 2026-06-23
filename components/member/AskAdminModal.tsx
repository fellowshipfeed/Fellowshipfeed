'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

type Props = {
  groupId: string;
  groupName: string;
  adminName: string | null;
  adminUserId: string | null;
  headUserId: string | null;
  currentUserId: string;
  onClose: () => void;
};

export function AskAdminModal({
  groupId,
  groupName,
  adminName,
  adminUserId,
  headUserId,
  currentUserId,
  onClose,
}: Props) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const recipientId = adminUserId ?? headUserId;
  const recipientLabel = adminName ?? 'your parish head';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !recipientId) return;

    setSubmitting(true);
    setError('');
    const supabase = createClient();
    const { error: insertError } = await supabase.from('messages').insert({
      from_user_id: currentUserId,
      to_user_id: recipientId,
      group_id: groupId,
      body: trimmed,
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/45 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {sent ? (
          <>
            <h3 className="font-display text-lg font-medium mb-2">Question sent</h3>
            <p className="text-sm text-ink-soft mb-5">
              Your message was sent to {recipientLabel} for {groupName}. They&apos;ll get back to you soon.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h3 className="font-display text-lg font-medium mb-1">Ask admin</h3>
            <p className="text-sm text-ink-soft mb-4">
              Send a private question to {recipientLabel} about {groupName}.
            </p>
            {!recipientId ? (
              <p className="text-sm text-red-700 mb-4">
                No admin is assigned to this group yet. Please contact your parish office directly.
              </p>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-ink-soft">Your question</span>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    required
                    rows={4}
                    autoFocus
                    placeholder="What would you like to ask?"
                    className="mt-1 w-full border border-line rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
                  />
                </label>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 border border-line rounded-md py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !body.trim()}
                    className="flex-1 bg-accent text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {submitting ? 'Sending…' : 'Send question'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
