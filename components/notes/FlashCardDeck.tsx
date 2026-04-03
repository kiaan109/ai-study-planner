'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight, RotateCcw, Check } from 'lucide-react';

export default function FlashCardDeck({ noteId }: { noteId: string }) {
  const supabase = createClient();
  const [cards, setCards] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('flashcards').select('*').eq('note_id', noteId).then(({ data }) => {
      setCards(data ?? []);
      setMastered((data ?? []).filter(c => c.is_mastered).map(c => c.id));
    });
  }, [noteId, supabase]);

  async function markMastered() {
    const card = cards[idx];
    await supabase.from('flashcards').update({ is_mastered: true }).eq('id', card.id);
    setMastered(prev => [...prev, card.id]);
    next();
  }

  function next() { setFlipped(false); setTimeout(() => setIdx(i => Math.min(i + 1, cards.length - 1)), 150); }
  function prev() { setFlipped(false); setTimeout(() => setIdx(i => Math.max(i - 1, 0)), 150); }
  function reset() { setIdx(0); setFlipped(false); }

  if (cards.length === 0) return <div className="card text-center py-10 text-sm" style={{ color: 'var(--muted)' }}>No flashcards found</div>;

  const card = cards[idx];
  const isMastered = mastered.includes(card.id);

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--muted)' }}>{idx + 1} / {cards.length}</span>
        <span className="text-sm font-medium text-green-600">{mastered.length} mastered</span>
      </div>

      {/* Flashcard */}
      <div
        className={`relative cursor-pointer transition-all duration-300 ${isMastered ? 'opacity-60' : ''}`}
        onClick={() => setFlipped(!flipped)}
        style={{ perspective: '1000px', height: '240px' }}
      >
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)', transition: 'transform 0.4s' }}>
          {/* Front */}
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 p-8 text-center" style={{ backfaceVisibility: 'hidden', background: 'var(--surface)', borderColor: 'rgba(59,130,246,0.3)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>Question</p>
              <p className="text-xl font-bold">{card.front}</p>
              <p className="text-xs mt-6" style={{ color: 'var(--muted)' }}>Tap to reveal answer</p>
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 p-8 text-center text-white" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderColor: 'transparent' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4 opacity-70">Answer</p>
              <p className="text-lg font-bold">{card.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <button onClick={prev} disabled={idx === 0} className="btn-secondary p-3 disabled:opacity-40"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-3">
          <button onClick={reset} className="btn-secondary p-3"><RotateCcw className="w-4 h-4" /></button>
          {!isMastered && (
            <button onClick={markMastered} className="btn-primary flex items-center gap-2 py-2.5 px-4">
              <Check className="w-4 h-4" /> Mastered
            </button>
          )}
        </div>
        <button onClick={next} disabled={idx === cards.length - 1} className="btn-secondary p-3 disabled:opacity-40"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {cards.map((c, i) => (
          <button key={c.id} onClick={() => { setIdx(i); setFlipped(false); }} className="w-2.5 h-2.5 rounded-full transition-all" style={{ background: mastered.includes(c.id) ? '#22c55e' : i === idx ? '#3b82f6' : 'var(--border)' }} />
        ))}
      </div>
    </div>
  );
}
