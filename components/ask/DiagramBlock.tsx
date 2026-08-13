'use client';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

let idCounter = 0;

export default function DiagramBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'default', securityLevel: 'strict' });
        const id = `mermaid-${idCounter++}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        console.error('Mermaid render failed', e);
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [code, theme]);

  if (error) return null;
  return <div ref={ref} className="overflow-x-auto flex justify-center py-2" />;
}
