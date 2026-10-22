"use client";
// PatternLab — Sequences & Progressions (Ch 8) interactive lab.
// Four modes: AP Dots · GP Growth · Sierpinski · Virahanka(-Fibonacci). SVG + state, no deps.
import { useMemo, useState, type ReactNode } from "react";

const TEAL = "#2dd4bf", GOLD = "#f59e0b", PINK = "#f472b6";
const SUPD: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const SUBD: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
const sup = (k: number) => String(k).split("").map((c) => SUPD[c] ?? c).join("");
const sub = (k: number) => String(k).split("").map((c) => SUBD[c] ?? c).join("");

type Kind = "ap" | "gp" | "sier" | "vir";
const KINDS: { k: Kind; label: string }[] = [
  { k: "ap", label: "AP Dots" }, { k: "gp", label: "GP Growth" }, { k: "sier", label: "Sierpinski" }, { k: "vir", label: "Virahanka" },
];
const CAPTIONS: Record<Kind, string> = {
  ap: "Slide n and d — each row adds exactly d gold dots. That constant +d jump IS the arithmetic progression.",
  gp: "Each bar is r times the previous — doubling is explosive! GP growth smashes AP growth very, very fast.",
  sier: "Each shaded ▲ splits into 3 kept + 1 hole. Stage counts 1, 3, 9, 27, … form a GP with r = 3; side scale halves (1/2)ⁿ each stage while shaded area (3/4)ⁿ melts to 0.",
  vir: "A 1×n tiling ends in a square or a domino: Fₙ = Fₙ₋₁ + Fₙ₋₂ — the Virahanka–Fibonacci numbers 1, 2, 3, 5, 8, … appear!",
};

const on = "border-teal-300/60 bg-teal-400/15 text-teal-200";
const off = "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200";
const chip = "rounded-full border px-3 py-1 text-xs font-bold transition";
const tag = "rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs";

function Slider(p: { label: string; min: number; max: number; value: number; set: (v: number) => void; accent: string; color: string }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
      {p.label}
      <input type="range" min={p.min} max={p.max} step={1} value={p.value} aria-label={p.label} onChange={(e) => p.set(parseInt(e.target.value, 10))} className={`w-24 ${p.accent}`} />
      <b className="w-6 text-right" style={{ color: p.color }}>{p.value}</b>
    </label>
  );
}

const Defs = () => (
  <defs>
    <radialGradient id="plg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stopColor="#0e1533" />
      <stop offset="100%" stopColor="#0a0e22" />
    </radialGradient>
    <marker id="pla" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8 Z" fill={GOLD} />
    </marker>
  </defs>
);

const preview = (t: number[]) => (t.length > 5 ? `${t.slice(0, 4).join(", ")}, …, ${t[t.length - 1].toLocaleString("en-US")}` : t.map((v) => v.toLocaleString("en-US")).join(", "));

/* ─── AP Dots: rows a, a+d, a+2d… ; extra d dots in gold + "+d jump" arrows ── */
function ApView({ a, n, d }: { a: number; n: number; d: number }) {
  const W = 560, H = 244, X = 78;
  const terms = useMemo(() => Array.from({ length: n }, (_, i) => a + i * d), [a, n, d]);
  const sp = Math.min(15, (W - 104) / terms[n - 1]);
  const rowH = Math.min(19, (H - 16) / n);
  const yT = (H - n * rowH) / 2;
  const r = Math.min(3.4, sp / 2 - 0.5);
  const stair = terms.map((t, i) => `${X + t * sp},${yT + i * rowH + rowH / 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`AP dot pattern: ${n} rows starting at ${a} with common difference ${d}`} className="mx-auto w-full touch-none">
      <Defs />
      <rect width={W} height={H} fill="url(#plg)" rx={12} />
      {n > 1 && <polyline points={stair} fill="none" stroke={GOLD} strokeOpacity={0.6} strokeWidth={1.4} strokeDasharray="3 3" markerMid="url(#pla)" markerEnd="url(#pla)" />}
      {terms.map((t, i) => {
        const y = yT + i * rowH + rowH / 2;
        const prev = i > 0 ? terms[i - 1] : 0;
        return (
          <g key={i}>
            <text x={40} y={y + 3.5} fill="#94a3b8" fontSize={11} textAnchor="end">{t}</text>
            {Array.from({ length: t }, (_, j) => (
              <circle key={j} cx={X + j * sp + sp / 2} cy={y} r={r} fill={j >= prev ? GOLD : TEAL} fillOpacity={j >= prev ? 1 : 0.85} />
            ))}
            {i > 0 && <text x={X + t * sp + 7} y={y + 3.5} fill={GOLD} fontSize={10} fontWeight={800}>+{d}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── GP Growth: bars ×r each step, last bar gold ─────────────────────────── */
function GpView({ n, r }: { n: number; r: number }) {
  const W = 560, H = 244, base = 202, maxH = 156, a0 = 2;
  const terms = Array.from({ length: n }, (_, i) => a0 * Math.pow(r, i));
  const maxV = terms[n - 1];
  const slot = (W - 44) / n, bw = Math.min(46, slot * 0.62);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`GP growth bars: start ${a0}, ratio ${r}, ${n} terms`} className="mx-auto w-full touch-none">
      <Defs />
      <rect width={W} height={H} fill="url(#plg)" rx={12} />
      <line x1={18} y1={base} x2={W - 18} y2={base} stroke="#fff" strokeOpacity={0.18} strokeWidth={1.2} />
      {terms.map((v, i) => {
        const h = Math.max(4, (v / maxV) * maxH);
        const x = 22 + i * slot + (slot - bw) / 2;
        const last = i === n - 1;
        return (
          <g key={i}>
            {i > 0 && <text x={22 + i * slot} y={base + 15} fill={GOLD} fontSize={9.5} fontWeight={700} textAnchor="middle">×{r}</text>}
            <rect x={x} y={base - h} width={bw} height={h} rx={3} fill={last ? GOLD : TEAL} fillOpacity={last ? 0.95 : 0.28 + (n > 1 ? (0.55 * i) / (n - 1) : 0.55)} />
            <text x={x + bw / 2} y={base - h - 5} fill={last ? "#fbbf24" : "#99f6e4"} fontSize={last ? 10.5 : 9} fontWeight={last ? 800 : 600} textAnchor="middle">{v.toLocaleString("en-US")}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Sierpinski: recursive subdivision; newest holes pink, older gold ────── */
function SierView({ d }: { d: number }) {
  const W = 560, H = 244;
  const { kept, holes } = useMemo(() => {
    const kept: { p: string }[] = [], holes: { p: string; st: number }[] = [];
    const rec = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, dd: number, st: number) => {
      if (dd === 0) { kept.push({ p: `${x1},${y1} ${x2},${y2} ${x3},${y3}` }); return; }
      const ax = (x1 + x2) / 2, ay = (y1 + y2) / 2, bx = (x2 + x3) / 2, by = (y2 + y3) / 2, cx = (x3 + x1) / 2, cy = (y3 + y1) / 2;
      holes.push({ p: `${ax},${ay} ${bx},${by} ${cx},${cy}`, st });
      rec(x1, y1, ax, ay, cx, cy, dd - 1, st + 1);
      rec(ax, ay, x2, y2, bx, by, dd - 1, st + 1);
      rec(cx, cy, bx, by, x3, y3, dd - 1, st + 1);
    };
    rec(280, 26, 162, 230, 398, 230, d, 1);
    return { kept, holes };
  }, [d]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Sierpinski triangle stage ${d}: ${Math.pow(3, d)} shaded triangles and ${(Math.pow(3, d) - 1) / 2} holes`} className="mx-auto w-full touch-none">
      <Defs />
      <rect width={W} height={H} fill="url(#plg)" rx={12} />
      <polygon points="280,26 162,230 398,230" fill="none" stroke="#fff" strokeOpacity={0.12} />
      {holes.map((t, i) => <polygon key={`h${i}`} points={t.p} fill={t.st === d ? PINK : GOLD} fillOpacity={t.st === d ? 0.95 : 0.72} />)}
      {kept.map((t, i) => <polygon key={`k${i}`} points={t.p} fill={TEAL} fillOpacity={0.88} stroke="#0a0e22" strokeWidth={0.6} />)}
      <text x={280} y={241} fill="#94a3b8" fontSize={10} textAnchor="middle">stage {d}</text>
    </svg>
  );
}

/* ─── Virahanka: Fibonacci squares spiral + squares/dominoes tilings ──────── */
const virF = (k: number) => { let x = 1, y = 2; if (k <= 1) return 1; for (let i = 3; i <= k; i++) { const z = x + y; x = y; y = z; } return y; };
const tilings = (L: number): number[][] => {
  const out: number[][] = [];
  const rec = (rem: number, cur: number[]) => {
    if (rem === 0) { out.push(cur); return; }
    rec(rem - 1, [...cur, 1]);
    if (rem >= 2) rec(rem - 2, [...cur, 2]);
  };
  rec(L, []);
  return out;
};

function VirView({ n }: { n: number }) {
  const W = 560, H = 244, k = 11, tx = 69, ty = 118;
  const geo = useMemo(() => {
    const sizes = [1, 2, 3, 5, 8, 13], dirs = ["R", "D", "L", "U"] as const;
    const sqs: { x: number; y: number; s: number }[] = [{ x: 0, y: 0, s: 1 }];
    let x0 = 0, y0 = 0, x1 = 1, y1 = 1;
    for (let i = 1; i < 6; i++) {
      const s = sizes[i], dir = dirs[(i - 1) % 4];
      let x = 0, y = 0;
      if (dir === "R") { x = x1; y = y0; x1 += s; y1 = Math.max(y1, y + s); }
      else if (dir === "D") { x = x0; y = y1; y1 += s; }
      else if (dir === "L") { x = x0 - s; y = y1 - s; x0 -= s; }
      else { x = x1 - s; y = y0 - s; y0 -= s; }
      sqs.push({ x, y, s });
    }
    let px = 0, py = 1, path = "M 0 1"; // spiral arc: quarter circles, consistent winding
    for (const q of sqs) {
      const cs = [[q.x, q.y], [q.x + q.s, q.y], [q.x + q.s, q.y + q.s], [q.x, q.y + q.s]];
      const adj = cs.filter((c) => Math.abs(c[0] - px) + Math.abs(c[1] - py) === q.s);
      let hit = false;
      for (const O of adj) {
        const other = cs.find((c) => Math.abs(c[0] - O[0]) + Math.abs(c[1] - O[1]) === q.s && !(c[0] === px && c[1] === py));
        if (!other) continue;
        if ((px - O[0]) * (other[1] - O[1]) - (py - O[1]) * (other[0] - O[0]) < 0) {
          path += ` A ${q.s} ${q.s} 0 0 0 ${other[0]} ${other[1]}`;
          px = other[0]; py = other[1]; hit = true; break;
        }
      }
      if (!hit) break;
    }
    return { sqs, path };
  }, []);
  const hi = Math.min(n, 6) - 1;
  const L = Math.min(n, 5);
  const til = useMemo(() => tilings(L), [L]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Virahanka: Fibonacci squares spiral and tilings for n = ${n}`} className="mx-auto w-full touch-none">
      <Defs />
      <rect width={W} height={H} fill="url(#plg)" rx={12} />
      <text x={16} y={22} fill="#5eead4" fontSize={11} fontWeight={700}>growing squares: 1, 2, 3, 5, 8, 13 …</text>
      <g transform={`translate(${tx} ${ty}) scale(${k})`}>
        {geo.sqs.map((q, i) => (
          <rect key={i} x={q.x} y={q.y} width={q.s} height={q.s} rx={0.08} fill={i === hi ? PINK : TEAL} fillOpacity={i === hi ? 0.38 : 0.13}
            stroke={i === hi ? PINK : TEAL} strokeOpacity={i === hi ? 0.9 : 0.45} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
        ))}
        {geo.sqs.map((q, i) => q.s >= 3 && (
          <text key={`t${i}`} x={q.x + q.s / 2} y={q.y + q.s / 2 + 0.3} textAnchor="middle" fontSize={10 / k} fontWeight={700} fill={i === hi ? "#fff" : "#99f6e4"}>{q.s}</text>
        ))}
        <path d={geo.path} fill="none" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={0} cy={1} r={0.2} fill={GOLD} />
      </g>
      <text x={288} y={22} fill="#f9a8d4" fontSize={11} fontWeight={700}>1×{L} row tilings — {til.length} ways</text>
      {til.map((row, ri) => {
        let off = 0;
        return (
          <g key={ri}>
            {row.map((sz, pi) => {
              const x = 288 + off * 13;
              off += sz;
              return <rect key={pi} x={x} y={34 + ri * 19} width={sz * 13 - 1.5} height={13} rx={2.5} fill={sz === 1 ? TEAL : PINK} fillOpacity={sz === 1 ? 0.7 : 0.85} />;
            })}
          </g>
        );
      })}
      <rect x={288} y={198} width={11} height={11} rx={2} fill={TEAL} fillOpacity={0.7} />
      <text x={304} y={207} fill="#94a3b8" fontSize={10}>square = 1 step</text>
      <rect x={404} y={198} width={23} height={11} rx={2} fill={PINK} fillOpacity={0.85} />
      <text x={432} y={207} fill="#94a3b8" fontSize={10}>domino = 2 steps</text>
      {n > 5 && <text x={288} y={224} fill="#fbbf24" fontSize={10}>n = {n} → F{sub(n)} = {virF(n)} ways — too many to draw!</text>}
    </svg>
  );
}

/* ─── Shell: chips + per-mode sliders/readouts + reset ────────────────────── */
export default function PatternLab({ config }: { config?: Record<string, unknown> }) {
  const raw = typeof config?.kind === "string" ? config.kind : typeof config?.pattern === "string" ? config.pattern : "";
  const [kind, setKind] = useState<Kind>(KINDS.find((c) => c.k === raw)?.k ?? "ap");
  const aRaw = config?.a;
  const a = typeof aRaw === "number" ? Math.min(9, Math.max(1, Math.round(aRaw))) : 3;
  const [apN, setApN] = useState(6);
  const [apD, setApD] = useState(2);
  const [gpN, setGpN] = useState(6);
  const [gpR, setGpR] = useState(2);
  const [depth, setDepth] = useState(3);
  const [vN, setVN] = useState(5);
  const reset = () => { setApN(6); setApD(2); setGpN(6); setGpR(2); setDepth(3); setVN(5); };
  const apTerms = Array.from({ length: apN }, (_, i) => a + i * apD);
  const gpTerms = Array.from({ length: gpN }, (_, i) => 2 * Math.pow(gpR, i));
  const vSeq = Array.from({ length: Math.min(vN, 6) }, (_, i) => virF(i + 1));
  return (
    <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-white/10 bg-[#0a0e22] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((c) => (
            <button key={c.k} aria-pressed={kind === c.k} onClick={() => setKind(c.k)} className={`${chip} ${kind === c.k ? on : off}`}>{c.label}</button>
          ))}
        </div>
        <button onClick={reset} aria-label="Reset Pattern Lab controls" className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-400 transition hover:text-zinc-100">↺ reset</button>
      </div>

      <div className="mt-3">
        {kind === "ap" && (
          <>
            <ApView a={a} n={apN} d={apD} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Slider label="n (terms)" min={1} max={12} value={apN} set={setApN} accent="accent-teal-400" color={TEAL} />
              <Slider label="d (jump)" min={1} max={5} value={apD} set={setApD} accent="accent-amber-400" color={GOLD} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className={tag}>terms: <b className="text-teal-300">{preview(apTerms)}</b></span>
              <span className={tag}>aₙ = a + (n−1)d → a{sub(apN)} = {a} + ({apN}−1)·{apD} = <b className="text-amber-300">{a + (apN - 1) * apD}</b></span>
              <span className={tag}>every row adds <b className="text-amber-300">+{apD} gold dots</b> — constant jump!</span>
            </div>
          </>
        )}
        {kind === "gp" && (
          <>
            <GpView n={gpN} r={gpR} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Slider label="n (bars)" min={1} max={10} value={gpN} set={setGpN} accent="accent-teal-400" color={TEAL} />
              <Slider label="r (× each step)" min={2} max={4} value={gpR} set={setGpR} accent="accent-amber-400" color={GOLD} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className={tag}>terms: <b className="text-teal-300">{preview(gpTerms)}</b></span>
              <span className={tag}>bₙ = a·rⁿ⁻¹ → b{sub(gpN)} = 2·{gpR}{sup(gpN - 1)} = <b className="text-amber-300">{(2 * Math.pow(gpR, gpN - 1)).toLocaleString("en-US")}</b></span>
              <span className={tag}>×{gpR} every step — <b className="text-amber-300">{gpR === 2 ? "doubling" : gpR === 3 ? "tripling" : "quadrupling"} is explosive!</b></span>
            </div>
          </>
        )}
        {kind === "sier" && (
          <>
            <SierView d={depth} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Slider label="depth n" min={0} max={5} value={depth} set={setDepth} accent="accent-teal-400" color={TEAL} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className={tag}>shaded ▲ = 3{sup(depth)} = <b className="text-teal-300">{Math.pow(3, depth)}</b></span>
              <span className={tag}>holes = (3{sup(depth)}−1)/2 = <b className="text-pink-300">{(Math.pow(3, depth) - 1) / 2}</b></span>
              <span className={tag}>side = (1/2){sup(depth)} = <b className="text-amber-300">1/{Math.pow(2, depth)}</b> of big ▲</span>
              <span className={tag}>shaded area = (3/4){sup(depth)} = {Math.pow(3, depth)}/{Math.pow(4, depth)} ≈ <b className="text-teal-300">{Math.pow(0.75, depth).toFixed(3)}</b></span>
              {depth > 0 && <span className={tag}>pink = <b className="text-pink-300">{Math.pow(3, depth - 1)}</b> new holes at stage {depth}</span>}
            </div>
          </>
        )}
        {kind === "vir" && (
          <>
            <VirView n={vN} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Slider label="steps n" min={1} max={10} value={vN} set={setVN} accent="accent-teal-400" color={TEAL} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className={tag}>counts: <b className="text-teal-300">{vSeq.join(", ")}{vN > 6 ? ", …" : ""}</b> (F{sub(vN)} = {virF(vN)})</span>
              <span className={tag}>{vN >= 3
                ? <>F{sub(vN)} = F{sub(vN - 1)} + F{sub(vN - 2)} = <b className="text-amber-300">{virF(vN - 1)} + {virF(vN - 2)} = {virF(vN)}</b></>
                : <>base case: F{sub(vN)} = {virF(vN)} — {vN === 1 ? "one square" : "SS or one domino"}</>}</span>
            </div>
          </>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-500">{CAPTIONS[kind]}</p>
    </div>
  );
}
