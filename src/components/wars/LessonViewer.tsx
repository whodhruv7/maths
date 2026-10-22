"use client";
import { useState } from "react";
import type { ChapterContent, Slide } from "@/lib/wars/types";
import { useWars, key } from "@/lib/wars/store";
import { Rich } from "./rich";
import VizFrame from "./viz/VizFrame";

function ChoiceSlide({ s, chColor }: { s: Extract<Slide, { k: "predict" | "check" }>; chColor: string }) {
  const [pick, setPick] = useState<number | null>(null);
  const done = pick !== null;
  return (
    <div>
      <div className="break-words text-lg leading-relaxed text-zinc-100"><Rich text={s.body} /></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {s.options.map((o, i) => {
          const isCorrect = i === s.correct;
          const chosen = pick === i;
          let cls = "border-white/10 bg-white/[0.04] hover:border-amber-400/50 hover:bg-amber-400/10";
          if (done && isCorrect) cls = "border-emerald-400/60 bg-emerald-400/15 text-emerald-200";
          else if (done && chosen) cls = "border-rose-400/60 bg-rose-400/15 text-rose-200";
          else if (done) cls = "border-white/5 bg-transparent text-zinc-500";
          return (
            <button key={i} disabled={done} onClick={() => setPick(i)} className={`flex min-h-[44px] items-center break-words rounded-xl border px-4 py-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${cls}`}>
              <Rich text={o} />
              {done && isCorrect && <span className="ml-2 font-black">✓</span>}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="mt-3 break-words rounded-xl border px-4 py-3 text-sm" style={{ borderColor: `${chColor}44`, background: `${chColor}11` }}>
          <b style={{ color: chColor }}>Why: </b><Rich text={s.why} />
        </div>
      )}
    </div>
  );
}

export default function LessonViewer({ ch, subId, onBack, onPractice }: { ch: ChapterContent; subId: string; onBack: () => void; onPractice: () => void }) {
  const sub = ch.subtopics.find((s) => s.id === subId)!;
  const [i, setI] = useState(0);
  const store = useWars();
  const st = store.subs[key(ch.num, sub.id)];
  const s = sub.slides[i];
  const last = i === sub.slides.length - 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} className="-mx-2 inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm text-zinc-400 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">← {ch.world}</button>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{ch.emoji} {sub.title}</span>
          {(st?.m ?? 0) > 0 && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1" style={{ color: ch.color }}>{Math.round(st!.m)}% mastery</span>}
        </div>
      </div>

      {/* progress dots — 44px tap targets, visual bar unchanged */}
      <div className="-my-3 mb-5 flex items-center gap-1.5">
        {sub.slides.map((_, k) => (
          <button key={k} onClick={() => setI(k)} className="flex min-h-[44px] flex-1 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60" style={k <= i ? { color: ch.color } : undefined} aria-label={`Go to slide ${k + 1} of ${sub.slides.length}`} aria-current={k === i ? "step" : undefined}>
            <span className={`h-1.5 w-full rounded-full transition-all ${k <= i ? "bg-current" : "bg-white/10"}`} />
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase" style={{ color: ch.color }}>
          <span className="rounded-md px-2 py-0.5" style={{ background: `${ch.color}1f` }}>{s.k}</span>
          {s.title}
        </div>

        {s.k === "hook" && <div className="break-words text-lg leading-relaxed text-zinc-100"><Rich text={s.body} /></div>}

        {s.k === "explore" && (
          <>
            <div className="mb-1 text-zinc-300"><Rich text={s.body} /></div>
            <VizFrame kind={sub.viz?.kind} config={sub.viz?.config} />
          </>
        )}

        {(s.k === "predict" || s.k === "check") && <ChoiceSlide s={s} chColor={ch.color} />}

        {s.k === "explain" && <div className="break-words text-[15px] leading-[1.85] text-zinc-200"><Rich text={s.html} /></div>}

        {s.k === "example" && (
          <ol className="space-y-2.5">
            {s.steps.map((t, k) => (
              <li key={k} className="flex break-words gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black" style={{ background: `${ch.color}33`, color: ch.color }}>{k + 1}</span>
                <Rich text={t} />
              </li>
            ))}
          </ol>
        )}

        {s.k === "mistake" && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] p-5">
            <div className="text-lg leading-relaxed text-rose-100"><Rich text={s.body} /></div>
          </div>
        )}

        {/* objectives shown on first slide */}
        {i === 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] font-black tracking-[0.2em] text-zinc-400">BY THE END YOU WILL…</div>
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {sub.objectives.map((o, k) => <li key={k}>✦ <Rich text={o} /></li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0b0f24]/90 p-2.5 backdrop-blur lg:bottom-4">
        <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold disabled:opacity-30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">‹ Back</button>
        {last ? (
          <div className="flex flex-wrap gap-2">
            <button onClick={onPractice} className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-black text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80" style={{ background: `linear-gradient(135deg, ${ch.grad[0]}, ${ch.grad[1]})` }}>⚔️ Practice this subtopic</button>
            <button onClick={onBack} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">Finish ✓</button>
          </div>
        ) : (
          <button onClick={() => setI((v) => v + 1)} className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-2.5 text-sm font-black text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80" style={{ background: `linear-gradient(135deg, ${ch.grad[0]}, ${ch.grad[1]})` }}>Next ›</button>
        )}
      </div>
    </div>
  );
}
