import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { LandingPage } from '@/components/LandingPage';
import { getRolePath } from '@/lib/role-redirect';
import type { Session } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: sessionData } = await supabase.from('my_session').select('*').single();
    const session = sessionData as Session | null;

    if (session) {
      redirect(getRolePath(session.primary_role));
    }

    redirect('/login?error=no-profile');
  }

  return <LandingPage />;
}
