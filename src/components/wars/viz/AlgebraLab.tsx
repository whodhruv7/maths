"use client";
import { useState } from "react";

// ── Algebra Lab (Ch 4) · interactive SVG area models for the identities ─────
type Mode = "plus" | "minus" | "diff" | "xplus" | "mental";

const GOLD = "#f59e0b", SKY = "#38bdf8", EM = "#34d399", ROSE = "#fb7185", MUT = "#94a3b8";
const chipC = "rounded-lg border border-white/10 bg-white/5 px-2.5 py-1";
const fmt = (v: number) => String(Math.round(v * 100) / 100).replace("-0", "0");

const MODES: { id: Mode; label: string }[] = [
  { id: "plus", label: "(a + b)²" },
  { id: "minus", label: "(a − b)²" },
  { id: "diff", label: "(a + b)(a − b)" },
  { id: "xplus", label: "(x + a)(x + b)" },
  { id: "mental", label: "mental maths ✨" },
];

function Tile({ x, y, w, h, fill, label, value, op = 1, dashed, stroke }: {
  x: number; y: number; w: number; h: number; fill: string;
  label?: string; value?: string; op?: number; dashed?: boolean; stroke?: string;
}) {
  const fs = Math.max(8.5, Math.min(12.5, w / 5.5, h / 4.2));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} fillOpacity={op} stroke={stroke ?? fill} strokeOpacity={0.85} strokeWidth={1.2} strokeDasharray={dashed ? "5 4" : undefined} rx={2} />
      {label && <text x={x + w / 2} y={y + h / 2 + (value ? -2 : fs / 3)} textAnchor="middle" fill="#ffffff" fillOpacity={0.95} fontSize={fs} fontWeight={800}>{label}</text>}
      {value && <text x={x + w / 2} y={y + h / 2 + fs + 1} textAnchor="middle" fill="#ffffff" fillOpacity={0.62} fontSize={fs - 0.5}>{value}</text>}
    </g>
  );
}

export default function AlgebraLab({ config }: { config?: Record<string, unknown> }) {
  const cm: unknown = config?.mode;
  const [mode, setMode] = useState<Mode>(
    typeof cm === "string" && MODES.some((m) => m.id === cm) ? (cm as Mode) : "plus"
  );
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [x, setX] = useState(4);
  const hi = Math.max(a, b), lo = Math.min(a, b);
  const OX = 60, OY = 72, M = 290;

  const hdim = (x1: number, x2: number, y: number, t: string, c = MUT) => (
    <text x={(x1 + x2) / 2} y={y} textAnchor="middle" fill={c} fontSize={11} fontWeight={700}>{t}</text>
  );
  const vdim = (y1: number, y2: number, cx: number, t: string, c = MUT) => (
    <text transform={`rotate(-90 ${cx} ${(y1 + y2) / 2})`} x={cx} y={(y1 + y2) / 2} textAnchor="middle" fill={c} fontSize={11} fontWeight={700}>{t}</text>
  );
  const bracket = (x1: number, x2: number, y: number, t: string, c = ROSE) => (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeOpacity={0.45} />
      <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={c} strokeOpacity={0.45} />
      <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={c} strokeOpacity={0.45} />
      <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle" fill={c} fontSize={11} fontWeight={800}>{t}</text>
    </g>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0e22] p-4">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Algebra Lab · area models of identities</p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}
            className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${mode === m.id ? "bg-rose-400/20 text-rose-300 ring-1 ring-rose-400/60" : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:text-zinc-200"}`}>
            {m.label}
          </button>
        ))}
        <button onClick={() => { setA(3); setB(2); setX(4); }} aria-label="reset sliders to defaults"
          className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-zinc-400 ring-1 ring-white/10 hover:text-rose-300">↺</button>
      </div>

      <svg viewBox="0 0 420 400" role="img" aria-label={`Area model for ${MODES.find((m) => m.id === mode)?.label}`}
        className="mx-auto mt-2 w-full max-w-[560px] rounded-xl">
        <defs>
          <radialGradient id="ag" cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#101736" />
            <stop offset="100%" stopColor="#0a0e22" />
          </radialGradient>
        </defs>
        <rect width={420} height={400} fill="url(#ag)" rx={12} />

        {mode === "plus" && (() => {
          const U = M / (a + b), aU = a * U, bU = b * U;
          return (
            <>
              <Tile x={OX} y={OY} w={aU} h={aU} fill={GOLD} op={0.32} label="a²" value={`= ${fmt(a * a)}`} />
              <Tile x={OX + aU} y={OY} w={bU} h={aU} fill={SKY} op={0.3} label="ab" value={`= ${fmt(a * b)}`} />
              <Tile x={OX} y={OY + aU} w={aU} h={bU} fill={SKY} op={0.3} label="ab" value={`= ${fmt(a * b)}`} />
              <Tile x={OX + aU} y={OY + aU} w={bU} h={bU} fill={EM} op={0.3} label="b²" value={`= ${fmt(b * b)}`} />
              {hdim(OX, OX + aU, OY - 9, `a = ${fmt(a)}`, "#fbbf24")}
              {hdim(OX + aU, OX + M, OY - 9, `b = ${fmt(b)}`, "#7dd3fc")}
              {vdim(OY, OY + aU, OX - 12, `a = ${fmt(a)}`, "#fbbf24")}
              {vdim(OY + aU, OY + M, OX - 12, `b = ${fmt(b)}`, "#7dd3fc")}
              {bracket(OX, OX + M, OY - 40, `side = a + b = ${fmt(a + b)}`)}
            </>
          );
        })()}

        {mode === "minus" && (() => {
          const U = M / hi, lU = lo * U, rU = (hi - lo) * U;
          return rU < 2 ? (
            <>
              <Tile x={OX} y={OY} w={M} h={M} fill={ROSE} op={0.4} dashed stroke={ROSE} label="a = b" value="the strips remove everything" />
              <text x={210} y={OY + M + 24} textAnchor="middle" fill={GOLD} fontSize={11} fontWeight={700}>(a − b)² = 0 — the square disappears!</text>
            </>
          ) : (
            <>
              <Tile x={OX} y={OY} w={M} h={lU} fill={SKY} op={0.16} dashed label="ab strip — removed" value={`= ${fmt(hi * lo)}`} />
              <Tile x={OX + rU} y={OY} w={lU} h={M} fill={SKY} op={0.16} dashed />
              <Tile x={OX + rU} y={OY} w={lU} h={lU} fill={ROSE} op={0.45} dashed stroke={ROSE} label={`b² = ${fmt(lo * lo)}`} />
              <Tile x={OX} y={OY + lU} w={rU} h={rU} fill={GOLD} op={0.32} label="(a−b)²" value={`= ${fmt(rU * rU / (U * U))}`} />
              {bracket(OX, OX + M, OY - 40, `side a = ${fmt(hi)}`)}
              {hdim(OX, OX + rU, OY - 9, `${fmt(hi - lo)}`, "#fbbf24")}
              {vdim(OY + lU, OY + M, OX - 12, `a − b = ${fmt(hi - lo)}`, "#fbbf24")}
              {vdim(OY, OY + lU, OX - 12, `cut b = ${fmt(lo)}`, "#7dd3fc")}
              <text x={210} y={390} textAnchor="middle" fill={ROSE} fontSize={10} fontWeight={700}>⚠ strips overlap at the b² corner — subtracted twice, add b² back once</text>
            </>
          );
        })()}

        {mode === "diff" && (() => {
          const SQ = 132, Y0 = 118, lU = lo * (SQ / hi);
          const rh = (hi - lo) * (SQ / (hi + lo));
          const X2 = OX + SQ + 62, Y2 = Y0 + (SQ - rh) / 2, big = rh >= 26;
          return (
            <>
              <Tile x={OX} y={Y0} w={SQ} h={SQ} fill={GOLD} op={0.3} label="a² square" value={`= ${fmt(hi * hi)}`} />
              <Tile x={OX + SQ - lU} y={Y0} w={lU} h={lU} fill={ROSE} op={0.4} dashed stroke={ROSE} label={lU > 30 ? "b² cut" : undefined} value={lU > 30 ? fmt(lo * lo) : undefined} />
              <text x={OX + SQ + 31} y={Y0 + SQ / 2 + 6} textAnchor="middle" fill={ROSE} fontSize={24} fontWeight={800}>=</text>
              <Tile x={X2} y={Y2} w={SQ} h={rh} fill={SKY} op={0.28} label={big ? "(a + b)(a − b)" : undefined} value={big ? `= ${fmt((hi + lo) * (hi - lo))}` : undefined} />
              {!big && <text x={X2 + SQ / 2} y={Y2 + rh / 2 + 4} textAnchor="middle" fill="#ffffff" fontSize={10} fontWeight={700}>a − b = 0 → flat rectangle!</text>}
              {hdim(OX, OX + SQ, Y0 - 9, `a = ${fmt(hi)}`, "#fbbf24")}
              {hdim(X2, X2 + SQ, Y2 - 9, `a + b = ${fmt(hi + lo)}`, "#7dd3fc")}
              {vdim(Y2, Y2 + rh, 396, `a − b = ${fmt(hi - lo)}`, EM)}
            </>
          );
        })()}

        {mode === "xplus" && (() => {
          const U = M / (x + hi), xU = x * U, aU = a * U, bU = b * U, W = (x + a) * U, H = (x + b) * U;
          return (
            <>
              <Tile x={OX} y={OY} w={xU} h={xU} fill={GOLD} op={0.32} label="x²" value={`= ${fmt(x * x)}`} />
              <Tile x={OX + xU} y={OY} w={aU} h={xU} fill={SKY} op={0.3} label="ax" value={`= ${fmt(a * x)}`} />
              <Tile x={OX} y={OY + xU} w={xU} h={bU} fill={SKY} op={0.3} label="bx" value={`= ${fmt(b * x)}`} />
              <Tile x={OX + xU} y={OY + xU} w={aU} h={bU} fill={EM} op={0.3} label="ab" value={`= ${fmt(a * b)}`} />
              {hdim(OX, OX + xU, OY - 9, `x = ${fmt(x)}`, ROSE)}
              {hdim(OX + xU, OX + W, OY - 9, `a = ${fmt(a)}`, "#fbbf24")}
              {vdim(OY, OY + xU, OX - 12, `x = ${fmt(x)}`, ROSE)}
              {vdim(OY + xU, OY + H, OX - 12, `b = ${fmt(b)}`, "#7dd3fc")}
              {bracket(OX, OX + W, OY - 40, `width = x + a = ${fmt(x + a)}`)}
            </>
          );
        })()}

        {mode === "mental" && (() => {
          const ticks: [number, number][] = [[47, 100], [50, 200], [53, 300]];
          return (
            <>
              <text x={210} y={64} textAnchor="middle" fill={MUT} fontSize={11}>47 and 53 sit 3 away from 50, on both sides</text>
              <line x1={80} y1={112} x2={340} y2={112} stroke={MUT} strokeOpacity={0.5} strokeWidth={1.5} />
              {ticks.map(([v, tx]) => (
                <g key={v}>
                  <line x1={tx} y1={106} x2={tx} y2={118} stroke={MUT} strokeWidth={1.5} />
                  <text x={tx} y={134} textAnchor="middle" fill="#ffffff" fillOpacity={0.85} fontSize={12} fontWeight={700}>{v}</text>
                </g>
              ))}
              <text x={150} y={100} textAnchor="middle" fill={ROSE} fontSize={11} fontWeight={800}>− 3</text>
              <text x={250} y={100} textAnchor="middle" fill={ROSE} fontSize={11} fontWeight={800}>+ 3</text>
              <text x={210} y={206} textAnchor="middle" fill="#ffffff" fontSize={17} fontWeight={800}>47 × 53 = (50 − 3)(50 + 3)</text>
              <text x={210} y={240} textAnchor="middle" fill={SKY} fontSize={15} fontWeight={700}>= 50² − 3²  ← (a + b)(a − b) = a² − b²</text>
              <text x={210} y={272} textAnchor="middle" fill={SKY} fontSize={15} fontWeight={700}>= 2500 − 9</text>
              <text x={210} y={312} textAnchor="middle" fill={EM} fontSize={21} fontWeight={800}>= 2441 ✓</text>
            </>
          );
        })()}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        {mode === "plus" && (
          <>
            <span className={chipC}>(a + b)² = a² + 2ab + b²</span>
            <span className={chipC}>({fmt(a)} + {fmt(b)})² = {fmt(a + b)}² = <b className="text-rose-300">{fmt((a + b) ** 2)}</b></span>
            <span className={chipC}>a² + 2ab + b² → <b className="text-amber-300">{fmt(a * a)}</b> + <b className="text-sky-300">{fmt(2 * a * b)}</b> + <b className="text-emerald-300">{fmt(b * b)}</b> = <b className="text-rose-300">{fmt((a + b) ** 2)}</b></span>
          </>
        )}
        {mode === "minus" && (
          <>
            <span className={chipC}>a² − 2ab + b² = (a − b)²</span>
            <span className={chipC}>{fmt(hi * hi)} − 2·{fmt(hi)}·{fmt(lo)} + {fmt(lo * lo)} = <b className="text-rose-300">{fmt((hi - lo) ** 2)}</b> = ({fmt(hi)} − {fmt(lo)})²</span>
            {a < b && <span className={chipC}>b is bigger here — shown with the larger value as a</span>}
          </>
        )}
        {mode === "diff" && (
          <>
            <span className={chipC}>(a + b)(a − b) = a² − b²</span>
            <span className={chipC}>({fmt(hi + lo)}) × ({fmt(hi - lo)}) = <b className="text-sky-300">{fmt((hi + lo) * (hi - lo))}</b></span>
            <span className={chipC}>{fmt(hi * hi)} − {fmt(lo * lo)} = <b className="text-rose-300">{fmt(hi * hi - lo * lo)}</b></span>
            {a < b && <span className={chipC}>b is bigger here — shown with the larger value as a</span>}
          </>
        )}
        {mode === "xplus" && (
          <>
            <span className={chipC}>(x + a)(x + b) = x² + (a + b)x + ab</span>
            <span className={chipC}>({fmt(x)} + {fmt(a)})({fmt(x)} + {fmt(b)}) = {fmt(x + a)} × {fmt(x + b)} = <b className="text-rose-300">{fmt((x + a) * (x + b))}</b></span>
            <span className={chipC}>x² + (a + b)x + ab → {fmt(x * x)} + {fmt((a + b) * x)} + {fmt(a * b)} = <b className="text-rose-300">{fmt(x * x + (a + b) * x + a * b)}</b></span>
          </>
        )}
        {mode === "mental" && (
          <>
            <span className={chipC}>47 = 50 − 3 · 53 = 50 + 3</span>
            <span className={chipC}>50² − 3² = 2500 − 9 = <b className="text-emerald-300">2441</b></span>
            <span className={chipC}>same trick: 98 × 102 = 100² − 2² = <b className="text-emerald-300">9996</b></span>
          </>
        )}
      </div>

      <p className="mt-2 text-center text-[11px] text-zinc-500">
        {mode === "plus" ? "The big square of side (a + b) splits into a², two ab strips and b² — slide a and b, every tile updates."
          : mode === "minus" ? "An ab strip is cut off the top and the side — the corner square is claimed twice, so b² is added back."
          : mode === "diff" ? "Cut b² off the a² square; the L-shape rearranges into a (a + b) × (a − b) rectangle of equal area."
          : mode === "xplus" ? "The rectangle splits into x², ax, bx, ab — the two strips merge into the middle term (a + b)x."
          : "Numbers equally far from a round number form (n − k)(n + k) = n² − k² — mental maths, no pen!"}
      </p>
    </div>
  );
}
