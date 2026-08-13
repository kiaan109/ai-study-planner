import { Sparkles, Lightbulb, Layers, BookOpenCheck } from 'lucide-react';
import FormulaBlock from './FormulaBlock';
import DiagramBlock from './DiagramBlock';
import MarkdownLite from './MarkdownLite';
import { ExplainResult } from '@/types';

export default function ResultCard({ result }: { result: ExplainResult }) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-extrabold mb-2">{result.title}</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{result.summary}</p>
      </div>

      <div className="card">
        <MarkdownLite content={result.explanation} />
      </div>

      {result.formulas.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold">Key formulas</h3>
          </div>
          <div className="space-y-4">
            {result.formulas.map((f, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg)' }}>
                <p className="font-semibold text-sm mb-1">{f.name}</p>
                <FormulaBlock latex={f.latex} />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{f.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.diagram && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold">{result.diagram.title || 'Diagram'}</h3>
          </div>
          <DiagramBlock code={result.diagram.mermaid} />
        </div>
      )}

      {result.examples.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpenCheck className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold">Worked examples</h3>
          </div>
          <div className="space-y-4">
            {result.examples.map((ex, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg)' }}>
                <p className="text-sm font-semibold mb-1">Q: {ex.problem}</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{ex.solution}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.keyTakeaways.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold">Key takeaways</h3>
          </div>
          <ul className="list-disc pl-5 space-y-1.5">
            {result.keyTakeaways.map((k, i) => <li key={i} className="text-sm">{k}</li>)}
          </ul>
        </div>
      )}

      {result.flashcards.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Quick flashcards</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {result.flashcards.map((f, i) => (
              <div key={i} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>{f.front}</p>
                <p className="text-sm">{f.back}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
