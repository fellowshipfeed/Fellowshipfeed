export type PrimaryRole = 'owner' | 'head' | 'group_admin' | 'member';

export type Session = {
  user_id: string;
  name: string;
  initials: string;
  org_id: string;
  org_name: string;
  primary_role: PrimaryRole;
  member_group_ids: string[] | null;
};

export type PendingPost = {
  id: string;
  body: string;
  group_id: string | null;
  created_at: string;
  author: { id: string; name: string; initials: string } | null;
  group: { id: string; name: string } | null;
};

export type GroupAdmin = {
  user_id: string;
  group_id: string;
  granted_at: string;
  user: { name: string; initials: string; email: string } | null;
};

export type FeedGroup = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type FeedPost = {
  id: string;
  body: string;
  group_id: string | null;
  is_parish_wide: boolean;
  status: string;
  created_at: string;
  author: { id: string; name: string; initials: string } | null;
  attachments: { id: string; type: string; url: string; metadata: Record<string, unknown> | null }[];
};
