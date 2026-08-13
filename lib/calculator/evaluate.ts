export type AngleMode = 'deg' | 'rad' | 'grad';

export interface EvalContext {
  angleMode: AngleMode;
  ans: number;
  memory: number;
  /** Bound value for the 'x' variable — used by Table mode to sweep f(x). */
  x?: number;
}

export interface EvalResult {
  value: number;
  /** Human-readable result — usually just the formatted number, but Pol()/Rec() show two values. */
  display: string;
}

type TokenType = 'NUM' | 'IDENT' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA';
interface Token { type: TokenType; value: string }

function normalize(s: string): string {
  return s.replace(/×/g, '*').replace(/÷/g, '/');
}

function autoCloseParens(s: string): string {
  let depth = 0;
  for (const c of s) {
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
  }
  return s + ')'.repeat(depth);
}

function tokenize(s: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({ type: 'NUM', value: s.slice(i, j) });
      i = j;
      continue;
    }
    if (c === 'π' || c === '√' || c === '∛') {
      tokens.push({ type: 'IDENT', value: c });
      i++;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z]/.test(s[j])) j++;
      tokens.push({ type: 'IDENT', value: s.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '(') { tokens.push({ type: 'LPAREN', value: c }); i++; continue; }
    if (c === ')') { tokens.push({ type: 'RPAREN', value: c }); i++; continue; }
    if (c === ',') { tokens.push({ type: 'COMMA', value: c }); i++; continue; }
    if ('+-*/^!%'.includes(c)) { tokens.push({ type: 'OP', value: c }); i++; continue; }
    i++; // skip unknown chars
  }
  return tokens;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function permutations(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || r < 0 || r > n || n < 0) return NaN;
  let result = 1;
  for (let i = 0; i < r; i++) result *= n - i;
  return result;
}
function combinations(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || r < 0 || r > n || n < 0) return NaN;
  r = Math.min(r, n - r);
  let result = 1;
  for (let i = 0; i < r; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

function applyFunction(name: string, args: number[], angleMode: AngleMode): number {
  const toRad = (x: number) => (angleMode === 'deg' ? (x * Math.PI) / 180 : angleMode === 'grad' ? (x * Math.PI) / 200 : x);
  const fromRad = (x: number) => (angleMode === 'deg' ? (x * 180) / Math.PI : angleMode === 'grad' ? (x * 200) / Math.PI : x);
  const a = args[0];
  switch (name) {
    case 'sin': return Math.sin(toRad(a));
    case 'cos': return Math.cos(toRad(a));
    case 'tan': return Math.tan(toRad(a));
    case 'asin': return fromRad(Math.asin(a));
    case 'acos': return fromRad(Math.acos(a));
    case 'atan': return fromRad(Math.atan(a));
    case 'sinh': return Math.sinh(a);
    case 'cosh': return Math.cosh(a);
    case 'tanh': return Math.tanh(a);
    case 'asinh': return Math.asinh(a);
    case 'acosh': return Math.acosh(a);
    case 'atanh': return Math.atanh(a);
    case 'log': return Math.log10(a);
    case 'ln': return Math.log(a);
    case '√': return Math.sqrt(a);
    case '∛': return Math.cbrt(a);
    case 'Abs': return Math.abs(a);
    case 'yroot': return Math.pow(args[1], 1 / args[0]);
    case 'Pol': return Math.hypot(args[0], args[1]);
    case 'Rec': return args[0] * Math.cos(toRad(args[1]));
    default: throw new Error(`Unknown function: ${name}`);
  }
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[], private ctx: EvalContext) {}

  private peek() { return this.tokens[this.pos]; }
  private next() { return this.tokens[this.pos++]; }
  private expect(type: TokenType) {
    if (!this.peek() || this.peek().type !== type) throw new Error(`Expected ${type}`);
    this.next();
  }

  parse(): number {
    const v = this.parseExpression();
    if (this.pos !== this.tokens.length) throw new Error('Syntax error');
    return v;
  }

  private parseExpression(): number { return this.parseAddSub(); }

  private parseAddSub(): number {
    let val = this.parseMulDiv();
    while (this.peek() && this.peek().type === 'OP' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.next().value;
      const rhs = this.parseMulDiv();
      val = op === '+' ? val + rhs : val - rhs;
    }
    return val;
  }

  private parseMulDiv(): number {
    let val = this.parseImplicitMul();
    while (this.peek() && this.peek().type === 'OP' && (this.peek().value === '*' || this.peek().value === '/')) {
      const op = this.next().value;
      const rhs = this.parseImplicitMul();
      val = op === '*' ? val * rhs : val / rhs;
    }
    return val;
  }

  private startsValue(): boolean {
    const t = this.peek();
    if (!t) return false;
    if (t.type === 'NUM' || t.type === 'LPAREN') return true;
    if (t.type === 'IDENT' && t.value !== 'nPr' && t.value !== 'nCr') return true;
    return false;
  }

  private parseImplicitMul(): number {
    let val = this.parseCombinatoric();
    while (this.startsValue()) {
      const rhs = this.parseCombinatoric();
      val *= rhs;
    }
    return val;
  }

  private parseCombinatoric(): number {
    const val = this.parsePow();
    if (this.peek() && this.peek().type === 'IDENT' && (this.peek().value === 'nPr' || this.peek().value === 'nCr')) {
      const op = this.next().value;
      const rhs = this.parsePow();
      return op === 'nPr' ? permutations(val, rhs) : combinations(val, rhs);
    }
    return val;
  }

  private parsePow(): number {
    const val = this.parseUnary();
    if (this.peek() && this.peek().type === 'OP' && this.peek().value === '^') {
      this.next();
      const rhs = this.parsePow();
      return Math.pow(val, rhs);
    }
    return val;
  }

  private parseUnary(): number {
    if (this.peek() && this.peek().type === 'OP' && this.peek().value === '-') {
      this.next();
      return -this.parseUnary();
    }
    return this.parsePostfix();
  }

  private parsePostfix(): number {
    let val = this.parsePrimary();
    while (this.peek() && this.peek().type === 'OP' && (this.peek().value === '!' || this.peek().value === '%')) {
      const op = this.next().value;
      val = op === '!' ? factorial(val) : val / 100;
    }
    return val;
  }

  private parsePrimary(): number {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.type === 'NUM') { this.next(); return parseFloat(t.value); }
    if (t.type === 'LPAREN') {
      this.next();
      const v = this.parseExpression();
      this.expect('RPAREN');
      return v;
    }
    if (t.type === 'IDENT') {
      this.next();
      const name = t.value;
      if (name === 'π') return Math.PI;
      if (name === 'e') return Math.E;
      if (name === 'Ans') return this.ctx.ans;
      if (name === 'M') return this.ctx.memory;
      if (name === 'x' && this.ctx.x !== undefined) return this.ctx.x;
      if (this.peek() && this.peek().type === 'LPAREN') {
        this.next();
        const args = [this.parseExpression()];
        while (this.peek() && this.peek().type === 'COMMA') {
          this.next();
          args.push(this.parseExpression());
        }
        this.expect('RPAREN');
        return applyFunction(name, args, this.ctx.angleMode);
      }
      throw new Error(`Unknown identifier: ${name}`);
    }
    throw new Error('Unexpected token');
  }
}

function splitTopLevelComma(s: string): string[] {
  const parts: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
  }
  parts.push(s.slice(start));
  return parts;
}

export function fmt(n: number, decimalPlaces: 'float' | number = 'float'): string {
  if (Number.isNaN(n)) return 'Math Error';
  if (!isFinite(n)) return 'Math Error';
  if (decimalPlaces !== 'float') return n.toFixed(decimalPlaces as number);
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  if (n !== 0 && (Math.abs(n) < 1e-9 || Math.abs(n) >= 1e15)) {
    return n.toExponential(6).replace('e+', '×10^').replace('e-', '×10^-');
  }
  const s = n.toPrecision(10);
  if (s.includes('e')) return s;
  return parseFloat(s).toString();
}

/** Continued-fraction rational approximation, for the S⇔D toggle. */
export function toFraction(x: number, maxDenom = 1_000_000): [number, number] | null {
  if (!isFinite(x)) return null;
  const sign = x < 0 ? -1 : 1;
  const target = Math.abs(x);
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1, b = target;
  let iterations = 0;
  do {
    const a = Math.floor(b);
    [h1, h2] = [a * h1 + h2, h1];
    [k1, k2] = [a * k1 + k2, k1];
    if (b - a < 1e-12) break;
    b = 1 / (b - a);
    iterations++;
  } while (Math.abs(target - h1 / k1) > target * 1e-9 && k1 < maxDenom && iterations < 30);
  if (k1 === 0 || k1 >= maxDenom) return null;
  return [sign * h1, k1];
}

export function evaluateExpression(raw: string, ctx: EvalContext): EvalResult {
  const trimmed = autoCloseParens(raw.trim());
  if (!trimmed) return { value: 0, display: '0' };

  const wrapMatch = /^(Pol|Rec)\(([\s\S]*)\)$/.exec(trimmed);
  if (wrapMatch) {
    const [, fn, inner] = wrapMatch;
    const parts = splitTopLevelComma(inner);
    if (parts.length === 2) {
      const a = new Parser(tokenize(normalize(autoCloseParens(parts[0]))), ctx).parse();
      const b = new Parser(tokenize(normalize(autoCloseParens(parts[1]))), ctx).parse();
      const toRad = (x: number) => (ctx.angleMode === 'deg' ? (x * Math.PI) / 180 : ctx.angleMode === 'grad' ? (x * Math.PI) / 200 : x);
      const fromRad = (x: number) => (ctx.angleMode === 'deg' ? (x * 180) / Math.PI : ctx.angleMode === 'grad' ? (x * 200) / Math.PI : x);
      if (fn === 'Pol') {
        const r = Math.hypot(a, b);
        const theta = fromRad(Math.atan2(b, a));
        return { value: r, display: `r=${fmt(r)}  θ=${fmt(theta)}` };
      }
      const x = a * Math.cos(toRad(b));
      const y = a * Math.sin(toRad(b));
      return { value: x, display: `x=${fmt(x)}  y=${fmt(y)}` };
    }
  }

  const tokens = tokenize(normalize(trimmed));
  const value = new Parser(tokens, ctx).parse();
  return { value, display: fmt(value) };
}
