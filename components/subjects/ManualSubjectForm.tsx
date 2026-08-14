'use client';
import { useState } from 'react';
import { BookMarked, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { randomColor, randomIcon } from '@/lib/utils';

export default function ManualSubjectForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function create() {
    if (!name.trim()) { toast.error('Give your subject a name'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('subjects').insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        color: randomColor(),
        icon: randomIcon(),
      });
      if (error) throw error;
      toast.success(`${name.trim()} created!`);
      setName('');
      setDescription('');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not create subject');
    }
    setSaving(false);
  }

  return (
    <div className="card animate-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-blue-500" />
          <h3 className="text-xl font-bold">New subject</h3>
        </div>
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <X className="w-5 h-5" style={{ color: 'var(--muted)' }} />
        </button>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>No syllabus needed — just name it and start adding chapters yourself.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Subject name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Organic Chemistry"
            className="input"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this subject about?"
            className="input min-h-[80px] resize-y"
          />
        </div>
        <button onClick={create} disabled={saving || !name.trim()} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-70">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create subject'}
        </button>
      </div>
    </div>
  );
}
