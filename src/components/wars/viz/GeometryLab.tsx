"use client";
// GEOMETRY LAB — Perimeter & Area (Ch 6): rectangle / parallelogram / triangle / circle
import { useEffect, useRef, useState } from "react";

type Kind = "rect" | "para" | "tri" | "circle";
type Hd = { id: string; x: number; y: number; c: string; t?: string; dy?: number; mid?: boolean };

const S = 22;                    // px per unit
const W = 480, H = 360;
const OX = 60, OY = 292;         // unit origin (0,0) in px
const CX = 8.5, CY = 7;          // circle centre (units)
const CHIP = "rounded-lg border border-white/10 bg-white/5 px-2.5 py-1";
const px = (u: number) => OX + u * S;
const py = (u: number) => OY - u * S;
const fmt = (v: number) => String(Math.round(v * 100) / 100);
const snap = (v: number) => Math.round(v * 2) / 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const KINDS: { id: Kind; label: string }[] = [
  { id: "rect", label: "Rectangle" }, { id: "para", label: "Parallelogram" },
  { id: "tri", label: "Triangle" }, { id: "circle", label: "Circle" },
];
const MODE: Record<string, Kind> = { rect: "rect", para: "para", tri: "tri", circle: "circle" };
const HINT: Record<Kind, string> = {
  rect: "Drag the ⇔ / ⇕ handles — every unit square inside is one grass square.",
  para: "Shear it! Base × height never changes — only the slant (and the fence) does.",
  tri: "Any triangle is exactly ½ of its b×h box. Drag the apex and check!",
  circle: "Drag r, then Unroll: the gold line is C ≈ 3.14 × d. That's π hiding in every circle!",
};

export default function GeometryLab({ config }: { config?: Record<string, unknown> }) {
  const [kind, setKind] = useState<Kind>(MODE[(config?.mode as string) ?? ""] ?? "rect");
  const [w, setW] = useState(8); const [h, setH] = useState(5);
  const [b, setB] = useState(8); const [ph, setPh] = useState(4); const [sh, setSh] = useState(3);
  const [t1, setT1] = useState(1); const [t2, setT2] = useState(11);
  const [ax, setAx] = useState(5.5); const [ay, setAy] = useState(6);
  const [r, setR] = useState(4);
  const [unroll, setUnroll] = useState(0);
  const drag = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const toUnit = (e: React.PointerEvent) => {
    const rc = svgRef.current!.getBoundingClientRect();
    return { x: (((e.clientX - rc.left) / rc.width) * W - OX) / S, y: (OY - ((e.clientY - rc.top) / rc.height) * H) / S };
  };

  const onMove = (e: React.PointerEvent) => {
    const u = toUnit(e), d = drag.current;
    if (!d) return;
    if (d === "w") setW(clamp(snap(u.x), 2, 16));
    else if (d === "h") setH(clamp(snap(u.y), 2, 11));
    else if (d === "b") { const n = clamp(snap(u.x), 3, 14); setB(n); setSh(clamp(sh, -2, 17 - n)); }
    else if (d === "s") { setSh(clamp(snap(u.x - b), -2, 17 - b)); setPh(clamp(snap(u.y), 1.5, 10)); }
    else if (d === "t1") { const n = clamp(snap(u.x), 0, t2 - 2); setT1(n); setAx(clamp(ax, n, t2)); }
    else if (d === "t2") { const n = clamp(snap(u.x), t1 + 2, 16.5); setT2(n); setAx(clamp(ax, t1, n)); }
    else if (d === "ap") { setAx(clamp(snap(u.x), t1, t2)); setAy(clamp(snap(u.y), 1, 11)); }
    else if (d === "r") setR(clamp(snap(Math.hypot(u.x - CX, u.y - CY)), 1.5, 6.5));
  };

  const reset = () => { setW(8); setH(5); setB(8); setPh(4); setSh(3); setT1(1); setT2(11); setAx(5.5); setAy(6); setR(4); setUnroll(0); };

  const play = () => {                      // unroll-circumference animation
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1400);
      setUnroll(1 - Math.pow(1 - p, 3));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  const grid = (c: string, o: number, p: string) => {
    const L: React.ReactElement[] = [];
    for (let gx = OX % S; gx <= W; gx += S) L.push(<line key={p + "v" + gx} x1={gx} y1={0} x2={gx} y2={H} stroke={c} strokeOpacity={o} />);
    for (let gy = OY % S; gy <= H; gy += S) L.push(<line key={p + "h" + gy} x1={0} y1={gy} x2={W} y2={gy} stroke={c} strokeOpacity={o} />);
    return L;
  };

  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${px(x)},${py(y)}`).join(" ");
  const s = Math.hypot(sh, ph);             // slant side
  const base = t2 - t1;
  const sa = Math.hypot(ax - t1, ay), sc = Math.hypot(t2 - ax, ay);
  const P = kind === "rect" ? 2 * (w + h) : kind === "para" ? 2 * (b + s) : kind === "tri" ? sa + base + sc : 2 * Math.PI * r;
  const A = kind === "rect" ? w * h : kind === "para" ? b * ph : kind === "tri" ? 0.5 * base * ay : Math.PI * r * r;
  const CS = 2 * Math.PI * r, S2 = Math.min(18, 400 / CS), sy = py(-1.9), x0 = 24;
  const dPx = 2 * r * S2, cPx = CS * S2;    // diameter / circumference in strip px

  const clip = kind === "rect" ? <rect x={px(0)} y={py(h)} width={w * S} height={h * S} />
    : kind === "para" ? <polygon points={poly([[0, 0], [b, 0], [b + sh, ph], [sh, ph]])} />
    : kind === "tri" ? <polygon points={poly([[t1, 0], [t2, 0], [ax, ay]])} />
    : <circle cx={px(CX)} cy={py(CY)} r={r * S} />;

  const hs: Hd[] = kind === "rect" ? [
      { id: "w", x: w / 2, y: 0, c: "#fb923c", t: `⇔ w = ${fmt(w)}`, dy: 24, mid: true },
      { id: "h", x: w, y: h / 2, c: "#f59e0b", t: `⇕ h = ${fmt(h)}`, dy: 5 },
    ] : kind === "para" ? [
      { id: "b", x: b, y: 0, c: "#fb923c", t: `⇔ b = ${fmt(b)}`, dy: 24, mid: true },
      { id: "s", x: b + sh, y: ph, c: "#f59e0b", t: "⇕", dy: -12 },
    ] : kind === "tri" ? [
      { id: "t1", x: t1, y: 0, c: "#fb923c", t: "B", dy: -12, mid: true },
      { id: "t2", x: t2, y: 0, c: "#fb923c", t: "C", dy: -12, mid: true },
      { id: "ap", x: ax, y: ay, c: "#f59e0b", t: "A", dy: -12, mid: true },
    ] : [{ id: "r", x: CX + r * 0.7071, y: CY + r * 0.7071, c: "#f59e0b", t: `r = ${fmt(r)}`, dy: -10 }];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0e22] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        {KINDS.map((k) => (
          <button key={k.id} onClick={() => setKind(k.id)} aria-pressed={kind === k.id} aria-label={`Switch to ${k.label} mode`}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${kind === k.id ? "border-[#fb923c] bg-[#fb923c]/15 text-[#fdba74]" : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"}`}>
            {k.label}
          </button>
        ))}
        <button onClick={reset} aria-label="Reset all dimensions"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-400 transition hover:text-white">↺ Reset</button>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Interactive ${kind}: drag handles to explore perimeter and area`}
        className="mx-auto w-full max-w-[560px] touch-none rounded-xl"
        onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
        <defs>
          <radialGradient id="gl-g" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#101736" /><stop offset="100%" stopColor="#0a0e22" />
          </radialGradient>
          <clipPath id="gl-clip">{clip}</clipPath>
        </defs>
        <rect width={W} height={H} fill="url(#gl-g)" rx={12} />
        {grid("#ffffff", 0.05, "g")}
        {kind !== "circle" && <line x1={px(-2.4)} y1={py(0)} x2={px(17.6)} y2={py(0)} stroke="#ffffff" strokeOpacity={0.22} strokeWidth={1.5} />}
        <g clipPath="url(#gl-clip)">
          <rect width={W} height={H} fill="#fb923c" fillOpacity={0.1} />
          {grid("#fb923c", 0.28, "a")}
        </g>

        {kind === "rect" && (
          <>
            <rect x={px(0)} y={py(h)} width={w * S} height={h * S} fill="none" stroke="#fb923c" strokeWidth={3} rx={2} />
            <text x={px(w / 2)} y={py(h / 2) + 5} fill="#fdba74" fillOpacity={0.9} fontSize={13} fontWeight={800} textAnchor="middle">{fmt(A)} unit squares</text>
          </>
        )}

        {kind === "para" && (
          <>
            <polygon points={poly([[0, 0], [b, 0], [b + sh, ph], [sh, ph]])} fill="none" stroke="#fb923c" strokeWidth={3} strokeLinejoin="round" />
            <line x1={px(b + sh)} y1={py(ph)} x2={px(b + sh)} y2={py(0)} stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" />
            <polyline points={`${px(b + sh - 0.4)},${py(0.4)} ${px(b + sh - 0.4)},${py(0)} ${px(b + sh)},${py(0)}`} fill="none" stroke="#f59e0b" strokeOpacity={0.75} strokeWidth={1.4} />
            <text x={px(b + sh) + 8} y={py(ph / 2) + 4} fill="#f59e0b" fontSize={11.5} fontWeight={800}>h = {fmt(ph)}</text>
            <text x={px(b + sh / 2)} y={py(ph / 2) - 14} fill="#fca5a5" fontSize={11} fontWeight={700} textAnchor="middle">s = {fmt(s)}</text>
            <text x={px(b / 2)} y={py(0) + 16} fill="#fdba74" fontSize={11.5} fontWeight={800} textAnchor="middle">b = {fmt(b)}</text>
            <text x={14} y={22} fill="#fca5a5" fontSize={11} fontWeight={700}>⚠ why not slant? Area = b × h — the perpendicular height, never s</text>
          </>
        )}

        {kind === "tri" && (
          <>
            <rect x={px(t1)} y={py(ay)} width={base * S} height={ay * S} fill="none" stroke="#ffffff" strokeOpacity={0.25} strokeDasharray="5 5" />
            <text x={px((t1 + t2) / 2)} y={py(ay) + 14} fill="#94a3b8" fontSize={10.5} fontWeight={700} textAnchor="middle">box = {fmt(base)} × {fmt(ay)} → triangle = ½ ✓</text>
            <line x1={px(ax)} y1={py(ay)} x2={px(ax)} y2={py(0)} stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" />
            <polyline points={`${px(ax - 0.4)},${py(0.4)} ${px(ax - 0.4)},${py(0)} ${px(ax)},${py(0)}`} fill="none" stroke="#f59e0b" strokeOpacity={0.75} strokeWidth={1.4} />
            <text x={px(ax) + 8} y={py(ay / 2) + 4} fill="#f59e0b" fontSize={11.5} fontWeight={800}>h = {fmt(ay)}</text>
            <text x={px((t1 + t2) / 2)} y={py(0) + 18} fill="#fdba74" fontSize={11.5} fontWeight={800} textAnchor="middle">b = {fmt(base)}</text>
            <polygon points={poly([[t1, 0], [t2, 0], [ax, ay]])} fill="none" stroke="#fb923c" strokeWidth={3} strokeLinejoin="round" />
          </>
        )}

        {kind === "circle" && (
          <>
            <circle cx={px(CX)} cy={py(CY)} r={r * S} fill="none" stroke="#fb923c" strokeWidth={3} />
            <line x1={px(CX)} y1={py(CY)} x2={px(CX + r * 0.7071)} y2={py(CY + r * 0.7071)} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" />
            <circle cx={px(CX)} cy={py(CY)} r={3.5} fill="#f59e0b" />
            <text x={x0} y={sy - 24} fill="#f59e0b" fontSize={12} fontWeight={800}>Unroll: C = 2πr = {fmt(CS)} units</text>
            <line x1={x0} y1={sy - 10} x2={x0 + cPx * unroll} y2={sy - 10} stroke="#f59e0b" strokeWidth={5} strokeLinecap="round" />
            {[1, 2, 3].map((k) => k * dPx < cPx - 2 && (
              <g key={k}>
                <line x1={x0 + k * dPx} y1={sy - 16} x2={x0 + k * dPx} y2={sy - 4} stroke="#fde68a" strokeOpacity={0.8} />
                <text x={x0 + k * dPx} y={sy + 16} fill="#fde68a" fontSize={10} textAnchor="middle">{k}d</text>
              </g>
            ))}
            {unroll > 0.85 && <text x={x0 + cPx} y={sy - 16} fill="#fde68a" fontSize={10.5} fontWeight={700} textAnchor="end">= 3.14 × d ✓</text>}
            <line x1={x0} y1={sy + 2} x2={x0 + dPx} y2={sy + 2} stroke="#94a3b8" strokeWidth={6} strokeLinecap="round" />
            <text x={x0 + dPx / 2} y={sy + 18} fill="#cbd5e1" fontSize={10.5} textAnchor="middle">d = 2r = {fmt(2 * r)}</text>
          </>
        )}

        {hs.map((hd) => (
          <g key={hd.id} className="cursor-grab" aria-label={`Drag handle ${hd.id}`}
            onPointerDown={(e) => { e.stopPropagation(); drag.current = hd.id; (e.target as Element).setPointerCapture(e.pointerId); }}>
            <circle cx={px(hd.x)} cy={py(hd.y)} r={16} fill="transparent" />
            <circle cx={px(hd.x)} cy={py(hd.y)} r={6.5} fill={hd.c} stroke="#fff" strokeWidth={2} />
            {hd.t && <text x={px(hd.x) + (hd.mid ? 0 : 12)} y={py(hd.y) + (hd.dy ?? -12)} fill={hd.c} fontSize={11.5} fontWeight={800} textAnchor={hd.mid ? "middle" : "start"}>{hd.t}</text>}
          </g>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className={CHIP}>🚧 Fence (P) = <b className="text-orange-300">{fmt(P)}</b> units</span>
        <span className={CHIP}>🌱 Grass (A) = <b className="text-amber-300">{fmt(A)}</b> sq units</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
        {kind === "rect" && (<>
          <span className={CHIP}>P = 2(w + h) = 2({fmt(w)} + {fmt(h)}) = <b className="text-orange-300">{fmt(P)}</b></span>
          <span className={CHIP}>A = w × h = {fmt(w)} × {fmt(h)} = <b className="text-amber-300">{fmt(A)}</b></span>
        </>)}
        {kind === "para" && (<>
          <span className={CHIP}>A = b × h = {fmt(b)} × {fmt(ph)} = <b className="text-amber-300">{fmt(A)}</b></span>
          <span className={CHIP}>P = 2(b + s) = 2({fmt(b)} + {fmt(s)}) = <b className="text-orange-300">{fmt(P)}</b></span>
          <span className={`${CHIP} border-rose-400/30 bg-rose-400/10 text-rose-300`}>why not slant? s only tilts — area needs ⊥ h</span>
        </>)}
        {kind === "tri" && (<>
          <span className={CHIP}>A = ½ × b × h = ½ × {fmt(base)} × {fmt(ay)} = <b className="text-amber-300">{fmt(A)}</b></span>
          <span className={CHIP}>P = {fmt(sa)} + {fmt(base)} + {fmt(sc)} = <b className="text-orange-300">{fmt(P)}</b></span>
        </>)}
        {kind === "circle" && (<>
          <span className={CHIP}>C = 2πr = 2π × {fmt(r)} = <b className="text-amber-300">{fmt(CS)}</b></span>
          <span className={CHIP}>A = πr² = π × {fmt(r)}² = <b className="text-amber-300">{fmt(A)}</b></span>
          <button onClick={play} aria-label="Play unroll circumference animation"
            className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-1 font-bold text-amber-300 transition hover:bg-[#f59e0b]/20">▶ Unroll C</button>
        </>)}
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-500">{HINT[kind]}</p>
    </div>
  );
}
