"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CHAPTERS } from "@/content/wars";
import { bankTotalOf } from "@/lib/wars/engine";
import { useWars, levelOf, xpForLevel, dailyCount, dailyGoal, key } from "@/lib/wars/store";
import LessonViewer from "./LessonViewer";
import PracticeArena from "./PracticeArena";
import BossView from "./BossView";
import ProgressView from "./ProgressView";

const IslandsMap = dynamic(() => import("./IslandsMap"), { ssr: false, loading: () => <div className="absolute inset-0 bg-gradient-to-b from-[#0b1030] to-[#070a18]" /> });

type View = "map" | "chapter" | "lesson" | "arena" | "boss" | "progress";

function ChapterGrid({ onPick }: { onPick: (n: number) => void }) {
  const subs = useWars((s) => s.subs);
  return (
    <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
      {CHAPTERS.map((c) => {
        const ms = c.subtopics.map((s) => subs[key(c.num, s.id)]?.m ?? 0);
        const avg = Math.round(ms.reduce((a, b) => a + b, 0) / ms.length);
        return (
          <button key={c.num} onClick={() => onPick(c.num)} className="group flex min-h-[72px] items-center gap-4 rounded-2xl border border-white/10 bg-[#0b0f24]/80 p-4 text-left backdrop-blur transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">
            <span className="text-3xl">{c.emoji}</span>
            <span className="flex-1">
              <span className="block text-xs font-semibold tracking-widest" style={{ color: c.color }}>WORLD {c.num}</span>
              <span className="block font-bold">{c.world}</span>
              <span className="block text-xs text-zinc-400">{c.title}</span>
            </span>
            <span className="text-right">
              <span className="block text-lg font-black" style={{ color: c.color }}>{avg}%</span>
              <span className="block text-[10px] text-zinc-400">mastered</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function GameShell({ initialCh, initialView }: { initialCh?: number; initialView?: string }) {
  const [view, setView] = useState<View>(initialView === "arena" ? "arena" : initialCh ? "chapter" : "map");
  const [chNum, setChNum] = useState<number | null>(initialCh ?? null);
  const [sub, setSub] = useState<string | undefined>(undefined);
  const [grid, setGrid] = useState(false);
  const store = useWars();

  const ch = useMemo(() => CHAPTERS.find((c) => c.num === chNum) ?? null, [chNum]);
  const level = levelOf(store.xp);
  const lvlStart = xpForLevel(level);
  const lvlEnd = xpForLevel(level + 1);
  const pct = Math.min(100, Math.round(((store.xp - lvlStart) / Math.max(1, lvlEnd - lvlStart)) * 100));
  const done = dailyCount(store.daily);
  const arenaMode = view === "arena";

  const openChapter = (n: number) => { setChNum(n); setSub(undefined); setView("chapter"); };
  const openLesson = (n: number, s: string) => { setChNum(n); setSub(s); store.visit(n, s); setView("lesson"); };
  const openArena = (n?: number, s?: string) => { setChNum(n ?? null); setSub(s); setView("arena"); };

  const islands = CHAPTERS.map((c) => {
    const ms = c.subtopics.map((s) => store.subs[key(c.num, s.id)]?.m ?? 0);
    return { num: c.num, world: c.world, emoji: c.emoji, color: c.color, mastery: ms.reduce((a, b) => a + b, 0) / ms.length };
  });

  const NavBtn = ({ v, label, e }: { v: View; label: string; e: string }) => (
    <button onClick={() => { if (v !== "chapter" && v !== "lesson" && v !== "boss") { setView(v); if (v === "arena") setChNum(null); } else setView("map"); }} className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${view === v ? "bg-amber-400/15 text-amber-300" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}>
      <span className="text-lg">{e}</span> {label}
    </button>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      {/* SIDEBAR (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#080b1d] p-4 lg:flex">
        <Link href="/wars" className="mb-6 flex items-center gap-2.5">
          <span className="text-2xl">⚔️</span>
          <span className="leading-none">
            <span className="block font-black tracking-widest text-amber-300">MATHS WARS</span>
            <span className="block text-[10px] tracking-[0.3em] text-zinc-500">VIDYASAATHY</span>
          </span>
        </Link>
        <nav className="space-y-1">
          <NavBtn v="map" label="Worlds Map" e="🗺️" />
          <NavBtn v="arena" label="Practice Arena" e="⚔️" />
          <NavBtn v="progress" label="My Progress" e="📈" />
        </nav>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-black text-zinc-950">L{level}</div>
            <div>
              <div className="text-sm font-bold">Math Warrior</div>
              <div className="text-xs text-zinc-400">{store.xp} XP</div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-[10px] text-zinc-400">{store.xp - lvlStart} / {lvlEnd - lvlStart} XP to Level {level + 1}</div>
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs font-bold text-zinc-300">🗓️ Daily Quest</div>
          <div className="mt-2 text-xs text-zinc-400">Solve {dailyGoal} questions today</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full transition-all ${done >= dailyGoal ? "bg-emerald-400" : "bg-sky-400"}`} style={{ width: `${Math.min(100, (done / dailyGoal) * 100)}%` }} />
          </div>
          <div className="mt-1.5 text-[10px] font-semibold" style={{ color: done >= dailyGoal ? "#34d399" : "#7dd3fc" }}>{done}/{dailyGoal} {done >= dailyGoal ? "— quest complete! ⭐" : ""}</div>
        </div>
        <div className="mt-auto text-[10px] text-zinc-400">Progress saved on this device.</div>
      </aside>

      {/* MAIN */}
      <div className="relative flex-1 overflow-y-auto">
        {/* mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#080b1d]/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <Link href="/wars" className="flex items-center gap-2 text-sm font-black tracking-widest text-amber-300">⚔️ MATHS WARS</Link>
          <div className="text-xs font-bold text-zinc-300">L{level} · {store.xp} XP</div>
        </div>

        {view === "map" && (
          <div className="relative h-[calc(100vh-49px)] lg:h-full">
            <IslandsMap islands={islands} onSelect={(n) => openChapter(n)} fallback={<div className="flex h-full items-center justify-center p-6"><ChapterGrid onPick={openChapter} /></div>} />
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-[#0b0f24]/80 px-4 py-1.5 text-xs text-zinc-400 backdrop-blur">Tap an island to enter its world</div>
            <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-2 lg:bottom-6 lg:right-6">
              <button onClick={() => setGrid((g) => !g)} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 bg-[#0b0f24]/85 px-3.5 py-2 text-xs font-bold backdrop-blur hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">{grid ? "🌌 3D Map" : "📋 List View"}</button>
              <button onClick={() => openArena()} className="inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-2 text-xs font-black text-zinc-950 shadow-lg shadow-amber-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">⚔️ Quick Battle</button>
            </div>
            {grid && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#070a18]/70 p-4 backdrop-blur-sm" onClick={() => setGrid(false)}>
                <div onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full justify-center overflow-y-auto overscroll-contain p-2 pb-24 lg:pb-2">
                  <ChapterGrid onPick={openChapter} />
                </div>
              </div>
            )}
          </div>
        )}

        {view === "chapter" && ch && (
          <div className="mx-auto max-w-3xl p-4 pb-24 sm:p-8">
            <button onClick={() => setView("map")} className="-mx-2 mb-4 inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm text-zinc-400 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">← Worlds Map</button>
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${ch.grad[0]}22, ${ch.grad[1]}11)` }}>
                <div className="text-5xl">{ch.emoji}</div>
                <div className="mt-2 text-xs font-bold tracking-[0.25em]" style={{ color: ch.color }}>WORLD {ch.num} · {ch.world.toUpperCase()}</div>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">{ch.title}</h1>
                <p className="mt-2 max-w-xl text-sm text-zinc-400">{ch.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{ch.subtopics.length} subtopic quests</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{bankTotalOf(ch).toLocaleString()}+ unique questions</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">👑 Boss: {ch.boss.title}</span>
                </div>
              </div>
              <div className="divide-y divide-white/5 bg-white/[0.02]">
                {ch.subtopics.map((s, i) => {
                  const st = store.subs[key(ch.num, s.id)];
                  const acc = st && st.a > 0 ? Math.round((st.c / st.a) * 100) : null;
                  const visited = store.visited[key(ch.num, s.id)];
                  return (
                    <div key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black" style={{ borderColor: `${ch.color}55`, color: ch.color }}>{i + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-bold">{s.title}{!visited && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black" style={{ background: ch.color, color: "#0b0f24" }}>NEW</span>}</div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{s.objectives[0]}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${st?.m ?? 0}%`, background: ch.color }} /></div>
                          <span className="text-[10px] text-zinc-400">{Math.round(st?.m ?? 0)}% mastery{acc !== null ? ` · ${acc}% accuracy` : ""}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openLesson(ch.num, s.id)} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">📖 Learn</button>
                        <button onClick={() => openArena(ch.num, s.id)} className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-xs font-black text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80" style={{ background: `linear-gradient(135deg, ${ch.grad[0]}, ${ch.grad[1]})` }}>⚔️ Practice</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="font-black">👑 {ch.boss.title}</div>
                  <div className="text-xs text-zinc-400">{ch.boss.desc}</div>
                </div>
                <button onClick={() => setView("boss")} className="inline-flex min-h-[44px] items-center rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-sm font-black text-amber-300 hover:bg-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">Enter Boss Arena</button>
              </div>
            </div>
          </div>
        )}

        {view === "lesson" && ch && sub && (
          <LessonViewer ch={ch} subId={sub} onBack={() => setView("chapter")} onPractice={() => openArena(ch.num, sub)} />
        )}

        {arenaMode && (
          <div className="mx-auto max-w-3xl p-4 pb-28 sm:p-8">
            <PracticeArena chapters={CHAPTERS} chNum={chNum ?? undefined} sub={sub} onExit={() => (chNum ? setView("chapter") : setView("map"))} />
          </div>
        )}

        {view === "boss" && ch && (
          <div className="mx-auto max-w-3xl p-4 pb-28 sm:p-8">
            <BossView ch={ch} onExit={() => setView("chapter")} />
          </div>
        )}

        {view === "progress" && (
          <div className="mx-auto max-w-3xl p-4 pb-28 sm:p-8">
            <ProgressView onPractice={openArena} onChapter={openChapter} />
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav aria-label="Primary" className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t border-white/10 bg-[#080b1d]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {[
          { v: "map" as View, e: "🗺️", t: "Worlds" },
          { v: "arena" as View, e: "⚔️", t: "Arena" },
          { v: "progress" as View, e: "📈", t: "Progress" },
        ].map((b) => (
          <button key={b.v} onClick={() => { setView(b.v); if (b.v === "arena") setChNum(null); setSub(undefined); }} className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400/60 ${view === b.v ? "text-amber-300" : "text-zinc-400"}`}>
            <span className="text-lg">{b.e}</span>{b.t}
          </button>
        ))}
      </nav>
    </div>
  );
}
