"use client";
import { useMemo, useState } from "react";
import type { ChapterContent, Question } from "@/lib/wars/types";
import { checkAnswer, pickQuestion } from "@/lib/wars/engine";
import { useWars, key } from "@/lib/wars/store";
import { Rich } from "./rich";
import SolutionDeck from "./SolutionDeck";

const SIZE = 6;

export default function BossView({ ch, onExit }: { ch: ChapterContent; onExit: () => void }) {
  const store = useWars();
  const avgMastery = useMemo(() => {
    const ms = ch.subtopics.map((s) => store.subs[key(ch.num, s.id)]?.m ?? 0);
    return ms.reduce((a, b) => a + b, 0) / ms.length;
  }, [ch, store.subs]);
  const unlocked = avgMastery >= 55;

  const [phase, setPhase] = useState<"intro" | "run" | "done">("intro");
  const [qs, setQs] = useState<Question[]>([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [txt, setTxt] = useState("");
  const [deck, setDeck] = useState(false);

  const start = () => {
    const list: Question[] = [];
    for (let k = 0; k < SIZE; k++) {
      const q = pickQuestion(ch, { diff: Math.random() < 0.6 ? 4 : 3 });
      if (q) list.push(q);
    }
    setQs(list); setQi(0); setScore(0); setPicked(null); setTxt(""); setDeck(false); setPhase("run");
  };

  const q = qs[qi];

  const answer = (val: string) => {
    if (!q || picked !== null) return;
    const ok = checkAnswer(q, val).ok;
    store.record(ch.num, q.sub, ok, q.diff);
    setPicked(val);
    if (ok) setScore((s) => s + 1);
  };

  const advance = () => {
    if (qi + 1 >= qs.length) {
      if (score >= SIZE - 1) store.addBoss(ch.num);
      setPhase("done");
    } else { setQi((i) => i + 1); setPicked(null); setTxt(""); setDeck(false); }
  };

  if (!unlocked) {
    const weakSubs = ch.subtopics
      .map((s) => ({ title: s.title, m: store.subs[key(ch.num, s.id)]?.m ?? 0 }))
      .sort((a, b) => a.m - b.m)
      .slice(0, 3);
    const need = Math.max(0, Math.ceil(55 - avgMastery));
    return (
      <div>
        <button onClick={onExit} className="mb-4 text-sm text-zinc-400 hover:text-amber-300">← {ch.world}</button>
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-amber-400/[0.05] p-8 sm:p-10 text-center">
          <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(600px 220px at 50% 0%, ${ch.grad[0]}18, transparent 70%)` }} />
          <div className="relative">
            <div className="text-6xl drop-shadow-[0_0_18px_rgba(251,191,36,0.35)]">🔒</div>
            <div className="mt-3 text-[10px] font-black tracking-[0.3em] text-amber-300/80">GATE SEALED · {Math.round(avgMastery)}% / 55%</div>
            <h2 className="mt-2 text-2xl font-black">The seal holds… for now</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">{ch.boss.desc}</p>
            <p className="mx-auto mt-4 max-w-md text-sm text-zinc-300">
              This gate isn&apos;t a wall — it&apos;s a checkpoint. Reach <b className="text-amber-300">55% average mastery</b> and the seal shatters. You&apos;re only <b style={{ color: ch.color }}>{need}%</b> away.
            </p>
            <div className="mx-auto mt-4 h-2.5 max-w-sm overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (avgMastery / 55) * 100)}%`, background: `linear-gradient(90deg, ${ch.grad[0]}, ${ch.grad[1]})` }} />
            </div>
            {weakSubs.length > 0 && (
              <div className="mx-auto mt-6 max-w-sm text-left">
                <div className="text-[10px] font-black tracking-[0.2em] text-zinc-500">YOUR TRAINING PATH — STRIKE THE WEAKEST FIRST</div>
                <div className="mt-2 space-y-1.5">
                  {weakSubs.map((w) => (
                    <div key={w.title} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <span className="flex-1 truncate text-xs text-zinc-300">🎯 {w.title}</span>
                      <span className="text-xs font-black text-rose-300">{Math.round(w.m)}%</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-500">Every Arena question on these raises the seal-meter. Train, return, break through. ⚔️</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div>
        <button onClick={onExit} className="mb-4 text-sm text-zinc-400 hover:text-amber-300">← {ch.world}</button>
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-400/[0.08] to-transparent p-8 sm:p-10 text-center">
          <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(520px 200px at 50% 0%, ${ch.grad[1]}22, transparent 70%)` }} />
          <div className="relative">
            <div className="text-[10px] font-black tracking-[0.35em] text-amber-300/80">⚔️ BOSS ENCOUNTER ⚔️</div>
            <div className="relative mx-auto mt-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/40 bg-[#0a0e22] text-4xl">👑</div>
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">{ch.boss.title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">{ch.boss.desc}</p>
            <div className="mx-auto mt-6 grid max-w-md gap-2 text-left sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                <div className="text-lg font-black text-amber-300">{SIZE}</div>
                <div className="text-[10px] text-zinc-500">rounds · adv + challenge only</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                <div className="text-lg font-black text-emerald-300">{SIZE - 1}/{SIZE}</div>
                <div className="text-[10px] text-zinc-500">to slay & claim the crest</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                <div className="text-lg">📓</div>
                <div className="text-[10px] text-zinc-500">paper & pen strongly advised</div>
              </div>
            </div>
            <button onClick={start} className="mt-7 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-3.5 text-lg font-black text-zinc-950 shadow-xl shadow-orange-500/25 hover:scale-[1.03] active:scale-95 transition-transform">Begin the Gauntlet ⚔️</button>
            {store.bossDone.includes(String(ch.num)) && <div className="mt-4 text-sm font-bold text-emerald-300">👑 Already slain — replay for glory</div>}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const won = score >= SIZE - 1;
    return (
      <div className={`rounded-3xl border p-10 text-center ${won ? "border-emerald-400/40 bg-emerald-400/[0.07]" : "border-rose-400/30 bg-rose-400/[0.05]"}`}>
        <div className="text-7xl">{won ? "🏆" : "🛡️"}</div>
        <h2 className={`mt-4 text-3xl font-black ${won ? "text-emerald-300" : "text-rose-300"}`}>{won ? "BOSS SLAYED!" : "The boss holds…"}</h2>
        <p className="mt-2 text-sm text-zinc-300">Final score: <b className="text-lg">{score} / {qs.length}</b></p>
        {won ? (
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">The <b style={{ color: ch.color }}>{ch.world}</b> crest is yours. Every concept in this realm bows to you now.</p>
        ) : (
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">So close! Review the solution decks from your misses, train the weak subtopics, and come back sharper.</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={start} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-black text-zinc-950">Fight Again ⚔️</button>
          <button onClick={onExit} className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-bold hover:bg-white/10">Back to World</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-black text-amber-300">👑 {ch.boss.title}</span>
        <span className="text-xs text-zinc-400">Round {qi + 1}/{qs.length} · Score {score}</span>
      </div>
      <div className="mb-4 flex gap-1">
        {qs.map((_, k) => <div key={k} className={`h-1.5 flex-1 rounded-full ${k < qi ? "bg-amber-400" : k === qi ? "bg-amber-400/50" : "bg-white/10"}`} />)}
      </div>
      {q && (
        <div className="overflow-hidden rounded-3xl border border-amber-400/25 bg-white/[0.03]">
          <div className="p-5 sm:p-6">
            <div className="text-lg leading-relaxed"><Rich text={q.text} /></div>
            <div className="mt-5">
              {q.type === "mcq" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.choices!.map((c) => {
                    const isAns = picked !== null && c === q.answer;
                    const isPick = picked === c;
                    let cls = "border-white/10 bg-white/[0.04] hover:border-amber-400/50";
                    if (picked !== null && isAns) cls = "border-emerald-400/60 bg-emerald-400/15";
                    else if (isPick) cls = "border-rose-400/60 bg-rose-400/15";
                    return <button key={c} disabled={picked !== null} onClick={() => answer(c)} className={`rounded-xl border px-4 py-3 text-left text-sm ${cls}`}><Rich text={c} /></button>;
                  })}
                </div>
              ) : q.type === "tf" ? (
                <div className="flex gap-3">
                  {["True", "False"].map((t) => {
                    const isAns = picked !== null && t.toLowerCase() === q.answer.toLowerCase();
                    const isPick = picked?.toLowerCase() === t.toLowerCase();
                    let cls = "border-white/10 bg-white/[0.04] hover:border-amber-400/50";
                    if (picked !== null && isAns) cls = "border-emerald-400/60 bg-emerald-400/15";
                    else if (isPick) cls = "border-rose-400/60 bg-rose-400/15";
                    return <button key={t} disabled={picked !== null} onClick={() => answer(t)} className={`flex-1 rounded-xl border px-4 py-3 font-bold ${cls}`}>{t}</button>;
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input value={txt} disabled={picked !== null} onChange={(e) => setTxt(e.target.value)} placeholder="Type your final answer" aria-label="Type your final answer" className="flex-1 rounded-xl border border-white/15 bg-[#0a0e22] px-4 py-3 outline-none placeholder:text-zinc-600 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20" onKeyDown={(e) => { if (e.key === "Enter" && txt.trim()) answer(txt); }} />
                  <button onClick={() => txt.trim() && answer(txt)} disabled={picked !== null || !txt.trim()} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 font-black text-zinc-950 disabled:opacity-40">Strike ⚔️</button>
                </div>
              )}
            </div>
            {picked !== null && (
              <div className="mt-4">
                <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${checkAnswer(q, picked).ok ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-rose-400/40 bg-rose-400/10 text-rose-300"}`}>
                  {checkAnswer(q, picked).ok ? "✅ Direct hit!" : `❌ The answer was: ${q.answer}`}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={advance} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-black text-zinc-950">{qi + 1 >= qs.length ? "See Result →" : "Next Round →"}</button>
                  <button onClick={() => setDeck((d) => !d)} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold hover:bg-white/10">{deck ? "Hide" : "🎬"} Solution</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {deck && q && <SolutionDeck q={q} />}
    </div>
  );
}
