'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '');
        supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
          setName(data?.full_name ?? '');
        });
      }
    });
  }, [supabase]);

  async function saveProfile() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
      toast.success('Profile saved!');
    }
    setSaving(false);
  }

  const themes = [
    { value: 'light',  label: 'Light',  icon: Sun },
    { value: 'dark',   label: 'Dark',   icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="animate-in">
      <Header title="Settings" subtitle="Manage your account and preferences" />
      <div className="p-6 max-w-2xl space-y-6">

        <div className="card space-y-4">
          <h2 className="font-bold text-lg">Profile</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input value={email} disabled className="input opacity-60 cursor-not-allowed" />
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-70">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>

        {mounted && (
          <div className="card">
            <h2 className="font-bold text-lg mb-4">Appearance</h2>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setTheme(value)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`} style={{ borderColor: theme === value ? '#3b82f6' : 'var(--border)' }}>
                  <Icon className={`w-6 h-6 ${theme === value ? 'text-blue-600' : ''}`} style={theme === value ? {} : { color: 'var(--muted)' }} />
                  <span className={`text-sm font-medium ${theme === value ? 'text-blue-600' : ''}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="font-bold text-lg mb-4">Danger Zone</h2>
          <button
            onClick={async () => {
              if (!confirm('Sign out of StudyAI?')) return;
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="px-5 py-2.5 rounded-xl border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
