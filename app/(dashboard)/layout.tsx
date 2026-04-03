import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, streak, total_points, level')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        userName={profile?.full_name ?? user.email?.split('@')[0]}
        userLevel={profile?.level ?? 1}
        userPoints={profile?.total_points ?? 0}
        streak={profile?.streak ?? 0}
      />
      <div className="flex-1 flex flex-col min-w-0 ml-64 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
