'use client';
import { Subject } from '@/types';
import { CheckCircle, ChevronRight, Trash2 } from 'lucide-react';

interface Props { subject: Subject; onClick: () => void; onDelete: (id: string) => void; }

export default function SubjectCard({ subject, onClick, onDelete }: Props) {
  const chapters = (subject as any).chapters ?? [];
  const total = chapters.length;
  const done  = chapters.filter((c: any) => c?.is_completed).length;
  const pct   = total > 0 ? Math.round(done / total * 100) : 0;

  return (
    <div className="card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group relative" onClick={onClick}>
      <button
        onClick={e => { e.stopPropagation(); if (confirm('Delete this subject?')) onDelete(subject.id); }}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${subject.color}22` }}>
          {subject.icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-lg leading-tight">{subject.name}</h3>
          {subject.description && (
            <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{subject.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{total} chapters</span>
          <span className="text-sm font-bold gradient-text">{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
          <span>{done} completed</span>
          <span>{total - done} remaining</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1">
          {done > 0 && <CheckCircle className="w-4 h-4 text-green-500" />}
          <span className="text-xs font-medium" style={{ color: done > 0 ? '#22c55e' : 'var(--muted)' }}>
            {done > 0 ? 'In progress' : 'Not started'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
          Open <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
