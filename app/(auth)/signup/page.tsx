'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
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
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white" style={{ background: 'linear-gradient(135deg,#1d4ed8,#7e22ce)' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">StudyAI</span>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold mb-4">Your AI study<br />partner awaits.</h2>
          <p className="text-blue-100 text-lg">Upload your syllabus and let AI do the heavy lifting.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[['340+','Students'],['98%','Satisfaction'],['4.2×','Grade lift'],['10min','Setup time']].map(([v,l]) => (
              <div key={l} className="bg-white/10 rounded-2xl p-4">
                <div className="text-3xl font-extrabold">{v}</div>
                <div className="text-blue-200 text-sm">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-200 text-sm">© 2026 StudyAI</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-in">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold mb-2">Create account</h1>
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
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-70">
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="mt-4 text-xs text-center" style={{ color: 'var(--muted)' }}>
            By signing up you agree to our <Link href="#" className="underline">Terms</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
          </p>
          <p className="mt-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
