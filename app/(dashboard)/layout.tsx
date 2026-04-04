'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name?: string; streak?: number; total_points?: number; level?: number } | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      setUserEmail(session.user.email ?? '');
      const { data } = await supabase
        .from('profiles')
        .select('full_name, streak, total_points, level')
        .eq('id', session.user.id)
        .single();
      setProfile(data);
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        userName={profile?.full_name ?? userEmail.split('@')[0]}
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
