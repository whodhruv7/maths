"use client";
import { CHAPTERS } from "@/content/wars";
import { useWars, levelOf, xpForLevel, key, dailyCount, dailyGoal } from "@/lib/wars/store";
import { bankTotalOf } from "@/lib/wars/engine";

const BADGES: Record<string, { e: string; t: string }> = {
  "first-spark": { e: "✨", t: "First Spark · 500 XP" },
  century: { e: "💯", t: "Century · 100 correct" },
  warlord: { e: "🗡️", t: "Warlord · 500 correct" },
};

export default function ProgressView({ onPractice, onChapter }: { onPractice: (ch?: number, sub?: string) => void; onChapter: (n: number) => void }) {
  const store = useWars();
  const level = levelOf(store.xp);
  const totalCorrect = Object.values(store.subs).reduce((a, s) => a + s.c, 0);
  const totalAttempt = Object.values(store.subs).reduce((a, s) => a + s.a, 0);
  const acc = totalAttempt ? Math.round((totalCorrect / totalAttempt) * 100) : 0;
  const done = dailyCount(store.daily);

  const weak: { ch: number; world: string; color: string; sub: string; title: string; m: number; a: number }[] = [];
  for (const c of CHAPTERS) for (const s of c.subtopics) {
    const st = store.subs[key(c.num, s.id)];
    if (st && st.a >= 2 && st.m < 60) weak.push({ ch: c.num, world: c.world, color: c.color, sub: s.id, title: s.title, m: st.m, a: st.a });
  }
  weak.sort((a, b) => a.m - b.m);

  // level ring math + rank title
  const RANKS: [number, string][] = [[20, "Legend"], [15, "Warlord"], [10, "Elite"], [6, "Warrior"], [3, "Fighter"], [1, "Recruit"]];
  const rank = RANKS.find(([l]) => level >= l)?.[1] ?? "Recruit";
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const prog = next > base ? Math.min(1, Math.max(0, (store.xp - base) / (next - base))) : 0;
  const RING_C = 2 * Math.PI * 28;

  const bossBadges = store.bossDone.map((n) => {
    const c = CHAPTERS.find((x) => x.num === Number(n));
    return { id: `boss-${n}`, e: "👑", t: `Boss Slayer · ${c?.world ?? n}` };
  });
  const badgeList = [...Object.entries(BADGES).map(([id, b]) => ({ id, ...b })), ...bossBadges];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">📈 My Progress</h1>

      {/* warrior card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/[0.09] to-transparent p-5">
          <div className="text-xs text-zinc-500">WARRIOR LEVEL</div>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="url(#lvl-ring)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${prog * RING_C} ${RING_C}`} className="drop-shadow-[0_0_6px_rgba(251,191,36,0.55)] transition-all" />
                <defs>
                  <linearGradient id="lvl-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]">L{level}</div>
            </div>
            <div className="min-w-0">
              <div className="font-black text-amber-200">{rank}</div>
              <div className="mt-0.5 text-xs text-zinc-400">{store.xp.toLocaleString()} XP</div>
              <div className="text-[11px] text-zinc-500">{(next - store.xp).toLocaleString()} XP to L{level + 1}</div>
            </div>
          </div>
          {totalAttempt === 0 && <p className="mt-3 text-xs text-zinc-400">Your legend starts with the first question — enter the Arena ⚔️</p>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs text-zinc-500">TOTAL ACCURACY</div>
          <div className="mt-1 text-3xl font-black text-sky-300">{acc}%</div>
          <div className="mt-1 text-xs text-zinc-400">{totalCorrect} correct of {totalAttempt} attempted</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs text-zinc-500">DAILY QUEST</div>
          <div className="mt-1 text-3xl font-black text-emerald-300">{done}/{dailyGoal}</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (done / dailyGoal) * 100)}%` }} /></div>
        </div>
      </div>

      {/* chapters */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/5 px-5 py-3.5 font-black">World Mastery</div>
        <div className="divide-y divide-white/5">
          {CHAPTERS.map((c) => {
            const sts = c.subtopics.map((s) => store.subs[key(c.num, s.id)]).filter(Boolean);
            const avg = sts.length ? Math.round(sts.reduce((a, s) => a + s!.m, 0) / c.subtopics.length) : 0;
            const att = sts.reduce((a, s) => a + s!.a, 0);
            return (
              <div key={c.num} className="flex items-center gap-4 px-5 py-4">
                <button onClick={() => onChapter(c.num)} className="text-2xl transition-transform hover:scale-110">{c.emoji}</button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold">{c.world}</span>
                    <span className="text-xs font-black" style={{ color: c.color }}>{avg}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, background: `linear-gradient(90deg, ${c.grad[0]}, ${c.grad[1]})` }} />
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-500">{att} attempts · {bankTotalOf(c).toLocaleString()}+ questions available</div>
                </div>
                <button onClick={() => onPractice(c.num)} className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold hover:bg-white/10">⚔️</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* weak spots */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/5 px-5 py-3.5 font-black">🎯 Weakest Spots — strike these next</div>
        {weak.length === 0 ? (
          <div className="px-5 py-6 text-sm text-zinc-500">No weak spots on record yet. Battle more questions — the radar is listening.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {weak.slice(0, 5).map((w) => (
              <div key={`${w.ch}-${w.sub}`} className="flex items-center gap-3 px-5 py-3.5">
                <span className="rounded-lg px-2 py-1 text-[10px] font-black" style={{ background: `${w.color}22`, color: w.color }}>{w.world}</span>
                <span className="flex-1 truncate text-sm">{w.title}</span>
                <span className="text-xs font-black text-rose-300">{Math.round(w.m)}%</span>
                <button onClick={() => onPractice(w.ch, w.sub)} className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold hover:bg-white/10">Train</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* badges */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="font-black">🏅 Badges</div>
        <div className="mt-4 flex flex-wrap gap-3">
          {badgeList.length === 0 && <span className="text-sm text-zinc-500">Your legend starts with the first question. Earn XP, slay bosses — this hall fills itself.</span>}
          {badgeList.map((b) => (
            <div key={b.id} className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-200">
              <span className="text-xl">{b.e}</span> {b.t}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => { if (confirm("Reset ALL progress? This cannot be undone.")) store.resetAll(); }}
        className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/20"
      >
        Reset all progress
      </button>
    </div>
  );
}
