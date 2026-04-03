'use client';
import { Bell, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface HeaderProps { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
          <input placeholder="Search notes, subjects…" className="input pl-9 w-56 py-2 text-xs" />
        </div>
        <button className="relative p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell className="w-5 h-5" style={{ color: 'var(--muted)' }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>
        {mounted && (
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" style={{ color: 'var(--muted)' }} />}
          </button>
        )}
      </div>
    </header>
  );
}
