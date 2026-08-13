'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/auth/AuthShell';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { router.replace('/dashboard'); return; }
      setCheckingSession(false);
    });
  }, [supabase, router]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter your name to continue'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { full_name: name.trim() } } });
    if (error) {
      setLoading(false);
      toast.error(
        error.message.toLowerCase().includes('disabled')
          ? 'Anonymous sign-ins are disabled for this project — enable them in Supabase → Authentication → Sign In / Providers.'
          : error.message,
      );
      return;
    }
    if (data.user) {
      await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', data.user.id);
    }
    toast.success(`Welcome, ${name.trim()}! 👋`);
    setTimeout(() => { window.location.href = '/dashboard'; }, 400);
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthShell
      eyebrow="Get started"
      heading={<>Study smarter,<br />not harder.</>}
      tagline="AI-powered notes, plans, and instant explanations — all from your syllabus."
      bullets={[
        { icon: '✨', text: 'Ask AI explains any topic, formula or diagram' },
        { icon: '📅', text: 'Personalized day-by-day study schedule' },
        { icon: '📈', text: 'Track time and progress visually' },
      ]}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">What&apos;s your name? 👋</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No email, no password — just jump in.</p>
      </div>

      <form onSubmit={handleContinue} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Johnson"
            autoFocus
            required
            className="input"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting things up…</> : <>Start studying <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
        This creates a free account on this device — no signup form needed.
      </p>
    </AuthShell>
  );
}
