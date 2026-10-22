"use client";
// NumberLineLab — interactive number line for the Numbers chapter (ch3).
// Modes: integers | rationals | surds | reals. Drag A/B, pan empty space, zoom,
// hop-addition animation, exact fraction / surd-cage / irrational drops, density demo.
import { useEffect, useRef, useState } from "react";

type Mode = "integers" | "rationals" | "surds" | "reals";
type Mark = { v: number; lab?: string };            // lab = exact tag (½, √2, π…)
type Hop = { from: number; steps: number; dir: 1 | -1; sum: number };

const MODES: Mode[] = ["integers", "rationals", "surds", "reals"];
const ZOOMS = [20, 10, 5, 2, 1, 0.5];               // units-per-view
const W = 600, H = 240, AX = 150, CX = W / 2;       // svg geometry
const REPEAT = "142857";
const SEED: Record<Mode, { a: Mark; b: Mark }> = {
  integers: { a: { v: 2 }, b: { v: 5 } },
  rationals: { a: { v: 0.5, lab: "½" }, b: { v: -0.75, lab: "−3/4" } },
  surds: { a: { v: 1, lab: "1" }, b: { v: 2, lab: "2" } },
  reals: { a: { v: 1, lab: "1" }, b: { v: 3, lab: "3" } },
};
const FRACS: [string, number][] = [["½", 0.5], ["⅓", 1 / 3], ["¾", 0.75], ["−2/3", -2 / 3], ["1¼", 1.25]];
const SURDS = [2, 3, 5, 7, 10];
const CHIP = "rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-200";
const BTN = CHIP + " cursor-pointer transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";

const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : Math.abs(x));
const fmt6 = (v: number) => v.toFixed(6);
const qFrac = (v: number) => {                      // exact fraction of a 0.25-snapped value
  const n = Math.round(v * 4), g = gcd(Math.abs(n), 4) || 1;
  return 4 / g === 1 ? String(n / g) : `${n / g}/${4 / g}`;
};
const snapV = (v: number, m: Mode) =>
  m === "integers" ? Math.round(v) : m === "rationals" ? Math.round(v * 4) / 4 : Math.round(v * 1000) / 1000;
const tickStr = (v: number, d: number) => {
  const s = v.toFixed(d);
  return (s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s).replace("-0", "0");
};
const cage = (v: number) => `∈ (${Math.floor(v)}, ${Math.floor(v) + 1})`;
const isMode = (x: unknown): x is Mode => typeof x === "string" && (MODES as string[]).includes(x);

export default function NumberLineLab({ config }: { config?: Record<string, unknown> }) {
  const cfg = config?.mode;
  const [mode, setMode] = useState<Mode>(isMode(cfg) ? cfg : "integers");
  const [zi, setZi] = useState(0);
  const [center, setCenter] = useState(0);
  const [a, setA] = useState<Mark>({ ...SEED.integers.a });
  const [b, setB] = useState<Mark>({ ...SEED.integers.b });
  const [extras, setExtras] = useState<Mark[]>([]);
  const [hop, setHop] = useState<Hop | null>(null);
  const [hi, setHi] = useState(0);
  const [rec, setRec] = useState(0);
  const [dens, setDens] = useState<number | null>(null);
  const drag = useRef<"A" | "B" | "pan" | null>(null);
  const pan0 = useRef<{ x: number; c: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const zoom = ZOOMS[zi];
  const u = W / zoom;                                 // px per unit
  const px = (v: number) => CX + (v - center) * u;

  useEffect(() => {                                   // hop animation: one arc per tick
    if (hop && hi < hop.steps) { const t = setTimeout(() => setHi(hi + 1), 170); return () => clearTimeout(t); }
  }, [hop, hi]);
  useEffect(() => {                                   // 1/7 recurring-digit cycle
    if (mode !== "reals") return;
    const id = setInterval(() => setRec((r) => (r + 1) % REPEAT.length), 450);
    return () => clearInterval(id);
  }, [mode]);

  const applyMode = (m: Mode) => {
    setMode(m); setA({ ...SEED[m].a }); setB({ ...SEED[m].b });
    setExtras([]); setHop(null); setHi(0); setCenter(0); setDens(null);
  };
  const drop = (v: number, lab: string) => setExtras((xs) => [...xs.slice(-7), { v, lab }]);
  const density = () => {                             // midpoint nesting: (A,B) → (A,m₁) → …
    const m = (a.v + (dens ?? b.v)) / 2;
    setDens(m);
    drop(m, `m${extras.length + 1}`);
  };
  const startHop = () => {
    const av = Math.round(a.v), bv = Math.round(b.v);
    setHop({ from: av, steps: Math.abs(bv), dir: bv < 0 ? -1 : 1, sum: av + bv });
    setHi(0);
  };
  const toVal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return center + ((e.clientX - r.left) / r.width - 0.5) * zoom;
  };

  const step = zoom / 10;                             // one label every step units
  const dec = step >= 1 ? 0 : Math.ceil(-Math.log10(step) - 1e-9);
  const grid: React.ReactElement[] = [];
  for (let k = Math.ceil((center - zoom / 2) / step - 1e-9); k <= Math.floor((center + zoom / 2) / step + 1e-9); k++) {
    const v = k * step, x = px(v);
    grid.push(<line key={`g${k}`} x1={x} y1={0} x2={x} y2={H} stroke="#ffffff" strokeOpacity={0.06} />);
    grid.push(<line key={`t${k}`} x1={x} y1={AX - 5} x2={x} y2={AX + 5} stroke="#cbd5e1" strokeOpacity={0.8} />);
    grid.push(<text key={`l${k}`} x={x} y={AX + 18} fill="#94a3b8" fontSize={9} textAnchor="middle">{tickStr(v, dec)}</text>);
  }
  const arcs: React.ReactElement[] = [];
  if (hop) for (let i = 0; i < hi; i++) {
    const x1 = px(hop.from + hop.dir * i), x2 = px(hop.from + hop.dir * (i + 1));
    const rx = Math.max(3, Math.abs(x2 - x1) / 2), ry = Math.min(24, rx);
    arcs.push(
      <path key={i} d={`M ${x1} ${AX} A ${rx} ${ry} 0 0 ${hop.dir > 0 ? 1 : 0} ${x2} ${AX}`}
        fill="none" stroke={hop.dir > 0 ? "#4ade80" : "#f472b6"} strokeWidth={2}
        strokeOpacity={i === hi - 1 ? 0.95 : 0.4} strokeLinecap="round" />
    );
  }
  const rB = Math.round(b.v), rA = Math.round(a.v);
  const lab = (m: Mark) => m.lab ?? (mode === "integers" ? String(m.v) : mode === "rationals" ? qFrac(m.v) : m.v.toFixed(3));

  return (
    <div className="mx-auto w-full max-w-[640px] rounded-2xl border border-white/10 bg-[#0a0e22] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-wide text-amber-300">🔢 NUMBER LINE LAB</span>
        <span className="text-[10px] text-zinc-500">{mode} · snap {mode === "integers" ? "1" : mode === "rationals" ? "0.25" : "0.001"}</span>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} aria-label="Interactive number line"
        className="mx-auto mt-1 w-full touch-none select-none rounded-xl"
        onPointerMove={(e) => {
          const d = drag.current; if (!d) return;
          if (d === "pan") {
            const ps = pan0.current; if (!ps) return;
            const r = svgRef.current!.getBoundingClientRect();
            setCenter(ps.c - ((e.clientX - ps.x) / r.width) * zoom);
          } else if (d === "A") setA({ v: snapV(toVal(e), mode) });
          else setB({ v: snapV(toVal(e), mode) });
        }}
        onPointerUp={() => { drag.current = null; pan0.current = null; }}
        onPointerLeave={() => { drag.current = null; pan0.current = null; }}
      >
        <defs>
          <radialGradient id="nlbg" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#0e1533" /><stop offset="100%" stopColor="#0a0e22" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#nlbg)" rx={12} aria-label="Pan the number line by dragging"
          onPointerDown={(e) => { drag.current = "pan"; pan0.current = { x: e.clientX, c: center }; (e.target as Element).setPointerCapture(e.pointerId); }} />
        {grid}
        <line x1={14} y1={60} x2={W - 14} y2={60} stroke="#ffffff" strokeOpacity={0.04} />
        <line x1={14} y1={210} x2={W - 14} y2={210} stroke="#ffffff" strokeOpacity={0.04} />
        <line x1={14} y1={AX} x2={W - 14} y2={AX} stroke="#94a3b8" strokeWidth={1.6} />
        <polygon points={`6,${AX} 18,${AX - 5} 18,${AX + 5}`} fill="#94a3b8" />
        <polygon points={`${W - 6},${AX} ${W - 18},${AX - 5} ${W - 18},${AX + 5}`} fill="#94a3b8" />

        {extras.map((m, i) => (
          <g key={`${m.lab}${i}`} pointerEvents="none">
            <circle cx={px(m.v)} cy={AX} r={4.5} fill="#a78bfa" stroke="#fff" strokeOpacity={0.6} />
            <text x={px(m.v)} y={AX - 27 - (i % 2) * 13} fill="#c4b5fd" fontSize={10} fontWeight={700} textAnchor="middle" stroke="#0a0e22" strokeWidth={3} paintOrder="stroke">{m.lab}</text>
          </g>
        ))}

        {arcs}
        {hop && hi < hop.steps && (
          <circle cx={px(hop.from + hop.dir * hi)} cy={AX} r={5} fill="none" stroke={hop.dir > 0 ? "#4ade80" : "#f472b6"} strokeWidth={2} pointerEvents="none" />
        )}
        {hop && hi >= hop.steps && (() => {
          const x = Math.max(52, Math.min(W - 52, px(hop.sum)));
          return (
            <g pointerEvents="none">
              <line x1={px(hop.sum)} y1={AX - 10} x2={px(hop.sum)} y2={AX + 10} stroke="#fbbf24" strokeWidth={2} />
              <rect x={x - 52} y={AX + 26} width={104} height={22} rx={8} fill="#fbbf24" fillOpacity={0.12} stroke="#fbbf24" strokeOpacity={0.6} />
              <text x={x} y={AX + 41} fill="#fbbf24" fontSize={12} fontWeight={800} textAnchor="middle">A + B = {hop.sum}</text>
            </g>
          );
        })()}

        {(["A", "B"] as const).map((k) => {
          const m = k === "A" ? a : b;
          const col = k === "A" ? "#fbbf24" : "#38bdf8";
          return (
            <g key={k} aria-label={`Drag marker ${k}`} className="cursor-grab"
              onPointerDown={(e) => { e.stopPropagation(); drag.current = k; setHop(null); (e.target as Element).setPointerCapture(e.pointerId); }}>
              <circle cx={px(m.v)} cy={AX} r={16} fill="transparent" />
              <circle cx={px(m.v)} cy={AX} r={8} fill={col} stroke="#fff" strokeWidth={2} />
              <text x={px(m.v)} y={AX - 15} fill={col} fontSize={12} fontWeight={800} textAnchor="middle" stroke="#0a0e22" strokeWidth={4} paintOrder="stroke">{k} = {lab(m)}</text>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
        {MODES.map((m) => (
          <button key={m} onClick={() => applyMode(m)} aria-label={`${m} mode`}
            className={`rounded-lg border px-2.5 py-1 capitalize transition-colors ${m === mode ? "border-amber-400/50 bg-amber-400/10 text-amber-300" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}>
            {m}
          </button>
        ))}
        <button onClick={() => setZi((z) => Math.max(0, z - 1))} disabled={zi === 0} aria-label="Zoom out" className={BTN}>−</button>
        <span className={CHIP}>±{zoom / 2} units</span>
        <button onClick={() => setZi((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={zi === ZOOMS.length - 1} aria-label="Zoom in" className={BTN}>+</button>
        <button onClick={() => applyMode(mode)} aria-label="Reset lab" className={BTN + " border-rose-400/30 text-rose-300"}>reset</button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-xs">
        {mode === "integers" && (
          <>
            <button onClick={startHop} aria-label="Hop A plus B" className={BTN + " border-amber-400/40 bg-amber-400/10 text-amber-300"}>A + B ▶ hop</button>
            <span className={CHIP}>A = <b className="text-amber-300">{rA}</b></span>
            <span className={CHIP}>B = <b className="text-sky-300">{rB}</b></span>
            <span className={CHIP}>A + B = <b className="text-amber-300">{rA + rB}</b></span>
            <span className={CHIP}>{rB >= 0 ? <b className="text-emerald-300">|B| hops →</b> : <b className="text-pink-300">|B| hops ←</b>}</span>
          </>
        )}
        {mode === "rationals" && (
          <>
            {FRACS.map(([s, v]) => (
              <button key={s} onClick={() => drop(v, s)} aria-label={`Drop ${s} on the line`} className={BTN + " border-violet-400/30 text-violet-300"}>{s}</button>
            ))}
            <button onClick={density} aria-label="Drop midpoint of A and B" className={BTN + " border-violet-400/40 text-violet-300"}>midpoint(A,B) ↓</button>
            <span className={CHIP}>A = <b className="text-amber-300">{a.lab ?? qFrac(a.v)}</b> = {fmt6(a.v)}</span>
            <span className={CHIP}>B = <b className="text-sky-300">{b.lab ?? qFrac(b.v)}</b> = {fmt6(b.v)}</span>
            <span className={CHIP}>{a.v > b.v ? <b className="text-amber-300">A &gt; B</b> : a.v < b.v ? <b className="text-sky-300">B &gt; A</b> : <b>A = B</b>}</span>
          </>
        )}
        {mode === "surds" && (
          <>
            {SURDS.map((n) => (
              <button key={n} onClick={() => drop(Math.sqrt(n), `√${n}`)} aria-label={`Drop √${n} at its true value`} className={BTN + " border-violet-400/30 text-violet-300"}>√{n}</button>
            ))}
            <button onClick={density} aria-label="Drop midpoint of A and B" className={BTN + " border-violet-400/40 text-violet-300"}>midpoint(A,B) ↓</button>
            <span className={CHIP}>A = <b className="text-amber-300">{a.lab ?? fmt6(a.v)}</b> ≈ {fmt6(a.v)} {Number.isInteger(a.v) ? "= exactly" : cage(a.v)}</span>
            <span className={CHIP}>B = <b className="text-sky-300">{b.lab ?? fmt6(b.v)}</b> ≈ {fmt6(b.v)} {Number.isInteger(b.v) ? "= exactly" : cage(b.v)}</span>
          </>
        )}
        {mode === "reals" && (
          <>
            <button onClick={() => drop(Math.PI, "π")} aria-label="Drop π" className={BTN + " border-violet-400/30 text-violet-300"}>π</button>
            <button onClick={() => drop(Math.E, "e")} aria-label="Drop e" className={BTN + " border-violet-400/30 text-violet-300"}>e</button>
            <button onClick={density} aria-label="Drop midpoint of A and B" className={BTN + " border-violet-400/40 text-violet-300"}>midpoint(A,B) ↓</button>
            <button aria-label="1/7 recurring decimal demo" className={CHIP + " cursor-default"}>
              1/7 = 0.{REPEAT.split("").map((d, i) => <span key={i} className={i === rec ? "font-extrabold text-amber-300" : "text-zinc-300"}>{d}</span>)}…
            </button>
            <span className={CHIP}>A = <b className="text-amber-300">{fmt6(a.v)}</b></span>
            <span className={CHIP}>B = <b className="text-sky-300">{fmt6(b.v)}</b></span>
          </>
        )}
        {mode !== "integers" && extras.map((m, i) => (
          <span key={`r${i}`} className={CHIP}>
            <b className="text-violet-300">{m.lab}</b> = {fmt6(m.v)}
            {mode === "surds" && !Number.isInteger(m.v) ? ` ${cage(m.v)}` : ""}
          </span>
        ))}
      </div>

      <p className="mt-2 text-center text-[11px] text-zinc-500">
        {dens !== null
          ? "See? Between any two numbers hides another — zoom in and drop the midpoint again…"
          : mode === "integers" ? "Drag A & B, pan empty space, zoom. Press A + B to hop |B| steps from A."
          : mode === "rationals" ? "Snap 0.25 — every marker is an exact fraction. Drop ⅓, ¾… and compare."
          : mode === "surds" ? "Surds are irrational — each one lives caged between two consecutive integers."
          : "π and e never repeat; 1/7 repeats in blocks of 142857. All of them live on one line."}
      </p>
    </div>
  );
}
