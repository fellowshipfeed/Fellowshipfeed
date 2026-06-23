export type PrimaryRole = 'owner' | 'head' | 'group_admin' | 'member';

export type Session = {
  user_id: string;
  name: string;
  initials: string;
  org_id: string;
  org_name: string;
  org_slug?: string | null;
  primary_role: PrimaryRole;
  member_group_ids: string[] | null;
  admin_group_ids?: string[] | null;
};

export type OrgResource = {
  label: string;
  key: string;
  url: string | null;
};

export type OrgUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  role_type: PrimaryRole | 'member';
  group_id: string | null;
  group_name: string | null;
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
  description?: string | null;
  member_count?: number;
  admin_name?: string | null;
  admin_user_id?: string | null;
  joined?: boolean;
};

export type ParishLinks = {
  parish_website_url: string | null;
  online_giving_url: string | null;
};

export type FeedEvent = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  group_id: string | null;
  group_slug: string | null;
  group_name: string | null;
  rsvped: boolean;
};

export type PostReactions = {
  heart: number;
  pray: number;
  in: number;
  amen: number;
};

export type FeedPost = {
  id: string;
  body: string;
  group_id: string | null;
  is_parish_wide: boolean;
  pinned: boolean;
  status: string;
  created_at: string;
  author: { id: string; name: string; initials: string } | null;
  author_is_admin?: boolean;
  attachments: { id: string; type: string; url: string; metadata: Record<string, unknown> | null }[];
  reactions: PostReactions;
  my_reactions: string[];
  saved: boolean;
  signup_config: PostSignupConfig | null;
  signup_count: number;
  user_signed_up: boolean;
};

export type PostSignupConfig = {
  title: string;
  capacity: number | null;
  form_fields: SignupField[];
};

export type SignupField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  hint?: string;
  options?: string[];
};

export type OrgCalendarSettings = {
  google_calendar_url: string | null;
  calendar_ics_url: string | null;
};

export type AdminEvent = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  location: string | null;
  capacity: number | null;
  group_id: string | null;
  group_name: string | null;
};

export type AdminMessage = {
  id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  group_id: string | null;
  group_name: string | null;
  from_user: { id: string; name: string; initials: string } | null;
};

export type AdminView = 'approvals' | 'events' | 'calendar' | 'messages';
