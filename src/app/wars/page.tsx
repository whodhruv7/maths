"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CHAPTERS } from "@/content/wars";
import { bankTotalOf } from "@/lib/wars/engine";

const Hero3D = dynamic(() => import("@/components/wars/Hero3D"), { ssr: false, loading: () => <div className="absolute inset-0 bg-gradient-to-b from-[#0b1030] via-[#070a18] to-[#070a18]" /> });

const STEPS = [
  { n: "01", t: "Explore the Chapter", d: "See the full map of subtopics, objectives and what you're about to conquer.", e: "🧭" },
  { n: "02", t: "Learn the Concept", d: "Short, beautiful lessons with 3D & interactive diagrams you can drag, resize and break.", e: "🧠" },
  { n: "03", t: "Try It Yourself", d: "Predict first, then test your idea on the live model. Thinking happens here.", e: "✍️" },
  { n: "04", t: "View the Solutions", d: "Every question unwinds step-by-step: Given → Concept → Working → Verify.", e: "🎬" },
  { n: "05", t: "Practice & Master", d: "Unlimited unique questions, adaptive to your weak spots, until mastery hits 100%.", e: "🏆" },
];

const WHY = [
  { e: "📚", t: "Textbook-synced", d: "Every lesson and question traces to your Ganita Manjari (NCERT Class 9) chapters." },
  { e: "♾️", t: "5,000+ unique questions", d: "A generator engine — not a fixed list. Answers are computed, so they're always correct." },
  { e: "🌌", t: "Truly 3D & interactive", d: "Drag radii, move points, unfold solids. The maths itself is the spectacle." },
  { e: "📓", t: "Paper-first practice", d: "We make you solve in your notebook — the way real exams demand." },
  { e: "🎯", t: "Adaptive mastery", d: "Weak subtopics resurface until they become strengths." },
  { e: "🛡️", t: "Step-by-step everything", d: "Solution decks teach the reasoning, not just the answer." },
];

export default function WarsLanding() {
  const total = CHAPTERS.reduce((a, c) => a + bankTotalOf(c), 0);
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-[92vh] flex flex-col">
        <div className="absolute inset-0">
          <Hero3D />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#070a18]/40 to-[#070a18]" />

        <nav className="relative z-10 flex items-center justify-between px-5 sm:px-10 py-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚔️</span>
            <div className="leading-none">
              <div className="font-black tracking-widest text-lg bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">MATHS WARS</div>
              <div className="text-[10px] text-zinc-400 tracking-[0.3em] mt-0.5">VIDYASAATHY</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-300">
            <a href="#worlds" className="hover:text-amber-300 transition-colors">Worlds</a>
            <a href="#how" className="hover:text-amber-300 transition-colors">How it works</a>
            <a href="#why" className="hover:text-amber-300 transition-colors">Why it works</a>
          </div>
          <Link href="/wars/play" className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/25 hover:scale-[1.03] active:scale-95 transition-transform">
            Enter the Arena ⚔️
          </Link>
        </nav>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 pt-6">
          <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs tracking-widest text-amber-300 mb-6">CLASS 9 · GANITA MANJARI · NCERT ALIGNED</div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] max-w-4xl">
            Class 9 maths is the battlefield.
            <span className="block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.25)]">Your brain is the weapon.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-zinc-300 text-base sm:text-lg leading-relaxed">
            Eight worlds forged from the maths itself. Learn every concept with 3D diagrams you can grab and bend — then prove it on paper against {(total / 1000).toFixed(1)}k+ uniquely generated questions. Level up, slay chapter bosses, own the book.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/wars/play" className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3.5 font-extrabold text-zinc-950 text-lg shadow-xl shadow-orange-500/30 hover:scale-[1.04] active:scale-95 transition-transform">Enter the Battlefield ⚔️</Link>
            <Link href="/wars/play?view=arena" className="rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 font-bold text-zinc-100 hover:bg-white/10 transition-colors">Practice Arena →</Link>
          </div>
          <div className="mt-10 flex max-w-lg flex-wrap items-center justify-center gap-2 sm:max-w-none sm:gap-2.5 text-[11px] sm:text-xs text-zinc-400">
            {[`${CHAPTERS.length} Worlds`, `${total.toLocaleString()}+ question engine`, "Step-by-step solution decks", "Paper-first practice", "Progress saved on device"].map((s) => (
              <span key={s} className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW YOU'LL LEARN */}
      <section id="how" className="relative z-10 scroll-mt-20 px-5 sm:px-10 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-center">How you&apos;ll <span className="text-amber-300">learn</span></h2>
        <p className="text-center text-zinc-400 mt-3 max-w-xl mx-auto">The same battle-tested loop for every subtopic — understand deeply before you ever grind questions.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.n} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-amber-400/40 hover:bg-white/[0.07] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{s.e}</span>
                <span className="font-mono text-xs text-zinc-500 group-hover:text-amber-300">{s.n}</span>
              </div>
              <div className="mt-4 font-bold">{s.t}</div>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WORLDS */}
      <section id="worlds" className="relative z-10 scroll-mt-20 px-5 sm:px-10 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black text-center">Interactive <span className="text-amber-300">Learning Worlds</span></h2>
        <p className="text-center text-zinc-400 mt-3 max-w-xl mx-auto">Eight realms, one for every chapter of your book. Each one is built from its maths.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CHAPTERS.map((c) => (
            <Link key={c.num} href={`/wars/play?ch=${c.num}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:scale-[1.02] transition-transform">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: c.grad[1] }} />
              <div className="text-4xl">{c.emoji}</div>
              <div className="mt-3 text-xs font-semibold tracking-widest" style={{ color: c.color }}>WORLD {c.num}</div>
              <div className="mt-1 font-black text-lg leading-tight">{c.world}</div>
              <div className="text-sm text-zinc-400 mt-1">{c.title}</div>
              <p className="mt-3 text-xs text-zinc-500 leading-relaxed">{c.blurb}</p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400">
                <span>{c.subtopics.length} quests</span>
                <span>{bankTotalOf(c).toLocaleString()}+ questions</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section id="why" className="relative z-10 scroll-mt-20 px-5 sm:px-10 py-20 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-black">Why it <span className="text-amber-300">works</span></h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.t} className="flex gap-4">
                <div className="text-3xl shrink-0">{w.e}</div>
                <div>
                  <div className="font-bold">{w.t}</div>
                  <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{w.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 sm:px-10 py-8 text-center text-sm text-zinc-500">
        <div className="font-black tracking-widest text-zinc-300">MATHS WARS <span className="text-amber-400">·</span> VIDYASAATHY</div>
        <p className="mt-2">Built for Class 9 warriors · Curriculum: Ganita Manjari (NCERT Class 9) · Progress is stored privately on your device.</p>
      </footer>
    </main>
  );
}
