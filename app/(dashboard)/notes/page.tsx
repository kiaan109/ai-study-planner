'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import NotesGenerator from '@/components/notes/NotesGenerator';
import FlashCardDeck from '@/components/notes/FlashCardDeck';
import { createClient } from '@/lib/supabase/client';
import { Note, Subject } from '@/types';
import { FileText, Plus, Trash2, Download, BookOpen, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const NOTE_TYPES = ['all','short','detailed','important','exam_questions','flashcards','custom'] as const;
const TYPE_LABELS: Record<string, string> = { all:'All', short:'Short Notes', detailed:'Detailed', important:'Key Points', exam_questions:'Exam Qs', flashcards:'Flashcards', custom:'Custom' };

function NotesPageInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);

  const subjectId = searchParams.get('subject');
  const chapterId = searchParams.get('chapter');

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: n }, { data: s }] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subjects').select('*, chapters(id, name)').eq('user_id', user.id),
    ]);
    setNotes((n ?? []) as Note[]);
    setSubjects((s ?? []) as any);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function deleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    toast.success('Note deleted');
  }

  async function exportPDF(note: Note) {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(note.title, 14, 20);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(note.content, 180);
    doc.text(lines, 14, 35);
    doc.save(`${note.title}.pdf`);
    toast.success('PDF exported!');
  }

  const filtered = notes.filter(n => {
    if (filter !== 'all' && n.type !== filter) return false;
    if (subjectId && n.subject_id !== subjectId) return false;
    return true;
  });

  return (
    <div className="animate-in h-full flex flex-col">
      <Header title="Notes" subtitle="AI-generated study notes and flashcards" />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r flex flex-col overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setShowGenerator(true)} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              <Zap className="w-4 h-4" /> Generate Notes
            </button>
          </div>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_TYPES.map(t => (
                <button key={t} onClick={() => setFilter(t)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filter === t ? 'text-white' : ''}`} style={filter === t ? { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' } : { background: 'var(--bg)', color: 'var(--muted)' }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? [1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />) :
             filtered.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No notes yet</p>
              </div>
            ) : filtered.map(note => (
              <button key={note.id} onClick={() => setSelectedNote(note)} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedNote?.id === note.id ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                <p className="font-medium text-sm truncate">{note.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{TYPE_LABELS[note.type]} · {new Date(note.created_at).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showGenerator ? (
            <NotesGenerator subjects={subjects} defaultSubjectId={subjectId ?? undefined} defaultChapterId={chapterId ?? undefined} onCreated={(note) => { setNotes(prev => [note, ...prev]); setSelectedNote(note); setShowGenerator(false); }} onCancel={() => setShowGenerator(false)} />
          ) : selectedNote ? (
            <div className="max-w-3xl animate-in">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedNote.title}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{TYPE_LABELS[selectedNote.type]} · {new Date(selectedNote.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => exportPDF(selectedNote)} className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-sm">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  <button onClick={() => deleteNote(selectedNote.id)} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {selectedNote.type === 'flashcards' ? (
                <FlashCardDeck noteId={selectedNote.id} />
              ) : (
                <div className="card prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{selectedNote.content}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">Select a note to view</h3>
                <p className="mb-6" style={{ color: 'var(--muted)' }}>Or generate new AI-powered notes for any chapter</p>
                <button onClick={() => setShowGenerator(true)} className="btn-primary flex items-center gap-2 mx-auto">
                  <Zap className="w-4 h-4" /> Generate Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotesPage() {
  return <Suspense fallback={<div className="p-6 animate-pulse text-sm" style={{ color: 'var(--muted)' }}>Loading notes…</div>}><NotesPageInner /></Suspense>;
}
