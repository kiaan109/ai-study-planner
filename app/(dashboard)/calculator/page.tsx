'use client';
import { useMemo, useState } from 'react';
import {
  Settings, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Calculator as CalculatorIcon, Table, Sigma, Atom, Binary,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { TablePanel, EquationPanel, ConstantsPanel, BaseNPanel } from '@/components/calculator/Panels';
import { evaluateExpression, toFraction, AngleMode } from '@/lib/calculator/evaluate';
import { SCIENCE_CONSTANTS } from '@/lib/calculator/constants';
import { cn } from '@/lib/utils';

type Mode = 'calc' | 'table' | 'equation' | 'constants' | 'basen';
type DecimalPlaces = 'float' | 2 | 4 | 6;

const MODE_TABS: { id: Mode; label: string; icon: typeof CalculatorIcon }[] = [
  { id: 'calc', label: 'Calc', icon: CalculatorIcon },
  { id: 'table', label: 'Table', icon: Table },
  { id: 'equation', label: 'Eqn', icon: Sigma },
  { id: 'constants', label: 'Const', icon: Atom },
  { id: 'basen', label: 'Base-N', icon: Binary },
];

/** Expands a JS number to a plain decimal string (no exponential notation) so it can be re-inserted into the expression. */
function numberToInsertableString(n: number): string {
  if (!isFinite(n) || n === 0) return '0';
  const exp = n.toExponential(15);
  const m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(exp);
  if (!m) return n.toString();
  const [, sign, intPart, fracPart = '', expStr] = m;
  const e = parseInt(expStr, 10);
  const digits = intPart + fracPart;
  let result: string;
  if (e >= 0) {
    result = e + 1 >= digits.length ? digits + '0'.repeat(e + 1 - digits.length) : `${digits.slice(0, e + 1)}.${digits.slice(e + 1)}`;
  } else {
    result = `0.${'0'.repeat(-e - 1)}${digits}`;
  }
  return sign + result;
}

const OPERATOR_TEXTS = new Set(['+', '-', '×', '÷', '^', '!', '%', '^2', '^3', '^(-1)', ' nPr ', ' nCr ', '×10^(']);

function DPad({ onUp, onDown, onLeft, onRight }: { onUp: () => void; onDown: () => void; onLeft: () => void; onRight: () => void }) {
  const arrow = 'rounded-lg bg-[#2a2d35] hover:bg-[#383c46] active:scale-95 flex items-center justify-center transition-all';
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-24 h-24 flex-shrink-0">
      <div /><button onClick={onUp} className={arrow}><ChevronUp className="w-4 h-4 text-gray-300" /></button><div />
      <button onClick={onLeft} className={arrow}><ChevronLeft className="w-4 h-4 text-gray-300" /></button>
      <div className="rounded-full bg-[#15171c] border border-[#3a3d45]" />
      <button onClick={onRight} className={arrow}><ChevronRight className="w-4 h-4 text-gray-300" /></button>
      <div /><button onClick={onDown} className={arrow}><ChevronDown className="w-4 h-4 text-gray-300" /></button><div />
    </div>
  );
}

function Key({ label, sub, onClick, tone = 'default' }: { label: React.ReactNode; sub?: string; onClick: () => void; tone?: 'default' | 'accent' | 'op' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl h-11 text-[13px] font-semibold active:scale-95 transition-all',
        tone === 'accent' && 'bg-[#3b82f6] text-white hover:bg-[#2563eb]',
        tone === 'op' && 'bg-[#32353e] text-gray-100 hover:bg-[#3a3d47]',
        tone === 'default' && 'bg-[#22242b] text-gray-200 hover:bg-[#2a2d35]',
      )}
    >
      {sub && <span className="absolute top-0.5 text-[8.5px] leading-none text-amber-400">{sub}</span>}
      <span className={sub ? 'mt-2.5' : ''}>{label}</span>
    </button>
  );
}

export default function CalculatorPage() {
  const [mode, setMode] = useState<Mode>('calc');
  const [expr, setExpr] = useState('');
  const [cursor, setCursor] = useState(0);
  const [ans, setAns] = useState(0);
  const [memory, setMemory] = useState(0);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [decimalPlaces, setDecimalPlaces] = useState<DecimalPlaces>('float');
  const [shiftActive, setShiftActive] = useState(false);
  const [optnActive, setOptnActive] = useState(false);
  const [hypActive, setHypActive] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [showFraction, setShowFraction] = useState(false);
  const [resultDisplay, setResultDisplay] = useState<string | null>(null);
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  function insert(text: string) {
    const continuation = OPERATOR_TEXTS.has(text);
    let base = expr, pos = cursor;
    if (justEvaluated) {
      if (continuation) { base = 'Ans'; pos = 3; } else { base = ''; pos = 0; }
      setJustEvaluated(false);
    }
    setExpr(base.slice(0, pos) + text + base.slice(pos));
    setCursor(pos + text.length);
  }

  function press(fn: () => void) {
    fn();
    setShiftActive(false);
    setOptnActive(false);
  }

  function pressDigit(d: string) {
    if (optnActive && d !== '0') {
      const c = SCIENCE_CONSTANTS[parseInt(d, 10) - 1];
      if (c) { insert(numberToInsertableString(c.value)); return; }
    }
    insert(d);
  }
  function pressTrig(base: 'sin' | 'cos' | 'tan') {
    let name: string = base;
    if (shiftActive && hypActive) name = `a${base}h`;
    else if (shiftActive) name = `a${base}`;
    else if (hypActive) name = `${base}h`;
    insert(`${name}(`);
  }

  function computeAndReturn(source?: string): number | null {
    const text = source ?? expr;
    if (!text.trim()) return null;
    try {
      const ctx = { angleMode, ans, memory };
      const result = evaluateExpression(text, ctx);
      setAns(result.value);
      setResultDisplay(result.display);
      setExpr(text);
      setCursor(text.length);
      setHistory((h) => [...h.slice(-49), { expr: text, result: result.display }]);
      setHistoryIndex(null);
      setJustEvaluated(true);
      setShowFraction(false);
      return result.value;
    } catch {
      setResultDisplay('Math Error');
      setJustEvaluated(true);
      return null;
    }
  }

  function pressDel() {
    if (cursor === 0) return;
    setExpr(expr.slice(0, cursor - 1) + expr.slice(cursor));
    setCursor(cursor - 1);
    setJustEvaluated(false);
  }
  function pressAC() {
    setExpr(''); setCursor(0); setResultDisplay(null); setJustEvaluated(false); setShowFraction(false);
  }
  function moveCursor(delta: number) {
    setCursor((c) => Math.max(0, Math.min(expr.length, c + delta)));
  }
  function historyNav(dir: -1 | 1) {
    if (history.length === 0) return;
    const newIdx = historyIndex === null ? history.length - 1 : Math.max(0, Math.min(history.length - 1, historyIndex + dir));
    const entry = history[newIdx];
    setHistoryIndex(newIdx);
    setExpr(entry.expr);
    setCursor(entry.expr.length);
    setResultDisplay(entry.result);
    setJustEvaluated(true);
  }

  const fractionText = useMemo(() => {
    if (!showFraction || resultDisplay === null) return null;
    const frac = toFraction(ans);
    if (!frac) return null;
    const [num, den] = frac;
    return den === 1 ? `${num}` : `${num}/${den}`;
  }, [showFraction, ans, resultDisplay]);
  const shownResult = fractionText ?? resultDisplay;

  const beforeCursor = expr.slice(0, cursor);
  const afterCursor = expr.slice(cursor);

  return (
    <div className="animate-in h-full flex flex-col">
      <Header title="Calculator" subtitle="Full scientific calculator — trig, logs, powers, memory, tables, equations & more" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-sm mx-auto">
          <div className="rounded-[28px] p-4 shadow-2xl" style={{ background: 'linear-gradient(160deg,#1c1e24,#111318)' }}>
            <div className="flex items-center justify-between px-1 pb-2">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500">SCIENTIFIC</p>
                <p className="text-xs font-semibold text-gray-300">ClassCalc fx-100CW</p>
              </div>
              <button
                onClick={() => setDecimalPlaces((d) => (d === 'float' ? 2 : d === 2 ? 4 : d === 4 ? 6 : 'float'))}
                className="p-2 rounded-lg bg-[#22242b] hover:bg-[#2a2d35] transition-colors"
                title={`Decimal places: ${decimalPlaces === 'float' ? 'auto' : decimalPlaces}`}
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Display */}
            <div className="rounded-2xl p-3 mb-3" style={{ background: '#dbe4d4' }}>
              <div className="flex gap-1 mb-2">
                {MODE_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMode(t.id)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-0.5 py-1 rounded-md text-[8.5px] font-bold transition-colors',
                      mode === t.id ? 'bg-[#2f5233] text-white' : 'text-[#4a5544]',
                    )}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {mode === 'calc' ? (
                <>
                  <div className="flex items-center gap-2 mb-1 h-3">
                    {shiftActive && <span className="text-[9px] font-bold text-amber-700">SHIFT</span>}
                    {optnActive && <span className="text-[9px] font-bold text-blue-700">OPTN</span>}
                    {hypActive && <span className="text-[9px] font-bold text-purple-700">HYP</span>}
                    <span className="text-[9px] font-bold text-[#4a5544] ml-auto uppercase">{angleMode}</span>
                    {memory !== 0 && <span className="text-[9px] font-bold text-[#2f5233]">M</span>}
                  </div>
                  <div className="min-h-[2.25rem] text-right font-mono text-lg text-[#1c2b18] break-all leading-tight">
                    {expr === '' ? (
                      <span className="opacity-40">0</span>
                    ) : (
                      <>
                        {beforeCursor}
                        <span className="inline-block w-[2px] h-[1.1em] bg-[#1c2b18] align-middle animate-pulse" />
                        {afterCursor}
                      </>
                    )}
                  </div>
                  <div className="text-right font-mono text-2xl font-bold text-[#16330f] min-h-[2rem] truncate">
                    {decimalPlaces !== 'float' && resultDisplay && !fractionText && !isNaN(Number(resultDisplay))
                      ? Number(resultDisplay).toFixed(decimalPlaces)
                      : shownResult ?? ''}
                  </div>
                </>
              ) : (
                <div className="py-2 text-center text-xs font-semibold text-[#4a5544]">
                  {MODE_TABS.find((t) => t.id === mode)?.label} mode
                </div>
              )}
            </div>

            {mode === 'calc' ? (
              <>
                {/* Control cluster */}
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setShiftActive((v) => !v)}
                      className={cn('w-11 h-9 rounded-lg text-[11px] font-bold transition-colors', shiftActive ? 'bg-amber-400 text-black' : 'bg-[#22242b] text-amber-400 hover:bg-[#2a2d35]')}
                    >SHIFT</button>
                    <button
                      onClick={() => setOptnActive((v) => !v)}
                      className={cn('w-11 h-9 rounded-lg text-[11px] font-bold transition-colors', optnActive ? 'bg-blue-400 text-black' : 'bg-[#22242b] text-blue-400 hover:bg-[#2a2d35]')}
                    >OPTN</button>
                  </div>
                  <DPad onUp={() => historyNav(-1)} onDown={() => historyNav(1)} onLeft={() => moveCursor(-1)} onRight={() => moveCursor(1)} />
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => press(pressDel)} className="w-11 h-9 rounded-lg text-[11px] font-bold bg-amber-600 text-white hover:bg-amber-500 transition-colors">DEL</button>
                    <button onClick={() => press(pressAC)} className="w-11 h-9 rounded-lg text-[11px] font-bold bg-red-600 text-white hover:bg-red-500 transition-colors">AC</button>
                  </div>
                </div>

                {/* Scientific + numeric grid */}
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  <Key label="sin" sub={hypActive ? (shiftActive ? 'asinh' : 'sinh') : shiftActive ? 'sin⁻¹' : undefined} onClick={() => press(() => pressTrig('sin'))} />
                  <Key label="cos" sub={hypActive ? (shiftActive ? 'acosh' : 'cosh') : shiftActive ? 'cos⁻¹' : undefined} onClick={() => press(() => pressTrig('cos'))} />
                  <Key label="tan" sub={hypActive ? (shiftActive ? 'atanh' : 'tanh') : shiftActive ? 'tan⁻¹' : undefined} onClick={() => press(() => pressTrig('tan'))} />
                  <Key label="hyp" onClick={() => press(() => setHypActive((v) => !v))} tone={hypActive ? 'accent' : 'default'} />
                  <Key label="xʸ" sub="ʸ√x" onClick={() => press(() => insert(shiftActive ? 'yroot(' : '^'))} />

                  <Key label="log" sub="10ˣ" onClick={() => press(() => insert(shiftActive ? '10^(' : 'log('))} />
                  <Key label="ln" sub="eˣ" onClick={() => press(() => insert(shiftActive ? 'e^(' : 'ln('))} />
                  <Key label="√" sub="x²" onClick={() => press(() => insert(shiftActive ? '^2' : '√('))} />
                  <Key label="∛" sub="x³" onClick={() => press(() => insert(shiftActive ? '^3' : '∛('))} />
                  <Key label="x⁻¹" sub="x!" onClick={() => press(() => insert(shiftActive ? '!' : '^(-1)'))} />

                  <Key label="STO" sub="Pol(" onClick={() => press(() => { if (shiftActive) insert('Pol('); else { const v = computeAndReturn(); if (v !== null) setMemory(v); } })} />
                  <Key label="RCL" sub="Rec(" onClick={() => press(() => insert(shiftActive ? 'Rec(' : 'M'))} />
                  <Key label="π" onClick={() => press(() => insert('π'))} />
                  <Key label="e" onClick={() => press(() => insert('e'))} />
                  <Key label="Ans" onClick={() => press(() => insert('Ans'))} />

                  <Key label="M+" sub="M−" onClick={() => press(() => { const v = computeAndReturn(); if (v !== null) setMemory((m) => m + (shiftActive ? -1 : 1) * v); })} />
                  <Key label="S⇔D" onClick={() => press(() => setShowFraction((v) => !v))} />
                  <Key label="DRG▷" onClick={() => press(() => setAngleMode((m) => (m === 'deg' ? 'rad' : m === 'rad' ? 'grad' : 'deg')))} />
                  <Key label="Abs" onClick={() => press(() => insert('Abs('))} />
                  <Key label="%" onClick={() => press(() => insert('%'))} />

                  <Key label="(-)" onClick={() => press(() => insert('-'))} />
                  <Key label="," onClick={() => press(() => insert(','))} />
                  <Key label="×10ˣ" onClick={() => press(() => insert('×10^('))} />
                  <Key label="(" sub="nPr" onClick={() => press(() => insert(shiftActive ? ' nPr ' : '('))} />
                  <Key label=")" sub="nCr" onClick={() => press(() => insert(shiftActive ? ' nCr ' : ')'))} />

                  <Key label="7" onClick={() => press(() => pressDigit('7'))} />
                  <Key label="8" onClick={() => press(() => pressDigit('8'))} />
                  <Key label="9" onClick={() => press(() => pressDigit('9'))} />
                  <Key label="×" onClick={() => press(() => insert('×'))} tone="op" />
                  <Key label="÷" onClick={() => press(() => insert('÷'))} tone="op" />

                  <Key label="4" onClick={() => press(() => pressDigit('4'))} />
                  <Key label="5" onClick={() => press(() => pressDigit('5'))} />
                  <Key label="6" onClick={() => press(() => pressDigit('6'))} />
                  <Key label="+" onClick={() => press(() => insert('+'))} tone="op" />
                  <Key label="−" onClick={() => press(() => insert('-'))} tone="op" />

                  <Key label="1" onClick={() => press(() => pressDigit('1'))} />
                  <Key label="2" onClick={() => press(() => pressDigit('2'))} />
                  <Key label="3" onClick={() => press(() => pressDigit('3'))} />
                  <Key label="^" onClick={() => press(() => insert('^'))} tone="op" />
                  <Key label="!" onClick={() => press(() => insert('!'))} tone="op" />

                  <button onClick={() => press(() => pressDigit('0'))} className="col-span-2 flex items-center justify-center rounded-xl h-11 text-[13px] font-semibold bg-[#22242b] text-gray-200 hover:bg-[#2a2d35] active:scale-95 transition-all">0</button>
                  <Key label="." onClick={() => press(() => insert('.'))} />
                  <Key label="00" onClick={() => press(() => insert('00'))} />
                  <button onClick={() => press(computeAndReturn as () => void)} className="rounded-xl h-11 text-sm font-bold bg-[#3b82f6] text-white hover:bg-[#2563eb] active:scale-95 transition-all">EXE</button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-[#181a20] p-4">
                {mode === 'table' && <TablePanel />}
                {mode === 'equation' && <EquationPanel />}
                {mode === 'constants' && (
                  <ConstantsPanel onInsert={(v) => { insert(numberToInsertableString(v)); setMode('calc'); }} />
                )}
                {mode === 'basen' && <BaseNPanel />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
