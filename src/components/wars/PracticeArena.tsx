"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChapterContent, Diff, Question } from "@/lib/wars/types";
import { checkAnswer, pickQuestion } from "@/lib/wars/engine";
import { useWars, key } from "@/lib/wars/store";
import { Rich } from "./rich";
import SolutionDeck from "./SolutionDeck";

const DIFF_LABEL: Record<Diff, string> = { 1: "Foundation", 2: "Core", 3: "Advanced", 4: "Challenge" };
const DIFF_COLOR: Record<Diff, string> = { 1: "#34d399", 2: "#38bdf8", 3: "#fbbf24", 4: "#fb7185" };

export default function PracticeArena({ chapters, chNum, sub, onExit }: { chapters: ChapterContent[]; chNum?: number; sub?: string; onExit?: () => void }) {
  const store = useWars();
  const [q, setQ] = useState<Question | null>(null);
  const [ch, setCh] = useState<ChapterContent | null>(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "revealed">("idle");
  const [hints, setHints] = useState(0);
  const [deck, setDeck] = useState(false);
  const [streak, setStreak] = useState(0);
  const [tally, setTally] = useState({ n: 0, c: 0 });
  const [flash, setFlash] = useState<{ msg: string; id: number } | null>(null);
  const recent = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const weakestSub = useCallback((c: ChapterContent): string | undefined => {
    let worst: string | undefined; let m = Infinity;
    for (const s of c.subtopics) {
      const st = store.subs[key(c.num, s.id)];
      const v = st ? st.m + (st.a > 0 ? 0 : -15) : -15; // unvisited first
      if (s.gens.length && v < m) { m = v; worst = s.id; }
    }
    return worst;
  }, [store.subs]);

  const next = useCallback(() => {
    const c = chNum ? chapters.find((x) => x.num === chNum)! : chapters[Math.floor(Math.random() * chapters.length)];
    // adaptive: 35% weakest subtopic, else given sub or random
    let subId = sub;
    if (!subId && Math.random() < 0.35) subId = weakestSub(c);
    if (!subId) {
      const pool = c.subtopics.filter((s) => s.gens.length > 0);
      subId = pool[Math.floor(Math.random() * pool.length)]?.id;
    }
    const nq = pickQuestion(c, { sub: subId, diff: "mixed", avoid: recent.current }) ?? pickQuestion(c, { diff: "mixed" });
    if (!nq) return;
    recent.current.add(nq.id);
    if (recent.current.size > 60) { const first = recent.current.values().next().value; if (first) recent.current.delete(first); }
    setCh(c); setQ(nq); setInput(""); setStatus("idle"); setHints(0); setDeck(false);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [chapters, chNum, sub, weakestSub]);

  useEffect(() => { next(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = (val?: string) => {
    if (!q || !ch) return;
    const ans = val ?? input;
    if (!ans.trim()) return;
    const res = checkAnswer(q, ans);
    const { gained } = store.record(ch.num, q.sub, res.ok, q.diff);
    setTally((t) => ({ n: t.n + 1, c: t.c + (res.ok ? 1 : 0) }));
    if (res.ok) {
      const s = streak + 1;
      setStreak(s);
      setFlash({ msg: `+${gained} XP${s >= 3 ? ` · 🔥 ${s} streak!` : ""}${q.diff >= 3 ? " · tough one down!" : ""}`, id: Date.now() });
      setStatus("correct");
    } else {
      setStreak(0);
      setStatus("wrong");
    }
  };

  const subLabel = ch && q ? ch.subtopics.find((s) => s.id === q.sub)?.title : "";

  if (!q || !ch) return <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-500">Forging a question…</div>;

  return (
    <div>
      {/* top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onExit && <button onClick={onExit} className="-mx-2 inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm text-zinc-400 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">← {chNum ? "World" : "Map"}</button>}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">{ch.emoji} {ch.world}{subLabel ? ` · ${subLabel}` : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">Session: {tally.c}/{tally.n}</span>
          {streak >= 2 && <span className="rounded-full bg-orange-500/15 border border-orange-400/30 px-3 py-1 font-bold text-orange-300">🔥 {streak} streak</span>}
        </div>
      </div>

      {/* question card */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-5 py-3 text-[11px]">
          <span className="rounded-md px-2 py-0.5 font-black" style={{ background: `${DIFF_COLOR[q.diff]}22`, color: DIFF_COLOR[q.diff] }}>{DIFF_LABEL[q.diff]}</span>
          <span className="text-zinc-400">{q.type === "mcq" ? "multiple choice" : q.type === "tf" ? "true / false" : q.type === "fill" ? "fill in" : "numeric"}</span>
          <span className="ml-auto text-zinc-400">Q · {q.gen}</span>
        </div>
        <div className="p-5 sm:p-6">
          {/* paper-first panel */}
          {status === "idle" && (
            <div className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200/90">
              📓 <b>Paper time!</b> Copy this into your notebook and solve it there first — like the real exam. Then enter your final answer here.
            </div>
          )}
          <div className="break-words text-lg leading-relaxed text-zinc-100"><Rich text={q.text} /></div>

          {/* answer zone */}
          <div className="mt-5">
            {q.type === "mcq" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {q.choices!.map((c) => (
                  <button key={c} disabled={status !== "idle"} onClick={() => submit(c)} className={`flex min-h-[44px] items-center break-words rounded-xl border px-4 py-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${status !== "idle" ? "opacity-60" : "border-white/10 bg-white/[0.04] hover:border-amber-400/50 hover:bg-amber-400/10"}`}>
                    <Rich text={c} />
                  </button>
                ))}
              </div>
            )}
            {q.type === "tf" && (
              <div className="flex gap-3">
                {["True", "False"].map((t) => (
                  <button key={t} disabled={status !== "idle"} onClick={() => submit(t)} className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl border px-4 py-3 font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${status !== "idle" ? "opacity-60" : "border-white/10 bg-white/[0.04] hover:border-amber-400/50 hover:bg-amber-400/10"}`}>{t}</button>
                ))}
              </div>
            )}
            {(q.type === "numeric" || q.type === "fill") && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  ref={inputRef}
                  value={input}
                  disabled={status !== "idle"}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={q.type === "numeric" ? "Your final answer (e.g. 12.5 or 3/4)" : "Type your answer"}
                  aria-label="Your answer"
                  className="min-h-[44px] flex-1 rounded-xl border border-white/15 bg-[#0a0e22] px-4 py-3 text-base outline-none placeholder:text-zinc-500 focus:border-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400/60"
                />
                <button onClick={() => submit()} disabled={status !== "idle" || !input.trim()} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-black text-zinc-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">Check ⚔️</button>
              </div>
            )}
          </div>

          {/* feedback */}
          {status === "correct" && (
            <div role="status" className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
              <div className="font-black text-emerald-300">✅ Correct! Sharpened like a true warrior.</div>
              <button onClick={next} className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-black text-zinc-950 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">Next Question →</button>
            </div>
          )}
          {status === "wrong" && (
            <div role="status" className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-4">
              <div className="font-black text-rose-300">❌ Not yet — this is where the learning happens.</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => { setStatus("idle"); setInput(""); }} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">🔄 Try Again</button>
                <button onClick={() => { setStatus("revealed"); setDeck(true); }} className="inline-flex min-h-[44px] items-center rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-black text-zinc-950 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">🎬 Show Solution</button>
                <button onClick={next} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">Skip →</button>
              </div>
            </div>
          )}

          {/* hints */}
          {status === "idle" && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {hints === 0 && <button onClick={() => setHints(1)} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">💡 Hint 1</button>}
              {hints === 1 && <div className="break-words rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-zinc-300"><Rich text={q.hint1} /></div>}
              {hints >= 1 && hints < 3 && <button onClick={() => setHints(3)} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">💡 Bigger hint</button>}
              {hints >= 3 && <div className="break-words rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-zinc-300"><Rich text={q.hint2} /></div>}
              <button onClick={() => { setStatus("revealed"); setDeck(true); }} className="ml-auto inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-zinc-400 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">Reveal solution</button>
            </div>
          )}
        </div>
      </div>

      {deck && <SolutionDeck q={q} />}
      {flash && status === "correct" && <div key={flash.id} role="status" aria-live="polite" className="mt-3 text-center text-sm font-bold text-amber-300">{flash.msg}</div>}
    </div>
  );
}
