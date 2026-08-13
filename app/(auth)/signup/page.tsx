'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/auth/AuthShell';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Account created! Welcome 🎉');
    setTimeout(() => { window.location.href = '/dashboard'; }, 500);
  }

  return (
    <AuthShell
      eyebrow="Get started free"
      heading={<>Your AI study<br />partner awaits.</>}
      tagline="Upload a syllabus, snap a textbook page, or ask a question — AI does the rest."
      bullets={[
        { icon: '🧠', text: 'Full explanations with formulas & diagrams' },
        { icon: '🎧', text: 'Turn audio recordings into notes' },
        { icon: '🏆', text: 'Points, streaks & achievements' },
      ]}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Create account 🚀</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Free forever · No credit card needed</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Full name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Johnson" required className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} className="input pr-11" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? 'Creating account…' : <>Create free account <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="mt-4 text-xs text-center" style={{ color: 'var(--muted)' }}>
        By signing up you agree to our <Link href="#" className="underline">Terms</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
      </p>
      <p className="mt-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-semibold" style={{ color: '#7c3aed' }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
