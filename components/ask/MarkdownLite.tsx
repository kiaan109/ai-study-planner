'use client';
import { Fragment } from 'react';

function inline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <Fragment key={key}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg)' }}>{part.slice(1, -1)}</code>;
        }
        return part;
      })}
    </Fragment>
  );
}

/** Renders a constrained markdown subset (##, **bold**, `code`, -/1. lists, paragraphs) without extra deps. */
export default function MarkdownLite({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;

  function flushList(key: string) {
    if (list.length === 0) return;
    const Tag = ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={key} className={ordered ? 'list-decimal pl-5 space-y-1 my-3' : 'list-disc pl-5 space-y-1 my-3'}>
        {list.map((item, i) => <li key={i} className="text-sm leading-relaxed">{inline(item, i)}</li>)}
      </Tag>
    );
    list = [];
  }

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      flushList(`l${idx}`);
      blocks.push(<h3 key={idx} className="text-lg font-bold mt-5 mb-2">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      flushList(`l${idx}`);
      blocks.push(<h2 key={idx} className="text-xl font-bold mt-5 mb-2">{line.slice(2)}</h2>);
    } else if (/^[-*]\s+/.test(line)) {
      if (ordered) flushList(`l${idx}`);
      ordered = false;
      list.push(line.replace(/^[-*]\s+/, ''));
    } else if (/^\d+\.\s+/.test(line)) {
      if (!ordered) flushList(`l${idx}`);
      ordered = true;
      list.push(line.replace(/^\d+\.\s+/, ''));
    } else if (line === '') {
      flushList(`l${idx}`);
    } else {
      flushList(`l${idx}`);
      blocks.push(<p key={idx} className="text-sm leading-relaxed my-2" style={{ color: 'var(--text)' }}>{inline(line, idx)}</p>);
    }
  });
  flushList('lend');

  return <div className="prose-lite">{blocks}</div>;
}
