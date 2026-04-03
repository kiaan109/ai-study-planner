'use client';
import Link from 'next/link';
import { BookOpen, Brain, Clock, BarChart3, Upload, Zap, CheckCircle, Star, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  { icon: Upload,   color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',   title: 'Syllabus Upload',    desc: 'Upload PDF, image, or paste text — AI extracts every subject, chapter, and topic instantly.' },
  { icon: Brain,    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600', title: 'AI-Powered Notes', desc: 'Get short notes, detailed explanations, exam questions, and flashcards generated for each chapter.' },
  { icon: BarChart3,color: 'bg-green-100 dark:bg-green-900/30 text-green-600',  title: 'Smart Study Plans', desc: 'Enter your exam date and available hours — AI builds a day-by-day personalized schedule.' },
  { icon: Clock,    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',title: 'Study Timer',     desc: 'Track every study session per subject and chapter with beautiful daily and weekly insights.' },
  { icon: BarChart3,color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600',     title: 'Progress Tracker', desc: 'Visual charts showing study time per subject, chapter completion, and daily streaks.' },
  { icon: Zap,      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',title: 'Gamification',    desc: 'Earn points, unlock achievements, and maintain streaks to stay motivated every day.' },
];

const testimonials = [
  { name: 'Aanya S.',  grade: 'Grade 12', text: 'I went from failing to A+ in 3 months. The AI notes are incredible.', stars: 5 },
  { name: 'Marcus T.', grade: 'University', text: 'My study plan saved my finals. Everything organized automatically.', stars: 5 },
  { name: 'Priya K.',  grade: 'IGCSE',     text: 'The flashcards feature is so good. I study 2x faster now.', stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">StudyAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--muted)' }}>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">Login</Link>
            <Link href="/signup" className="btn-primary text-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 border" style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>
            <Sparkles className="w-4 h-4" />
            Powered by Claude AI · 100% personalized
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Study smarter with<br />
            <span className="gradient-text">AI-powered plans</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
            Upload your syllabus. Get instant notes, a personalized study schedule, progress tracking, and more — all in one beautiful workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup" className="btn-primary text-base px-8 py-4 flex items-center gap-2">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-4">
              Sign in to your account
            </Link>
          </div>
          <p className="mt-6 text-sm" style={{ color: 'var(--muted)' }}>No credit card · Free forever plan available</p>
        </div>

        {/* Hero visual */}
        <div className="mt-20 max-w-5xl mx-auto relative">
          <div className="absolute inset-0 rounded-3xl opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }} />
          <div className="relative card p-0 overflow-hidden rounded-3xl border-2" style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
            <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ background: 'var(--bg)' }}>
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-4 text-xs font-mono" style={{ color: 'var(--muted)' }}>StudyAI Dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderColor: 'var(--border)' }}>
              <div className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Today's Plan</p>
                {['Mathematics · Ch 4', 'Physics · Ch 7', 'Chemistry · Ch 2'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#22c55e' }} />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Study Time</p>
                <div className="text-4xl font-bold gradient-text">4h 32m</div>
                <div className="space-y-2">
                  {[['Math', 65], ['Physics', 45], ['Chemistry', 80]].map(([s, p]) => (
                    <div key={s}>
                      <div className="flex justify-between text-xs mb-1"><span>{s}</span><span style={{ color: 'var(--muted)' }}>{p}%</span></div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${p}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>AI Notes</p>
                <div className="space-y-3">
                  {['Short Notes', 'Flashcards', 'Exam Qs'].map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: 'var(--bg)' }}>
                      <span className="text-sm">{t}</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-3 rounded-xl text-center text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                  🔥 7-day streak!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Built for serious students</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>Every tool you need to go from confused to confident — powered by Claude AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6" style={{ background: 'var(--surface)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">Simple process</p>
          <h2 className="text-4xl font-extrabold tracking-tight mb-16">3 steps to study mastery</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📤', title: 'Upload Syllabus',      desc: 'Upload your PDF, image, or paste the text of your syllabus.' },
              { step: '02', icon: '🤖', title: 'AI Does the Work',     desc: 'AI instantly extracts subjects, chapters, topics, and generates notes & a schedule.' },
              { step: '03', icon: '🎯', title: 'Study with Precision', desc: 'Follow your personalized plan, track time, and hit every milestone.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-6xl mb-4">{icon}</div>
                <div className="text-xs font-mono font-bold text-blue-500 mb-2">{step}</div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight">Students love it</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, grade, text, stars }) => (
              <div key={name} className="card">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-6 italic" style={{ color: 'var(--muted)' }}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{grade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-12 text-white" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            <h2 className="text-4xl font-extrabold mb-4">Ready to ace your exams?</h2>
            <p className="text-lg opacity-90 mb-8">Join thousands of students already studying smarter with AI.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors text-base">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold gradient-text">StudyAI</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>© 2026 StudyAI. Built for students, powered by Claude AI.</p>
        </div>
      </footer>
    </div>
  );
}
