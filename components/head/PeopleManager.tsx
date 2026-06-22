'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import type { FeedGroup, OrgUser, PrimaryRole, Session } from '@/lib/types';
import { getInitials } from '@/lib/format';

const roleOptions: { value: PrimaryRole | 'member'; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'group_admin', label: 'Group admin' },
  { value: 'head', label: 'Head of parish' },
];

type Props = {
  session: Session;
  users: OrgUser[];
  groups: FeedGroup[];
  canAssignHead: boolean;
};

export function PeopleManager({ session, users: initialUsers, groups, canAssignHead }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function saveUser(user: OrgUser) {
    if (!session.org_id) return;
    setSavingId(user.id);
    setMessage('');
    const supabase = createClient();

    const initials = getInitials(user.name, 2);
    const { error: userError } = await supabase
      .from('users')
      .update({ name: user.name.trim(), initials })
      .eq('id', user.id);

    if (userError) {
      setSavingId(null);
      setMessage(userError.message);
      return;
    }

    await supabase.from('roles').delete().eq('user_id', user.id).eq('org_id', session.org_id);

    if (user.role_type === 'head' && canAssignHead) {
      await supabase.from('roles').insert({
        user_id: user.id,
        org_id: session.org_id,
        group_id: null,
        role_type: 'head',
      });
    } else if (user.role_type === 'group_admin' && user.group_id) {
      await supabase.from('roles').insert({
        user_id: user.id,
        org_id: session.org_id,
        group_id: user.group_id,
        role_type: 'group_admin',
      });
    }

    setUsers(prev =>
      prev.map(u => (u.id === user.id ? { ...u, name: user.name.trim(), initials, role_type: user.role_type } : u))
    );
    setSavingId(null);
    setMessage(`Saved ${user.name}.`);
    router.refresh();
    setTimeout(() => setMessage(''), 3000);
  }

  function updateUser(id: string, patch: Partial<OrgUser>) {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...patch } : u)));
  }

  return (
    <div className="space-y-3">
      {message && <div className="text-sm text-success bg-success-soft border border-success/20 rounded-lg p-3">{message}</div>}

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_140px_1fr_80px] gap-3 px-5 py-3 border-b border-line-soft text-[10px] uppercase tracking-wider font-semibold text-ink-muted hidden md:grid">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Group (if admin)</span>
          <span />
        </div>
        {users.map(user => (
          <div key={user.id} className="px-5 py-4 border-b border-line-soft last:border-b-0 grid gap-3 md:grid-cols-[1.2fr_1fr_140px_1fr_80px] md:items-center">
            <input
              value={user.name}
              onChange={e => updateUser(user.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-md bg-cream-soft text-sm focus:outline-none focus:border-accent focus:bg-white"
            />
            <div className="text-sm text-ink-soft truncate">{user.email}</div>
            <select
              value={user.role_type}
              onChange={e => updateUser(user.id, { role_type: e.target.value as OrgUser['role_type'] })}
              className="w-full px-2 py-2 border border-line rounded-md bg-white text-sm"
            >
              {roleOptions
                .filter(o => o.value !== 'head' || canAssignHead)
                .map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </select>
            <select
              value={user.group_id ?? ''}
              disabled={user.role_type !== 'group_admin'}
              onChange={e => updateUser(user.id, { group_id: e.target.value || null })}
              className="w-full px-2 py-2 border border-line rounded-md bg-white text-sm disabled:opacity-50"
            >
              <option value="">Select group</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => saveUser(user)}
              disabled={savingId === user.id}
              className="text-sm font-medium bg-accent text-white px-3 py-2 rounded-md hover:bg-accent-hover disabled:opacity-50"
            >
              {savingId === user.id ? '…' : 'Save'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
