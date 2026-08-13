'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/auth/AuthShell';
import toast from 'react-hot-toast';

export default function LoginPage() {
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
    setTimeout(() => { window.location.href = '/dashboard'; }, 500);
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      heading={<>Study smarter,<br />not harder.</>}
      tagline="AI-powered notes, plans, and instant explanations — all from your syllabus."
      bullets={[
        { icon: '✨', text: 'Ask AI explains any topic, formula or diagram' },
        { icon: '📅', text: 'Personalized day-by-day study schedule' },
        { icon: '📈', text: 'Track time and progress visually' },
      ]}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Welcome back 👋</h1>
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
          <Link href="/reset-password" className="text-sm font-medium" style={{ color: '#7c3aed' }}>Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
        No account?{' '}
        <Link href="/signup" className="font-semibold" style={{ color: '#7c3aed' }}>Create one free</Link>
      </p>
    </AuthShell>
  );
}
