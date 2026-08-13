'use client';
import { useEffect, useRef } from 'react';

export default function FormulaBlock({ latex }: { latex: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    import('katex').then((katex) => {
      if (cancelled || !ref.current) return;
      try {
        ref.current.innerHTML = katex.default.renderToString(latex, {
          throwOnError: false,
          displayMode: true,
        });
      } catch {
        if (ref.current) ref.current.textContent = latex;
      }
    });
    return () => { cancelled = true; };
  }, [latex]);

  return <div ref={ref} className="overflow-x-auto py-1 text-sm" />;
}
