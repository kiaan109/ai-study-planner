export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDurationHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  if (m > 0) return `${m} min`;
  return `${seconds} sec`;
}

export function getProgressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getLevel(points: number): { level: number; nextLevelPoints: number; progress: number } {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];
  let level = 1;
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (points >= thresholds[i]) level = i + 1;
  }
  const curr = thresholds[Math.min(level - 1, thresholds.length - 1)];
  const next = thresholds[Math.min(level, thresholds.length - 1)];
  const progress = next > curr ? Math.round(((points - curr) / (next - curr)) * 100) : 100;
  return { level, nextLevelPoints: next, progress };
}

export const SUBJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#6366f1',
];

export const SUBJECT_ICONS = ['📚','🔬','📐','🌍','📖','🎨','💻','🧪','🏛️','🎵'];

export function randomColor(): string {
  return SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];
}

export function randomIcon(): string {
  return SUBJECT_ICONS[Math.floor(Math.random() * SUBJECT_ICONS.length)];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getDaysBetween(d1: string, d2: string): number {
  const a = new Date(d1).getTime();
  const b = new Date(d2).getTime();
  return Math.ceil(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

export const ACHIEVEMENTS = [
  { id: 'first_session',    name: 'First Step',       description: 'Complete your first study session', icon: '🚀', points: 10  },
  { id: 'streak_3',         name: '3-Day Streak',      description: 'Study 3 days in a row',             icon: '🔥', points: 30  },
  { id: 'streak_7',         name: 'Week Warrior',      description: 'Study 7 days in a row',             icon: '⚡', points: 70  },
  { id: 'streak_30',        name: 'Month Master',      description: 'Study 30 days in a row',            icon: '🏆', points: 300 },
  { id: 'notes_10',         name: 'Note Taker',        description: 'Generate 10 sets of notes',         icon: '📝', points: 50  },
  { id: 'hours_10',         name: '10 Hours Club',     description: 'Study for 10 total hours',          icon: '⏰', points: 100 },
  { id: 'hours_50',         name: '50 Hours Club',     description: 'Study for 50 total hours',          icon: '💪', points: 500 },
  { id: 'chapter_complete', name: 'Chapter Champion',  description: 'Complete 5 chapters',               icon: '✅', points: 50  },
  { id: 'all_subjects',     name: 'Balanced Scholar',  description: 'Study all your subjects',           icon: '🎯', points: 100 },
  { id: 'plan_created',     name: 'Strategic Mind',    description: 'Create a study plan',               icon: '📅', points: 20  },
];
