'use client';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthShellProps {
  eyebrow: string;
  heading: ReactNode;
  tagline: string;
  bullets: { icon: string; text: string }[];
  children: ReactNode;
}

/** Kognity/Toddle-inspired split layout: playful blob-and-badge left panel, clean form on the right. */
export default function AuthShell({ eyebrow, heading, tagline, bullets, children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel — colorful, friendly, illustrative */}
      <div className="hidden lg:flex relative flex-col justify-between w-1/2 p-12 overflow-hidden" style={{ background: 'linear-gradient(160deg,#4338ca,#7c3aed 55%,#c026d3)' }}>
        {/* soft blobs */}
        <div className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 rounded-full opacity-40 blur-3xl" style={{ background: '#fbbf24' }} />
        <div className="pointer-events-none absolute top-1/3 -right-24 w-72 h-72 rounded-full opacity-30 blur-3xl" style={{ background: '#34d399' }} />
        <div className="pointer-events-none absolute -bottom-28 left-10 w-96 h-96 rounded-full opacity-30 blur-3xl" style={{ background: '#38bdf8' }} />

        <Link href="/" className="relative flex items-center gap-2 text-white">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">StudyAI</span>
        </Link>

        <div className="relative">
          <span className="inline-block px-3 py-1 mb-5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 text-white backdrop-blur">
            {eyebrow}
          </span>
          <h2 className="text-4xl font-extrabold mb-4 text-white leading-tight">{heading}</h2>
          <p className="text-white/80 text-lg">{tagline}</p>

          <div className="mt-10 space-y-3">
            {bullets.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-4 py-3 text-white">
                <span className="text-xl leading-none">{icon}</span>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/60 text-sm">© 2026 StudyAI</p>
      </div>

      {/* Right panel — the form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-in">{children}</div>
      </div>
    </div>
  );
}
