'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import SyllabusUpload from '@/components/subjects/SyllabusUpload';
import SubjectCard from '@/components/subjects/SubjectCard';
import { createClient } from '@/lib/supabase/client';
import { Subject } from '@/types';
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const fetchSubjects = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('subjects')
      .select('*, chapters(id, name, is_completed, order_index)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSubjects((data ?? []) as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  async function deleteSubject(id: string) {
    await supabase.from('subjects').delete().eq('id', id);
    setSubjects(prev => prev.filter(s => s.id !== id));
    toast.success('Subject deleted');
  }

  async function deleteAllSubjects() {
    if (!confirm('Delete ALL subjects? This cannot be undone.')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('subjects').delete().eq('user_id', user.id);
    setSubjects([]);
    toast.success('All subjects deleted');
  }

  return (
    <div className="animate-in">
      <Header title="Subjects" subtitle="Manage your subjects and chapters" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            {subjects.length > 0 && (
              <button onClick={deleteAllSubjects} className="btn-secondary flex items-center gap-2 text-red-500 hover:text-red-600">
                <Trash2 className="w-4 h-4" /> Delete All
              </button>
            )}
            <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload Syllabus
            </button>
          </div>
        </div>

        {showUpload && (
          <div className="mb-8">
            <SyllabusUpload onSuccess={() => { setShowUpload(false); fetchSubjects(); }} />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="card h-40 animate-pulse" style={{ background: 'var(--border)' }} />)}
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">No subjects yet</h3>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>Upload your syllabus to automatically create subjects and chapters</p>
            <button onClick={() => setShowUpload(true)} className="btn-primary">Upload Syllabus</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <SubjectCard key={subject.id} subject={subject} onDelete={deleteSubject} onClick={() => router.push(`/subjects/${subject.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
