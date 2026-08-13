# StudyAI — AI-Powered Study Planner

> Upload your syllabus → Get AI notes, study plans, timers & progress tracking — all free, hosted 24/7.

---

## SETUP IN 4 STEPS

### Step 1 — Install Node.js
Download and install from: https://nodejs.org (LTS version)

### Step 2 — Set up Supabase (free database & auth)
1. Go to https://supabase.com → "New project"
2. Copy your project URL and anon key
3. In SQL Editor, run the full contents of `supabase/schema.sql`
4. Enable anonymous sign-ins: Authentication → Sign In / Providers → Anonymous Sign-Ins → toggle on
   (this is what powers the name-only login — no email/password, no OAuth setup needed)

### Step 3 — Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=sk-or-v1-...   ← free models, get one at openrouter.ai/keys
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Prefer OpenAI instead (costs money, but needed for audio transcription)? Set `OPENAI_API_KEY=sk-proj-...` instead of/alongside `OPENROUTER_API_KEY` — see `.env.local.example` for both.

### Step 4 — Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

---

## DEPLOY FREE (24/7, no laptop needed)

### Deploy to Vercel (recommended — free forever)

1. Install Git: https://git-scm.com
2. Create GitHub account: https://github.com
3. Push this folder to a new GitHub repo
4. Go to https://vercel.com → "New Project" → import your repo
5. Add environment variables (same as .env.local)
6. Click Deploy → your site is live!

You get a FREE URL like: `https://studyai-yourname.vercel.app`

### Custom .com domain (optional, ~$10/year)
1. Buy domain at https://namecheap.com or https://porkbun.com
2. In Vercel → Domains → Add your domain
3. Follow DNS instructions

---

## FEATURES

| Feature | Description |
|---------|-------------|
| 🔐 Auth | Name-only sign-in — no email or password, powered by Supabase anonymous auth |
| 🧠 Ask AI | Any subject, any format — type a question, paste a textbook page, upload a photo/PDF, or record audio. Get a full explanation with LaTeX formulas, a Mermaid diagram, worked examples, key takeaways and flashcards |
| 📤 Syllabus Upload | PDF, image, or paste text — AI extracts everything |
| 🤖 AI Notes | Short notes, detailed, key points, exam Qs, flashcards |
| 📅 Study Planner | AI generates day-by-day schedule from exam date |
| ⏱️ Study Timer | Track time per subject/chapter |
| 📊 Progress | Charts for study time, chapter completion, streaks |
| 🏆 Gamification | Points, streaks, achievements |
| 🌙 Dark mode | Full light/dark theme support |
| 📱 Responsive | Works on mobile, tablet, desktop |

---

## FOLDER STRUCTURE

```
ai-study-planner/
├── app/
│   ├── (auth)/login/        # Login page
│   ├── (auth)/signup/       # Signup page
│   ├── (dashboard)/
│   │   ├── layout.tsx       # Dashboard shell
│   │   ├── dashboard/       # Main dashboard
│   │   ├── subjects/        # Subjects + chapters
│   │   ├── notes/           # AI notes + flashcards
│   │   ├── timer/           # Study timer
│   │   ├── progress/        # Charts + achievements
│   │   ├── planner/         # AI study planner
│   │   └── settings/        # User settings
│   ├── api/
│   │   ├── auth/callback/   # OAuth callback
│   │   ├── syllabus/extract # AI syllabus extraction
│   │   ├── notes/generate   # AI notes generation
│   │   └── planner/generate # AI plan generation
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── layout/              # Sidebar, Header
│   ├── subjects/            # SubjectCard, SyllabusUpload
│   └── notes/               # NotesGenerator, FlashCardDeck
├── lib/
│   ├── ai/                  # OpenAI client + AI functions
│   ├── supabase/            # Supabase client/server
│   ├── store.ts             # Zustand global state
│   └── utils.ts             # Helpers, achievements
├── supabase/schema.sql      # Full database schema
├── types/index.ts           # TypeScript types
└── .env.local.example       # Environment template
```

---

## AI FUNCTIONS

| Function | File | Description |
|----------|------|-------------|
| `extractSyllabus(text)` | lib/ai/extractSyllabus.ts | Parses syllabus into subjects/chapters/topics |
| `generateNotes(subject, chapter, topics)` | lib/ai/generateNotes.ts | Creates 5 note types per chapter |
| `generateStudyPlan(input)` | lib/ai/generateStudyPlan.ts | Builds day-by-day study schedule |
| `generateExplanation(question, context, images)` | lib/ai/generateExplanation.ts | Full explanation (formulas, Mermaid diagram, examples, flashcards) for any question, textbook excerpt, photo, or audio transcript — powers `/ask` |

Powered by OpenRouter's free models by default (text + vision), or GPT-4o if you set `OPENAI_API_KEY`. Audio transcription (Whisper) always needs a real `OPENAI_API_KEY` — OpenRouter doesn't proxy speech-to-text.
