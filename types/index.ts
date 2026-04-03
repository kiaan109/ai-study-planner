export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  streak: number;
  total_points: number;
  level: number;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
  chapters?: Chapter[];
  progress?: number;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  order_index: number;
  is_completed: boolean;
  created_at: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  is_completed: boolean;
  order_index: number;
}

export interface Note {
  id: string;
  user_id: string;
  subject_id: string;
  chapter_id: string | null;
  title: string;
  content: string;
  type: 'short' | 'detailed' | 'important' | 'exam_questions' | 'flashcards' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  note_id: string;
  front: string;
  back: string;
  is_mastered: boolean;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string;
  chapter_id: string | null;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
  subject?: Subject;
  chapter?: Chapter;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  exam_date: string;
  hours_per_day: number;
  created_at: string;
  daily_plans?: DailyPlan[];
}

export interface DailyPlan {
  id: string;
  plan_id: string;
  date: string;
  subject_name: string;
  chapter_name: string;
  duration_minutes: number;
  is_completed: boolean;
  notes: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface DashboardStats {
  totalStudyTime: number;
  todayStudyTime: number;
  weeklyStudyTime: number;
  completedChapters: number;
  totalChapters: number;
  streak: number;
  points: number;
  level: number;
}

export interface GeneratedNotes {
  shortNotes: string;
  detailedNotes: string;
  importantPoints: string[];
  examQuestions: { question: string; answer: string }[];
  flashcards: { front: string; back: string }[];
}

export interface SyllabusData {
  subjects: {
    name: string;
    description: string;
    chapters: {
      name: string;
      topics: string[];
    }[];
  }[];
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}
