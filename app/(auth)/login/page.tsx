'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Welcome back!');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white" style={{ background: 'linear-gradient(135deg,#1d4ed8,#7e22ce)' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">StudyAI</span>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold mb-4">Study smarter,<br />not harder.</h2>
          <p className="text-blue-100 text-lg">AI-powered notes, plans, and progress tracking — all from your syllabus.</p>
          <div className="mt-10 space-y-4">
            {['AI generates notes for every chapter', 'Personalized day-by-day study schedule', 'Track time and progress visually'].map(t => (
              <div key={t} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                {t}
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-200 text-sm">© 2026 StudyAI</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-in">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-300">Supabase not configured</p>
                <p className="text-xs mt-1 text-yellow-700 dark:text-yellow-400">
                  Add your Supabase URL and keys to <code className="font-mono">.env.local</code> to enable login.{' '}
                  <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline">Create a free project →</a>
                </p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold mb-2">Welcome back</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Sign in to continue studying</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="input pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/reset-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-70">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
            No account?{' '}
            <Link href="/signup" className="text-blue-600 font-semibold hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
