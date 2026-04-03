'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, BookMarked, FileText, Timer, BarChart2, Calendar, Settings, LogOut, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const nav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/subjects',   label: 'Subjects',   icon: BookMarked },
  { href: '/notes',      label: 'Notes',      icon: FileText },
  { href: '/timer',      label: 'Study Timer',icon: Timer },
  { href: '/progress',   label: 'Progress',   icon: BarChart2 },
  { href: '/planner',    label: 'Planner',    icon: Calendar },
];

interface SidebarProps { userName?: string | null; userLevel?: number; userPoints?: number; streak?: number; }

export default function Sidebar({ userName, userLevel = 1, userPoints = 0, streak = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r z-40" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-lg gradient-text">StudyAI</span>
      </div>

      {/* User card */}
      <div className="mx-3 mt-4 mb-2 p-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            {userName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{userName ?? 'Student'}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Level {userLevel}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />{userPoints} pts</span>
          <span className="flex items-center gap-1">🔥 {streak} day streak</span>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min((userPoints % 100), 100)}%` }} /></div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`sidebar-link ${pathname === href || (href !== '/dashboard' && pathname.startsWith(href)) ? 'active' : ''}`}>
            <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        <Link href="/settings" className={`sidebar-link ${pathname === '/settings' ? 'active' : ''}`}>
          <Settings style={{ width: '18px', height: '18px' }} />
          Settings
        </Link>
        <button onClick={handleLogout} className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut style={{ width: '18px', height: '18px' }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
