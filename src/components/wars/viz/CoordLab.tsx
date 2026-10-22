"use client";
import { useRef, useState } from "react";

type Pt = { x: number; y: number };
const S = 21;           // px per unit
const RANGE = 10;       // ± units
const W = (RANGE * 2 + 1) * S; // viewBox square
const C = W / 2;

const px = (v: number) => C + v * S;
const mx = (p: number) => (p - C) / S;
const fmt = (v: number) => (Math.round(v * 100) / 100).toString().replace("-0", "0");
const snap = (v: number) => Math.round(v * 2) / 2;

export default function CoordLab({ config }: { config?: Record<string, unknown> }) {
  const mode = (config?.mode as string) ?? "points";
  const [A, setA] = useState<Pt>({ x: 2, y: 3 });
  const [B, setB] = useState<Pt>({ x: -4, y: -2 });
  const [m, setM] = useState(2);
  const [c, setC] = useState(-1);
  const [probe, setProbe] = useState<Pt | null>(null);
  const drag = useRef<"A" | "B" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toMath = (e: React.PointerEvent): Pt => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    const sy = ((e.clientY - r.top) / r.height) * W;
    return { x: mx(sx), y: -mx(sy) };
  };

  const quad = (p: Pt) => (p.x > 0 && p.y > 0 ? "Quadrant I" : p.x < 0 && p.y > 0 ? "Quadrant II" : p.x < 0 && p.y < 0 ? "Quadrant III" : p.x > 0 && p.y < 0 ? "Quadrant IV" : "On an axis");

  const dx = B.x - A.x, dy = B.y - A.y;
  const dist = Math.hypot(dx, dy);
  const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

  const gridLines: React.ReactElement[] = [];
  for (let i = -RANGE; i <= RANGE; i++) {
    gridLines.push(<line key={`v${i}`} x1={px(i)} y1={0} x2={px(i)} y2={W} stroke="#ffffff" strokeOpacity={i === 0 ? 0.55 : 0.07} strokeWidth={i === 0 ? 1.6 : 1} />);
    gridLines.push(<line key={`h${i}`} x1={0} y1={px(i)} x2={W} y2={px(i)} stroke="#ffffff" strokeOpacity={i === 0 ? 0.55 : 0.07} strokeWidth={i === 0 ? 1.6 : 1} />);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0e22] p-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${W}`}
        className="w-full max-w-[560px] mx-auto touch-none rounded-xl"
        onPointerMove={(e) => {
          const p = toMath(e);
          setProbe(p);
          if (drag.current === "A") setA({ x: snap(p.x), y: snap(p.y) });
          if (drag.current === "B") setB({ x: snap(p.x), y: snap(p.y) });
        }}
        onPointerLeave={() => { setProbe(null); drag.current = null; }}
        onPointerUp={() => (drag.current = null)}
      >
        <defs>
          <radialGradient id="cg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0e1533" />
            <stop offset="100%" stopColor="#0a0e22" />
          </radialGradient>
        </defs>
        <rect width={W} height={W} fill="url(#cg)" rx={12} />
        {gridLines}
        {/* quadrant labels */}
        {[["I", 1, 1], ["II", -1, 1], ["III", -1, -1], ["IV", 1, -1]].map(([q, sx, sy]) => (
          <text key={q as string} x={px((sx as number) * (RANGE - 1.1))} y={px((sy as number) * (RANGE - 0.6))} fill="#ffffff" fillOpacity={0.13} fontSize={15} fontWeight={800} textAnchor="middle">{q}</text>
        ))}
        {/* axis numbers */}
        {[-10, -5, 5, 10].map((i) => (
          <text key={`x${i}`} x={px(i)} y={C + 14} fill="#94a3b8" fontSize={9} textAnchor="middle">{i}</text>
        ))}
        {[-10, -5, 5, 10].map((i) => (
          <text key={`y${i}`} x={C + 12} y={px(i) + 3} fill="#94a3b8" fontSize={9}>{i}</text>
        ))}

        {mode === "line" && (
          <>
            {(() => {
              const x1 = -RANGE, x2 = RANGE, y1 = m * x1 + c, y2 = m * x2 + c;
              const clampY = (v: number) => Math.max(-RANGE - 4, Math.min(RANGE + 4, v));
              return <line x1={px(x1)} y1={px(-clampY(y1))} x2={px(x2)} y2={px(-clampY(y2))} stroke="#38bdf8" strokeWidth={3} strokeLinecap="round" />;
            })()}
            <circle cx={px(0)} cy={px(-c)} r={5} fill="#f59e0b" />
            <text x={px(0) + 9} y={px(-c) - 8} fill="#f59e0b" fontSize={11} fontWeight={700}>y-intercept (0, {fmt(c)})</text>
            <polygon points={`${px(1)},${px(-(m * 1 + c))} ${px(3)},${px(-(m * 1 + c))} ${px(3)},${px(-(m * 3 + c))}`} fill="#38bdf8" fillOpacity={0.18} stroke="#38bdf8" strokeOpacity={0.5} />
            <text x={px(2)} y={px(-(m * 1 + c)) - 6} fill="#7dd3fc" fontSize={10} textAnchor="middle">run = 2</text>
            <text x={px(3.15)} y={px(-(m * 2 + c))} fill="#7dd3fc" fontSize={10}>rise = {fmt(2 * m)}</text>
          </>
        )}

        {mode === "points" && (
          <>
            <line x1={px(A.x)} y1={px(-A.y)} x2={px(B.x)} y2={px(-B.y)} stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" />
            <circle cx={px(mid.x)} cy={px(-mid.y)} r={4} fill="#f472b6" />
            {A && B && (
              <g>
                <polyline points={`${px(A.x)},${px(-A.y)} ${px(B.x)},${px(-A.y)} ${px(B.x)},${px(-B.y)}`} fill="none" stroke="#f59e0b" strokeOpacity={0.5} strokeWidth={1.5} />
              </g>
            )}
          </>
        )}

        {mode === "points" && (["A", "B"] as const).map((k) => {
          const p = k === "A" ? A : B;
          return (
            <g key={k} onPointerDown={(e) => { e.stopPropagation(); drag.current = k; (e.target as Element).setPointerCapture(e.pointerId); }}>
              <circle cx={px(p.x)} cy={px(-p.y)} r={14} fill="transparent" />
              <circle cx={px(p.x)} cy={px(-p.y)} r={7} fill={k === "A" ? "#f59e0b" : "#38bdf8"} stroke="#fff" strokeWidth={2} className="cursor-grab" />
              <text x={px(p.x) + 11} y={px(-p.y) - 9} fill={k === "A" ? "#fbbf24" : "#7dd3fc"} fontSize={12} fontWeight={800}>{k}({fmt(p.x)}, {fmt(p.y)})</text>
            </g>
          );
        })}

        {probe && (
          <g pointerEvents="none">
            <line x1={px(probe.x)} y1={0} x2={px(probe.x)} y2={W} stroke="#f472b6" strokeOpacity={0.35} strokeDasharray="3 4" />
            <line x1={0} y1={px(-probe.y)} x2={W} y2={px(-probe.y)} stroke="#f472b6" strokeOpacity={0.35} strokeDasharray="3 4" />
            <circle cx={px(probe.x)} cy={px(-probe.y)} r={3.5} fill="#f472b6" />
          </g>
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        {mode === "points" ? (
          <>
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1">A = ({fmt(A.x)}, {fmt(A.y)}) <b className="text-amber-300">{quad(A)}</b></span>
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1">B = ({fmt(B.x)}, {fmt(B.y)}) <b className="text-sky-300">{quad(B)}</b></span>
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1">d(A,B) = √({fmt(dx)}² + {fmt(dy)}²) = <b className="text-pink-300">{fmt(dist)}</b></span>
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1">midpoint = ({fmt(mid.x)}, {fmt(mid.y)})</span>
          </>
        ) : (
          <>
            <label className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">slope m
              <input type="range" min={-5} max={5} step={0.5} value={m} onChange={(e) => setM(parseFloat(e.target.value))} className="w-28 accent-sky-400" />
              <b className="text-sky-300 w-8">{fmt(m)}</b>
            </label>
            <label className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">intercept c
              <input type="range" min={-6} max={6} step={0.5} value={c} onChange={(e) => setC(parseFloat(e.target.value))} className="w-28 accent-amber-400" />
              <b className="text-amber-300 w-8">{fmt(c)}</b>
            </label>
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1">y = {fmt(m)}x {c >= 0 ? "+" : "−"} {fmt(Math.abs(c))} · slope = rise/run = <b className="text-sky-300">{fmt(m)}</b></span>
          </>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-500">{mode === "points" ? "Drag A and B. Hover the plane to probe coordinates. Snap: 0.5 units." : "Slide m and c — watch the line tilt and shift. The shaded triangle is the slope."}</p>
    </div>
  );
}
