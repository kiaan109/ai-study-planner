import { create } from 'zustand';
import { Subject, StudySession, DashboardStats } from '@/types';

interface TimerState {
  isRunning: boolean;
  seconds: number;
  selectedSubjectId: string | null;
  selectedChapterId: string | null;
  sessionStartedAt: Date | null;
}

interface AppStore {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  stats: DashboardStats | null;
  setStats: (stats: DashboardStats) => void;
  timer: TimerState;
  startTimer: (subjectId: string, chapterId: string | null) => void;
  stopTimer: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
}

const defaultTimer: TimerState = {
  isRunning: false,
  seconds: 0,
  selectedSubjectId: null,
  selectedChapterId: null,
  sessionStartedAt: null,
};

export const useAppStore = create<AppStore>((set) => ({
  subjects: [],
  setSubjects: (subjects) => set({ subjects }),
  stats: null,
  setStats: (stats) => set({ stats }),
  timer: defaultTimer,
  startTimer: (subjectId, chapterId) =>
    set({ timer: { isRunning: true, seconds: 0, selectedSubjectId: subjectId, selectedChapterId: chapterId, sessionStartedAt: new Date() } }),
  stopTimer: () =>
    set((s) => ({ timer: { ...s.timer, isRunning: false } })),
  tickTimer: () =>
    set((s) => ({ timer: { ...s.timer, seconds: s.timer.seconds + 1 } })),
  resetTimer: () => set({ timer: defaultTimer }),
}));
