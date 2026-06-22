import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: session } = await supabase.from('my_session').select('*').single();

  if (!session) {
    redirect('/login?error=no-profile');
  }

  switch (session.primary_role) {
    case 'owner': redirect('/console');
    case 'head': redirect('/head');
    case 'group_admin': redirect('/admin');
    case 'member': redirect('/feed');
    default: redirect('/feed');
  }
}
