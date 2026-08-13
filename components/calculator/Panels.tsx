'use client';
import { useMemo, useState } from 'react';
import { Play, Plus } from 'lucide-react';
import { evaluateExpression } from '@/lib/calculator/evaluate';
import { SCIENCE_CONSTANTS } from '@/lib/calculator/constants';

const panelInput = 'w-full rounded-lg border border-[#3a3d45] bg-[#0f1116] px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#3b82f6]';
const panelLabel = 'block text-xs font-medium text-gray-400 mb-1';
const panelBtn = 'flex items-center justify-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb] transition-colors';

// ── Table mode: sweep f(x) over a range ──────────────────────────────────
export function TablePanel() {
  const [fx, setFx] = useState('x^2 - 2x + 1');
  const [start, setStart] = useState('-5');
  const [end, setEnd] = useState('5');
  const [step, setStep] = useState('1');
  const [error, setError] = useState('');
  const [rows, setRows] = useState<{ x: number; y: string }[]>([]);

  function generate() {
    setError('');
    const a = parseFloat(start), b = parseFloat(end), s = parseFloat(step);
    if (!isFinite(a) || !isFinite(b) || !isFinite(s) || s <= 0 || b < a) {
      setError('Check your start / end / step values (step must be > 0, end ≥ start)');
      return;
    }
    const count = Math.floor((b - a) / s) + 1;
    if (count > 200) { setError('Too many rows — narrow the range or increase the step'); return; }
    try {
      const out: { x: number; y: string }[] = [];
      for (let i = 0; i < count; i++) {
        const x = a + i * s;
        const { display } = evaluateExpression(fx, { angleMode: 'deg', ans: 0, memory: 0, x });
        out.push({ x, y: display });
      }
      setRows(out);
    } catch {
      setError('Could not evaluate f(x) — check the expression');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={panelLabel}>f(x) =</label>
        <input value={fx} onChange={(e) => setFx(e.target.value)} className={`${panelInput} font-mono`} placeholder="e.g. x^2 - 2x + 1" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className={panelLabel}>Start</label><input value={start} onChange={(e) => setStart(e.target.value)} className={panelInput} /></div>
        <div><label className={panelLabel}>End</label><input value={end} onChange={(e) => setEnd(e.target.value)} className={panelInput} /></div>
        <div><label className={panelLabel}>Step</label><input value={step} onChange={(e) => setStep(e.target.value)} className={panelInput} /></div>
      </div>
      <button onClick={generate} className={panelBtn}><Play className="w-3.5 h-3.5" /> Generate table</button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {rows.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-[#3a3d45]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#20232b] text-gray-400">
              <tr><th className="text-left px-3 py-1.5 font-medium">x</th><th className="text-left px-3 py-1.5 font-medium">f(x)</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="odd:bg-[#181a20] even:bg-[#15171d] text-gray-200">
                  <td className="px-3 py-1 font-mono">{r.x}</td>
                  <td className="px-3 py-1 font-mono">{r.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Equation mode: quadratic + 2-variable linear system ─────────────────
export function EquationPanel() {
  const [tab, setTab] = useState<'quadratic' | 'linear'>('quadratic');
  const [a, setA] = useState('1'); const [b, setB] = useState('-3'); const [c, setC] = useState('2');
  const [a1, setA1] = useState('2'); const [b1, setB1] = useState('1'); const [c1, setC1] = useState('5');
  const [a2, setA2] = useState('1'); const [b2, setB2] = useState('-1'); const [c2, setC2] = useState('1');

  const quadResult = useMemo(() => {
    const A = parseFloat(a), B = parseFloat(b), C = parseFloat(c);
    if (!isFinite(A) || !isFinite(B) || !isFinite(C) || A === 0) return null;
    const disc = B * B - 4 * A * C;
    if (disc > 0) {
      const r1 = (-B + Math.sqrt(disc)) / (2 * A);
      const r2 = (-B - Math.sqrt(disc)) / (2 * A);
      return { text: `x₁ = ${r1.toFixed(6)}   x₂ = ${r2.toFixed(6)}` };
    }
    if (disc === 0) return { text: `x = ${(-B / (2 * A)).toFixed(6)} (double root)` };
    const re = (-B / (2 * A)).toFixed(6);
    const im = (Math.sqrt(-disc) / (2 * A)).toFixed(6);
    return { text: `x₁ = ${re} + ${im}i   x₂ = ${re} − ${im}i` };
  }, [a, b, c]);

  const linResult = useMemo(() => {
    const A1 = parseFloat(a1), B1 = parseFloat(b1), C1 = parseFloat(c1);
    const A2 = parseFloat(a2), B2 = parseFloat(b2), C2 = parseFloat(c2);
    if (![A1, B1, C1, A2, B2, C2].every(isFinite)) return null;
    const det = A1 * B2 - A2 * B1;
    if (det === 0) return { text: 'No unique solution (lines are parallel or identical)' };
    const x = (C1 * B2 - C2 * B1) / det;
    const y = (A1 * C2 - A2 * C1) / det;
    return { text: `x = ${x.toFixed(6)}   y = ${y.toFixed(6)}` };
  }, [a1, b1, c1, a2, b2, c2]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-lg bg-[#0f1116]">
        {(['quadratic', 'linear'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${tab === t ? 'bg-[#3b82f6] text-white' : 'text-gray-400'}`}>
            {t === 'quadratic' ? 'Quadratic' : 'Linear system'}
          </button>
        ))}
      </div>

      {tab === 'quadratic' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-mono">ax² + bx + c = 0</p>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={panelLabel}>a</label><input value={a} onChange={(e) => setA(e.target.value)} className={panelInput} /></div>
            <div><label className={panelLabel}>b</label><input value={b} onChange={(e) => setB(e.target.value)} className={panelInput} /></div>
            <div><label className={panelLabel}>c</label><input value={c} onChange={(e) => setC(e.target.value)} className={panelInput} /></div>
          </div>
          <div className="rounded-lg border border-[#3a3d45] bg-[#0f1116] px-3 py-2.5 text-sm font-mono text-green-400 min-h-[2.5rem] flex items-center">
            {quadResult ? quadResult.text : 'a cannot be 0'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-mono">a₁x + b₁y = c₁ , a₂x + b₂y = c₂</p>
          <div className="grid grid-cols-3 gap-2">
            <input value={a1} onChange={(e) => setA1(e.target.value)} className={panelInput} placeholder="a₁" />
            <input value={b1} onChange={(e) => setB1(e.target.value)} className={panelInput} placeholder="b₁" />
            <input value={c1} onChange={(e) => setC1(e.target.value)} className={panelInput} placeholder="c₁" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input value={a2} onChange={(e) => setA2(e.target.value)} className={panelInput} placeholder="a₂" />
            <input value={b2} onChange={(e) => setB2(e.target.value)} className={panelInput} placeholder="b₂" />
            <input value={c2} onChange={(e) => setC2(e.target.value)} className={panelInput} placeholder="c₂" />
          </div>
          <div className="rounded-lg border border-[#3a3d45] bg-[#0f1116] px-3 py-2.5 text-sm font-mono text-green-400 min-h-[2.5rem] flex items-center">
            {linResult ? linResult.text : 'Enter all six coefficients'}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Constants mode: reference sheet that inserts into the main calc ─────
export function ConstantsPanel({ onInsert }: { onInsert: (value: number) => void }) {
  return (
    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
      {SCIENCE_CONSTANTS.map((c) => (
        <button
          key={c.symbol}
          onClick={() => onInsert(c.value)}
          className="w-full flex items-center justify-between gap-2 rounded-lg border border-[#3a3d45] bg-[#0f1116] px-3 py-2 text-left hover:border-[#3b82f6] transition-colors"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-100">{c.symbol} <span className="font-normal text-gray-400">— {c.name}</span></p>
            <p className="text-xs font-mono text-gray-500 truncate">{c.value.toExponential(6)} {c.unit}</p>
          </div>
          <Plus className="w-4 h-4 text-blue-400 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ── Base-N mode: decimal/binary/octal/hex converter ──────────────────────
const BASE_CHARS: Record<number, RegExp> = { 2: /^[01]*$/, 8: /^[0-7]*$/, 10: /^[0-9]*$/, 16: /^[0-9a-fA-F]*$/ };

export function BaseNPanel() {
  const [value, setValue] = useState('42');
  const [base, setBase] = useState(10);

  const isValid = !value || BASE_CHARS[base].test(value);
  const error = isValid ? '' : `Invalid digit for base ${base}`;
  const dec = useMemo(() => {
    if (!value || !isValid) return value ? null : 0;
    const n = parseInt(value, base);
    return isFinite(n) ? n : null;
  }, [value, base, isValid]);

  const rows: { label: string; base: number }[] = [
    { label: 'DEC', base: 10 },
    { label: 'BIN', base: 2 },
    { label: 'OCT', base: 8 },
    { label: 'HEX', base: 16 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${panelInput} font-mono flex-1`}
          placeholder="Enter a value…"
        />
        <select value={base} onChange={(e) => setBase(Number(e.target.value))} className={`${panelInput} w-24`}>
          <option value={10}>Base 10</option>
          <option value={2}>Base 2</option>
          <option value={8}>Base 8</option>
          <option value={16}>Base 16</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 rounded-lg border border-[#3a3d45] bg-[#0f1116] px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 w-10 flex-shrink-0">{r.label}</span>
            <span className="text-sm font-mono text-green-400 truncate">{dec === null ? '—' : dec.toString(r.base).toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
