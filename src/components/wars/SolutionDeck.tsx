"use client";
import { useState } from "react";
import type { Question } from "@/lib/wars/types";
import { Rich } from "./rich";

export default function SolutionDeck({ q }: { q: Question }) {
  const [i, setI] = useState(1); // revealed steps
  const n = q.steps.length;
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-sky-400/25 bg-sky-400/[0.04]">
      <div className="flex items-center justify-between border-b border-sky-400/20 px-4 py-2.5">
        <span className="text-sm font-black text-sky-300">🎬 Solution Deck</span>
        <span className="text-[10px] text-zinc-500">read it like a story — every step earns the next</span>
      </div>
      <div className="space-y-4 p-4">
        {q.given && q.given.length > 0 && (
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] text-zinc-500">GIVEN</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-zinc-300">
              {q.given.map((g, k) => <li key={k}><Rich text={g} /></li>)}
            </ul>
          </div>
        )}
        {q.find && (
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] text-zinc-500">FIND</div>
            <div className="mt-1 text-sm text-zinc-300"><Rich text={q.find} /></div>
          </div>
        )}
        <div>
          <div className="text-[10px] font-black tracking-[0.2em] text-zinc-500">CONCEPT</div>
          <div className="mt-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-amber-200"><Rich text={q.concept} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black tracking-[0.2em] text-zinc-500">STEP-BY-STEP</div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <button onClick={() => setI(0)} className="rounded-lg border border-white/10 px-2 py-1 text-zinc-400 hover:bg-white/10">↺ replay</button>
              <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} className="rounded-lg border border-white/10 px-2 py-1 text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">‹ prev</button>
              <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono tabular-nums text-zinc-400">Step {i}/{n}</span>
              <button onClick={() => setI((v) => Math.min(n, v + 1))} disabled={i === n} className="rounded-lg border border-white/10 px-2 py-1 text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">next ›</button>
              <button onClick={() => setI(n)} className="rounded-lg border border-white/10 px-2 py-1 text-zinc-400 hover:bg-white/10">all ⏭</button>
            </div>
          </div>
          <ol className="mt-2 space-y-2">
            {q.steps.map((s, k) => (
              <li key={k} className={`overflow-hidden rounded-xl border transition-all ${k < i ? "border-white/10 bg-white/[0.04]" : "border-white/5 bg-transparent"}`}>
                <div className={`flex gap-3 px-3 py-2.5 text-sm ${k < i ? "text-zinc-200" : "pointer-events-none select-none overflow-hidden blur-[4px] text-zinc-600"}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-400/20 text-[10px] font-black text-sky-300 ${k < i ? "" : "opacity-40"}`}>{k + 1}</span>
                  <Rich text={s} />
                </div>
              </li>
            ))}
          </ol>
          {i < n && <button onClick={() => setI((v) => v + 1)} className="mt-2 w-full rounded-xl bg-sky-400/15 py-2 text-xs font-bold text-sky-300 hover:bg-sky-400/25">Reveal step {i + 1} of {n} →</button>}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/[0.14] to-emerald-400/[0.04] px-4 py-4 shadow-[0_0_28px_rgba(52,211,153,0.16)]">
          <div className="text-[10px] font-black tracking-[0.2em] text-emerald-300">🏆 FINAL ANSWER</div>
          <div className="mt-1 text-xl font-black text-emerald-100 drop-shadow-[0_0_12px_rgba(52,211,153,0.35)]"><Rich text={q.answer} /></div>
        </div>
        {q.verify && (
          <div className="text-sm text-zinc-300"><span className="font-bold text-zinc-400">✅ Verify: </span><Rich text={q.verify} /></div>
        )}
        {q.mistake && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"><span className="font-black">⚠️ Common mistake: </span><Rich text={q.mistake} /></div>
        )}
        {q.remember && (
          <div className="text-sm text-zinc-300"><span className="font-bold text-amber-300">🧠 Remember: </span><Rich text={q.remember} /></div>
        )}
      </div>
    </div>
  );
}
