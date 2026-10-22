"use client";
import { useRef, useState } from "react";

// ─── Circle Lab · Class 9 Circles ────────────────────────────────────────────
// explore → drag centre O + radius handle: r, d=2r, C=2πr, A=πr² (π toggle)
// chords  → drag chord endpoints P,Q on the circle: length, distance from O,
//           live proof r² = d² + (c/2)², equal-chord twin at same distance
// angles  → fixed chord AB + draggable P on the circle: ∠AOB = 2 × ∠APB,
//           highlighted minor arc, diameter → ∠APB = 90° (angle in semicircle)

type Pt = { x: number; y: number };
type DragK = "ctr" | "rad" | "ep1" | "ep2" | "apt";
const S = 21, RANGE = 10, W = (RANGE * 2 + 1) * S, C = W / 2;
const EM = "#34d399", GD = "#f59e0b", SK = "#38bdf8";
const ang = (d: number) => (d * Math.PI) / 180;
const snap = (v: number) => Math.round(v * 2) / 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const f2 = (v: number) => v.toFixed(2);
const fd = (v: number) => { const x = Math.round(v * 10) / 10; return Number.isInteger(x) ? `${x}` : x.toFixed(1); };
const wrapPi = (t: number) => (((t + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const wrapDeg = (t: number) => (((t + 180) % 360) + 360) % 360 - 180;
const BTN = "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70";
const CHIP = "rounded-lg border border-white/10 bg-white/5 px-2.5 py-1";

export default function CircleLab({ config }: { config?: Record<string, unknown> }) {
  const mode = (((config?.mode as string) ?? "explore") as "explore" | "chords" | "angles");
  const [ctr, setCtr] = useState<Pt>({ x: 0, y: 0 });
  const [r, setR] = useState(4.5);
  const [pi22, setPi22] = useState(true);
  const [e1, setE1] = useState(210); // chord endpoint angles (deg, about centre)
  const [e2, setE2] = useState(330);
  const [eq, setEq] = useState(false);
  const [aA, setAA] = useState(140); // fixed chord AB (deg)
  const [aB, setAB] = useState(40);
  const [aP, setAP] = useState(270); // inscribed point P (deg)
  const [diam, setDiam] = useState(false);
  const drag = useRef<DragK | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toMath = (e: React.PointerEvent): Pt => {
    const rc = svgRef.current!.getBoundingClientRect();
    return { x: (((e.clientX - rc.left) / rc.width) * W - C) / S, y: -(((e.clientY - rc.top) / rc.height) * W - C) / S };
  };
  const pos = (aDeg: number, rad = r): Pt => ({ x: ctr.x + rad * Math.cos(ang(aDeg)), y: ctr.y + rad * Math.sin(ang(aDeg)) });
  const px = (m: Pt): [number, number] => [C + m.x * S, C - m.y * S];
  const lab = (aDeg: number): [number, number] => { const p = px(pos(aDeg, r + 0.6)); return [clamp(p[0], 12, W - 12), clamp(p[1], 12, W - 12)]; };
  const arcPath = (o: [number, number], rad: number, a1: number, a2: number) => {
    const d = wrapPi(a2 - a1), cx = o[0], cy = o[1];
    return `M ${(cx + rad * Math.cos(a1)).toFixed(1)} ${(cy + rad * Math.sin(a1)).toFixed(1)} A ${rad} ${rad} 0 0 ${d > 0 ? 1 : 0} ${(cx + rad * Math.cos(a1 + d)).toFixed(1)} ${(cy + rad * Math.sin(a1 + d)).toFixed(1)}`;
  };
  const grab = (k: DragK) => (e: React.PointerEvent) => { e.stopPropagation(); drag.current = k; (e.target as Element).setPointerCapture(e.pointerId); };

  const onMove = (e: React.PointerEvent) => {
    const p = toMath(e);
    if (drag.current === "ctr") setCtr({ x: clamp(snap(p.x), -4, 4), y: clamp(snap(p.y), -4, 4) });
    else if (drag.current === "rad") setR(clamp(snap(Math.hypot(p.x - ctr.x, p.y - ctr.y)), 1, 6));
    else if (drag.current === "ep1" || drag.current === "ep2")
      (drag.current === "ep1" ? setE1 : setE2)(Math.round((Math.atan2(p.y - ctr.y, p.x - ctr.x) * 180) / Math.PI));
    else if (drag.current === "apt") {
      let a = (Math.atan2(p.y - ctr.y, p.x - ctr.x) * 180) / Math.PI;
      const dAB = wrapDeg(aB - aA), t = wrapDeg(a - aA);
      if (dAB >= 0 ? t >= 0 && t <= dAB : t <= 0 && t >= dAB) { // keep P on the major arc
        const s = dAB >= 0 ? 1 : -1;
        a = Math.abs(t) < Math.abs(t - dAB) ? aA - s * 1.5 : aA + dAB + s * 1.5;
      }
      setAP(Math.round(a));
    }
  };
  const reset = () => { setCtr({ x: 0, y: 0 }); setR(4.5); setPi22(true); setE1(210); setE2(330); setEq(false); setAA(140); setAB(40); setAP(270); setDiam(false); };
  const toggleDiam = () => { const on = !diam; setDiam(on); setAB(on ? aA - 180 : aA - 110); };

  // ── derived numbers ─────────────────────────────────────────────────────
  const PI = pi22 ? 22 / 7 : 3.14, piStr = pi22 ? "22/7" : "3.14";
  const O = px(ctr), RH = px(pos(mode === "chords" ? 90 : mode === "angles" ? 0 : 35));
  const E1 = px(pos(e1)), E2 = px(pos(e2));
  const F = px({ x: (pos(e1).x + pos(e2).x) / 2, y: (pos(e1).y + pos(e2).y) / 2 }); // perpendicular foot
  const chLen = Math.hypot(pos(e2).x - pos(e1).x, pos(e2).y - pos(e1).y);
  const dC = Math.hypot((pos(e1).x + pos(e2).x) / 2 - ctr.x, (pos(e1).y + pos(e2).y) / 2 - ctr.y);
  const A = px(pos(aA)), B = px(pos(aB)), P = px(pos(aP));
  const thC = Math.abs(wrapDeg(aB - aA)), thI = thC / 2;
  const uA = Math.atan2(A[1] - P[1], A[0] - P[0]), uB = Math.atan2(B[1] - P[1], B[0] - P[0]);
  const grid: React.ReactElement[] = [];
  for (let i = -RANGE; i <= RANGE; i++) {
    grid.push(<line key={`v${i}`} x1={C + i * S} y1={0} x2={C + i * S} y2={W} stroke="#fff" strokeOpacity={i === 0 ? 0.2 : 0.06} />);
    grid.push(<line key={`h${i}`} x1={0} y1={C + i * S} x2={W} y2={C + i * S} stroke="#fff" strokeOpacity={i === 0 ? 0.2 : 0.06} />);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0e22] p-4">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${W}`} className="mx-auto w-full max-w-[560px] touch-none rounded-xl"
        onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
        <defs>
          <radialGradient id="clbg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0e1533" />
            <stop offset="100%" stopColor="#0a0e22" />
          </radialGradient>
        </defs>
        <rect width={W} height={W} fill="url(#clbg)" rx={12} />
        {grid}

        {/* the circle */}
        <circle cx={O[0]} cy={O[1]} r={r * S} fill={EM} fillOpacity={0.06} stroke={EM} strokeWidth={3} />

        {mode === "chords" && (
          <>
            {eq && (
              <>
                <line x1={2 * O[0] - E1[0]} y1={2 * O[1] - E1[1]} x2={2 * O[0] - E2[0]} y2={2 * O[1] - E2[1]} stroke={SK} strokeWidth={3} strokeLinecap="round" />
                <line x1={O[0]} y1={O[1]} x2={2 * O[0] - F[0]} y2={2 * O[1] - F[1]} stroke={SK} strokeOpacity={0.5} strokeDasharray="4 4" />
              </>
            )}
            <line x1={E1[0]} y1={E1[1]} x2={E2[0]} y2={E2[1]} stroke={EM} strokeWidth={3.5} strokeLinecap="round" />
            <line x1={O[0]} y1={O[1]} x2={F[0]} y2={F[1]} stroke={GD} strokeDasharray="5 4" strokeWidth={1.6} />
            <circle cx={F[0]} cy={F[1]} r={3.5} fill={GD} />
            {(() => { // right-angle mark at the foot + live labels
              const dx = E2[0] - E1[0], dy = E2[1] - E1[1], L = Math.hypot(dx, dy) || 1, s = 8;
              const ux = dx / L, uy = dy / L, wx = O[0] - F[0], wy = O[1] - F[1], Lw = Math.hypot(wx, wy) || 1;
              const vx = wx / Lw, vy = wy / Lw;
              return (
                <>
                  <path d={`M ${F[0] + ux * s} ${F[1] + uy * s} L ${F[0] + (ux + vx) * s} ${F[1] + (uy + vy) * s} L ${F[0] + vx * s} ${F[1] + vy * s}`} fill="none" stroke={GD} strokeOpacity={0.85} strokeWidth={1.4} />
                  <text x={(O[0] + F[0]) / 2} y={(O[1] + F[1]) / 2 - 7} fill="#fbbf24" fontSize={11.5} fontWeight={700} textAnchor="middle">d = {f2(dC)}</text>
                  <text x={F[0] - vx * 24} y={F[1] - vy * 24 + 4} fill="#6ee7b7" fontSize={11.5} fontWeight={700} textAnchor="middle">c = {f2(chLen)}</text>
                </>
              );
            })()}
          </>
        )}

        {mode === "angles" && (
          <>
            <line x1={O[0]} y1={O[1]} x2={A[0]} y2={A[1]} stroke={EM} strokeOpacity={0.8} strokeWidth={2} />
            <line x1={O[0]} y1={O[1]} x2={B[0]} y2={B[1]} stroke={EM} strokeOpacity={0.8} strokeWidth={2} />
            <line x1={P[0]} y1={P[1]} x2={A[0]} y2={A[1]} stroke={GD} strokeWidth={2} />
            <line x1={P[0]} y1={P[1]} x2={B[0]} y2={B[1]} stroke={GD} strokeWidth={2} />
            <path d={arcPath(O, r * S, -ang(aA), -ang(aB))} stroke={GD} strokeWidth={5.5} strokeLinecap="round" fill="none" opacity={0.95} />
            <path d={arcPath(O, Math.min(26, r * S * 0.45), -ang(aA), -ang(aB))} stroke={EM} strokeWidth={2.5} fill="none" />
            <path d={arcPath(P, Math.min(30, r * S * 0.45), uA, uB)} stroke={GD} strokeWidth={2.5} fill="none" />
            {(() => {
              const m = -ang(aA) + wrapPi(ang(aA) - ang(aB)) / 2;
              return <text x={O[0] + 46 * Math.cos(m)} y={O[1] + 46 * Math.sin(m) + 4} fill="#6ee7b7" fontSize={12} fontWeight={800} textAnchor="middle">{fd(thC)}°</text>;
            })()}
            {(() => {
              const m = uA + wrapPi(uB - uA) / 2;
              return <text x={P[0] + 52 * Math.cos(m)} y={P[1] + 52 * Math.sin(m) + 4} fill="#fcd34d" fontSize={12} fontWeight={800} textAnchor="middle">{fd(thI)}°</text>;
            })()}
            <circle cx={A[0]} cy={A[1]} r={5.5} fill={GD} stroke="#fff" strokeWidth={1.5} />
            <circle cx={B[0]} cy={B[1]} r={5.5} fill={GD} stroke="#fff" strokeWidth={1.5} />
            <text x={lab(aA)[0]} y={lab(aA)[1] + 4} fill="#fbbf24" fontSize={12.5} fontWeight={800} textAnchor="middle">A</text>
            <text x={lab(aB)[0]} y={lab(aB)[1] + 4} fill="#fbbf24" fontSize={12.5} fontWeight={800} textAnchor="middle">B</text>
          </>
        )}

        {/* centre handle (all modes) */}
        <g onPointerDown={grab("ctr")}>
          <circle cx={O[0]} cy={O[1]} r={16} fill="transparent" />
          <circle cx={O[0]} cy={O[1]} r={6.5} fill={GD} stroke="#fff" strokeWidth={2} className="cursor-grab" />
          <text x={O[0] + 10} y={O[1] + 17} fill="#fbbf24" fontSize={11.5} fontWeight={800}>O{mode === "explore" ? ` (${f2(ctr.x)}, ${f2(ctr.y)})` : ""}</text>
        </g>

        {/* radius handle (all modes) */}
        <g onPointerDown={grab("rad")}>
          <line x1={O[0]} y1={O[1]} x2={RH[0]} y2={RH[1]} stroke={EM} strokeOpacity={0.6} strokeDasharray="5 4" strokeWidth={1.6} />
          <circle cx={RH[0]} cy={RH[1]} r={16} fill="transparent" />
          <circle cx={RH[0]} cy={RH[1]} r={7} fill={EM} stroke="#fff" strokeWidth={2} className="cursor-grab" />
          <text x={RH[0] + 10} y={RH[1] - 9} fill="#6ee7b7" fontSize={11.5} fontWeight={800}>r = {f2(r)}</text>
        </g>

        {mode === "chords" && ([["P", "ep1", E1, lab(e1)], ["Q", "ep2", E2, lab(e2)]] as const).map(([nm, k, pt, lp]) => (
          <g key={k} onPointerDown={grab(k)}>
            <circle cx={pt[0]} cy={pt[1]} r={16} fill="transparent" />
            <circle cx={pt[0]} cy={pt[1]} r={7} fill={GD} stroke="#fff" strokeWidth={2} className="cursor-grab" />
            <text x={lp[0]} y={lp[1] + 4} fill="#fbbf24" fontSize={12.5} fontWeight={800} textAnchor="middle">{nm}</text>
          </g>
        ))}

        {mode === "angles" && (
          <g onPointerDown={grab("apt")}>
            <circle cx={P[0]} cy={P[1]} r={16} fill="transparent" />
            <circle cx={P[0]} cy={P[1]} r={7} fill={EM} stroke="#fff" strokeWidth={2} className="cursor-grab" />
            <text x={lab(aP)[0]} y={lab(aP)[1] + 4} fill="#6ee7b7" fontSize={12.5} fontWeight={800} textAnchor="middle">P</text>
          </g>
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button type="button" className={BTN} onClick={() => setR((v) => clamp(snap(v + 0.5), 1, 6))} aria-label="Increase radius by 0.5 units">r +</button>
        <button type="button" className={BTN} onClick={() => setR((v) => clamp(snap(v - 0.5), 1, 6))} aria-label="Decrease radius by 0.5 units">r −</button>
        <button type="button" className={BTN} onClick={reset} aria-label="Reset the lab">reset</button>
        {mode === "explore" && (
          <button type="button" className={BTN} onClick={() => setPi22(!pi22)} aria-pressed={pi22} aria-label="Toggle pi between 22/7 and 3.14">π = {pi22 ? "22/7" : "3.14"}</button>
        )}
        {mode === "chords" && (
          <button type="button" className={BTN} onClick={() => setEq(!eq)} aria-pressed={eq} aria-label="Toggle an equal chord at the same distance from the centre">equal chords</button>
        )}
        {mode === "angles" && (
          <button type="button" className={BTN} onClick={toggleDiam} aria-pressed={diam} aria-label="Toggle chord AB as a diameter">AB = diameter</button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
        {mode === "explore" && (
          <>
            <span className={CHIP}>r = <b className="text-emerald-300">{f2(r)}</b></span>
            <span className={CHIP}>d = 2r = <b className="text-emerald-300">{f2(2 * r)}</b></span>
            <span className={CHIP}>C = 2πr = 2 × {piStr} × {f2(r)} = <b className="text-sky-300">{f2(2 * PI * r)}</b></span>
            <span className={CHIP}>A = πr² = {piStr} × {f2(r * r)} = <b className="text-amber-300">{f2(PI * r * r)}</b></span>
          </>
        )}
        {mode === "chords" && (
          <>
            <span className={CHIP}>chord PQ = <b className="text-emerald-300">{f2(chLen)}</b></span>
            <span className={CHIP}>dist. from centre = <b className="text-amber-300">{f2(dC)}</b></span>
            <span className={CHIP}>r² = {f2(r * r)} = {f2(dC * dC)} + {f2((chLen / 2) ** 2)} → <b className="text-emerald-300">r² = d² + (c/2)² ✓</b></span>
            {eq && <span className={CHIP}><b className="text-sky-300">equal chord</b> → same length, same distance ✓</span>}
          </>
        )}
        {mode === "angles" && (
          <>
            <span className={CHIP}>∠AOB (central) = <b className="text-emerald-300">{fd(thC)}°</b></span>
            <span className={CHIP}>∠APB (inscribed) = <b className="text-amber-300">{fd(thI)}°</b></span>
            <span className={CHIP}>arc AB = <b className="text-amber-300">{fd(thC)}°</b></span>
            <span className={CHIP}>{diam ? "AB is a diameter → angle in a semicircle" : "∠AOB = 2 × ∠APB"}: <b className="text-emerald-300">{fd(thC)}° = 2 × {fd(thI)}° ✓</b></span>
          </>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-500">
        {mode === "explore" ? "Drag the centre O and the emerald radius handle (snap 0.5). Flip π to compare 22/7 vs 3.14."
          : mode === "chords" ? "Drag P and Q along the circle — the dashed drop from O is perpendicular to the chord. Try a diameter (d = 0)!"
            : "Drag P around the circle: ∠AOB stays exactly 2 × ∠APB. Make AB a diameter and watch ∠APB lock at 90°."}
      </p>
    </div>
  );
}
