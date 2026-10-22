"use client";
import { useState } from "react";

// ─── ChanceLab · interactive probability lab (ch7) ──────────────────────────
// Coin / Dice / Two-Dice / Spinner experiments: relative frequency vs theory.
type Exp = "coin" | "dice" | "two" | "spin";
const F = "#e879f9", GOLD = "#f59e0b";
const SECTCOL = ["#e879f9", "#a21caf", "#f0abfc", "#c026d3", "#86198f", "#d946ef", "#9333ea", "#f5d0fe"];
const zeros = (n: number) => Array.from({ length: n }, () => 0);
const pct = (f: number, d = 1) => `${(f * 100).toFixed(d)}%`;
const LBL: Record<Exp, string> = { coin: "🪙 Coin", dice: "🎲 Dice", two: "🎲🎲 Two Dice", spin: "🎯 Spinner" };
const THEORY2 = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((v) => v / 36);
const BTN = "rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-100 transition hover:bg-white/10 active:scale-95 disabled:opacity-40";

/** Gold outline = theoretical bar · fuchsia = observed relative frequency. */
function BarChart({ labels, counts, theory }: { labels: string[]; counts: number[]; theory: number[] }) {
  const W = 340, H = 185, top = 18, bot = 28, L = 6;
  const total = counts.reduce((a, b) => a + b, 0);
  const freqs = counts.map((c) => (total ? c / total : 0));
  const yMax = Math.min(1.05, Math.max(...freqs, ...theory, 0.05) * 1.18 + 0.02);
  const y = (f: number) => top + (1 - f / yMax) * (H - top - bot);
  const bw = (W - L * 2) / counts.length;
  const flat = theory.every((t) => Math.abs(t - theory[0]) < 1e-9);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="relative frequency vs theoretical probability">
      {theory.map((t, i) => (
        <rect key={`t${i}`} x={L + i * bw + bw * 0.16} y={y(t)} width={bw * 0.68} height={Math.max(0, H - bot - y(t))} fill="none" stroke={GOLD} strokeOpacity={0.7} strokeWidth={1.3} strokeDasharray="3 2" rx={3} />
      ))}
      {counts.map((c, i) => {
        const fy = y(freqs[i]);
        return (
          <g key={i}>
            <rect x={L + i * bw + bw * 0.28} y={fy} width={bw * 0.44} height={Math.max(0, H - bot - fy)} fill={F} fillOpacity={0.85} rx={3} />
            <text x={L + i * bw + bw / 2} y={fy - 5} fill="#f5d0fe" fontSize={10} textAnchor="middle">{pct(freqs[i], counts.length > 8 ? 0 : 1)}</text>
            <text x={L + i * bw + bw / 2} y={H - 9} fill="#cbd5e1" fontSize={11} fontWeight={700} textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
      {flat && theory[0] > 0 && <line x1={L} y1={y(theory[0])} x2={W - L} y2={y(theory[0])} stroke={GOLD} strokeWidth={1.8} strokeDasharray="6 4" />}
    </svg>
  );
}

export default function ChanceLab({ config }: { config?: Record<string, unknown> }) {
  const e0 = config?.exp as string | undefined;
  const [exp, setExp] = useState<Exp>(e0 === "dice" || e0 === "two" || e0 === "spin" ? e0 : "coin");
  // coin / dice
  const [ht, setHT] = useState({ h: 0, t: 0 });
  const [face, setFace] = useState<null | "H" | "T">(null);
  const [faces, setFaces] = useState<number[]>(zeros(6));
  const [lastD, setLastD] = useState(0);
  // two dice: counts of ordered pairs (a, b)
  const [grid, setGrid] = useState<number[][]>(() => Array.from({ length: 6 }, () => zeros(6)));
  // spinner
  const [nSect, setNSect] = useState(4);
  const [custom, setCustom] = useState(false);
  const [w, setW] = useState([1, 2, 3]);
  const [tally, setTally] = useState<number[]>(zeros(8));
  const [spins, setSpins] = useState(0);
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const flip = (n: number) => {
    let h = 0;
    for (let i = 0; i < n; i++) if (Math.random() < 0.5) h++;
    setHT((p) => ({ h: p.h + h, t: p.t + (n - h) }));
    if (n === 1) setFace(h ? "H" : "T");
  };
  const roll = (n: number) => {
    const add = zeros(6);
    let last = 0;
    for (let i = 0; i < n; i++) { const d = 1 + Math.floor(Math.random() * 6); add[d - 1]++; last = d; }
    setFaces((f) => f.map((c, i) => c + add[i]));
    if (n === 1) setLastD(last);
  };
  const roll2 = (n: number) => {
    const g = grid.map((r) => [...r]);
    for (let i = 0; i < n; i++) g[Math.floor(Math.random() * 6)][Math.floor(Math.random() * 6)]++;
    setGrid(g);
  };
  // spinner helpers
  const weights = custom ? w : Array.from({ length: nSect }, () => 1);
  const wTot = weights.reduce((a, b) => a + b, 0);
  const segs = weights.map((v) => v / wTot);
  const starts: number[] = [];
  let acc = 0;
  for (const s of segs) { starts.push(acc * 360); acc += s; }
  const nAct = custom ? 3 : nSect;
  const arc = (a0: number, a1: number) => {
    const P = (a: number) => `${70 + 62 * Math.sin((a * Math.PI) / 180)} ${70 - 62 * Math.cos((a * Math.PI) / 180)}`;
    return `M70 70 L${P(a0)} A62 62 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${P(a1)} Z`;
  };
  const pickSeg = () => {
    let r = Math.random(), k = segs.length - 1;
    for (let i = 0; i < segs.length; i++) { r -= segs[i]; if (r < 0) { k = i; break; } }
    return k;
  };
  const spin = () => {
    if (spinning) return;
    const k = pickSeg();
    const span = segs[k] * 360, margin = Math.min(6, span * 0.2);
    const target = starts[k] + margin + Math.random() * (span - 2 * margin);
    const cur = ((rot % 360) + 360) % 360;
    const delta = (((target - cur) % 360) + 360) % 360 + 1080 + Math.floor(Math.random() * 720);
    setSpinning(true);
    setRot(rot + delta);
    window.setTimeout(() => {
      setTally((t) => t.map((c, i) => (i === k ? c + 1 : c)));
      setSpins((s) => s + 1);
      setSpinning(false);
    }, 2050);
  };
  const spinN = (m: number) => {
    if (spinning) return;
    const add = zeros(8);
    for (let i = 0; i < m; i++) add[pickSeg()]++;
    setTally((t) => t.map((c, i) => c + add[i]));
    setSpins((s) => s + m);
  };
  const bumpN = (d: number) => {
    const v = Math.max(2, Math.min(8, nSect + d));
    if (v === nSect) return;
    setNSect(v); setTally(zeros(8)); setSpins(0);
  };
  const toggleCustom = () => { setCustom(!custom); setTally(zeros(8)); setSpins(0); };
  const reset = () => {
    if (exp === "coin") { setHT({ h: 0, t: 0 }); setFace(null); }
    else if (exp === "dice") { setFaces(zeros(6)); setLastD(0); }
    else if (exp === "two") setGrid(Array.from({ length: 6 }, () => zeros(6)));
    else { setTally(zeros(8)); setSpins(0); }
  };

  // derived readouts
  const coinTotal = ht.h + ht.t;
  const diceTotal = faces.reduce((a, b) => a + b, 0);
  const sums = zeros(13);
  grid.forEach((row, i) => row.forEach((c, j) => { sums[i + j + 2] += c; }));
  const twoTotal = sums.reduce((a, b) => a + b, 0);
  let best = 2;
  for (let s = 3; s <= 12; s++) if (sums[s] > sums[best]) best = s;
  const maxC = Math.max(1, ...grid.flat());
  const trials = exp === "coin" ? coinTotal : exp === "dice" ? diceTotal : exp === "two" ? twoTotal : spins;

  return (
    <div className="mx-auto w-full max-w-[620px] rounded-2xl border border-white/10 bg-[#0a0e22] p-4">
      {/* experiment switcher */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(["coin", "dice", "two", "spin"] as const).map((k) => (
          <button key={k} onClick={() => setExp(k)} aria-label={`switch to ${k} experiment`}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors ${exp === k ? "border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-200" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}>
            {LBL[k]}
          </button>
        ))}
        <span className="flex-1" />
        <button onClick={reset} aria-label="reset current experiment data" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:bg-white/10">⟲ Reset</button>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        {exp === "coin" && "Empirical P(heads) vs the theoretical 0.5 — flip a lot and watch the bars calm down."}
        {exp === "dice" && "Six faces, each 'should' show up 1/6 of the time — do they?"}
        {exp === "two" && "36 ordered pairs (a, b); sums cluster around 7. Brighter cell = more frequent pair."}
        {exp === "spin" && "A sector's probability = its angle ÷ 360. The tally follows the wheel."}
      </p>

      {/* viz */}
      {exp === "coin" && (
        <div className="mt-2 flex items-center gap-3">
          <svg viewBox="0 0 110 110" className="h-24 w-24 shrink-0" role="img" aria-label={`last flip: ${face ?? "none yet"}`}>
            <defs>
              <radialGradient id="clCoin" cx="35%" cy="30%" r="85%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
            </defs>
            <circle cx="55" cy="55" r="50" fill="url(#clCoin)" stroke="#fbbf24" strokeWidth="2.5" />
            <text x="55" y="71" textAnchor="middle" fontSize="44" fontWeight="900" fill="#78350f">{face ?? "?"}</text>
          </svg>
          <div className="min-w-0 flex-1"><BarChart labels={["Heads", "Tails"]} counts={[ht.h, ht.t]} theory={[0.5, 0.5]} /></div>
        </div>
      )}
      {exp === "dice" && <div className="mt-2"><BarChart labels={["1", "2", "3", "4", "5", "6"]} counts={faces} theory={Array.from({ length: 6 }, () => 1 / 6)} /></div>}
      {exp === "two" && (
        <div className="mt-2">
          <svg viewBox="0 0 340 164" className="w-full" role="img" aria-label="6 by 6 heat grid of ordered-pair counts">
            {grid.map((row, i) =>
              row.map((c, j) => (
                <g key={`c${i}${j}`}>
                  <rect x={26 + j * 23} y={18 + i * 23} width={21} height={21} rx={4} fill={F} fillOpacity={c ? 0.12 + 0.78 * (c / maxC) : 0.05} stroke="#fff" strokeOpacity={0.08} />
                  {c > 0 && <text x={36.5 + j * 23} y={31.5 + i * 23} fontSize={8.5} textAnchor="middle" fill="#fff" fillOpacity={0.9}>{c}</text>}
                </g>
              ))
            )}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={`l${i}`}>
                <text x={36.5 + i * 23} y={12} fontSize={9} textAnchor="middle" fill="#94a3b8">{i + 1}</text>
                <text x={15} y={31.5 + i * 23} fontSize={9} textAnchor="middle" fill="#94a3b8">{i + 1}</text>
              </g>
            ))}
            <text x={196} y={38} fontSize={11} fontWeight={800} fill="#f5d0fe">Pair heat-map (a, b)</text>
            <text x={196} y={56} fontSize={9.5} fill="#94a3b8">row = die A, col = die B</text>
            <text x={196} y={70} fontSize={9.5} fill="#94a3b8">diagonal cells → sum 7</text>
            <text x={196} y={96} fontSize={10.5} fill="#cbd5e1">rolls: {twoTotal.toLocaleString()}</text>
            <text x={196} y={114} fontSize={10.5} fill="#cbd5e1">top sum: {best} ({sums[best]}×)</text>
          </svg>
          <BarChart labels={["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]} counts={sums.slice(2)} theory={THEORY2} />
        </div>
      )}
      {exp === "spin" && (
        <div className="mt-2 flex items-center gap-4">
          <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0" role="img" aria-label="spinner wheel with pointer">
            {segs.map((s, i) => (
              <path key={i} d={arc(starts[i], starts[i] + s * 360)} fill={SECTCOL[i % SECTCOL.length]} stroke="#0a0e22" strokeWidth={1.5} />
            ))}
            <circle cx="70" cy="70" r="62" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={2} />
            {segs.map((s, i) => {
              const m = ((starts[i] + s * 180) * Math.PI) / 180;
              return <text key={`s${i}`} x={70 + 42 * Math.sin(m)} y={70 - 42 * Math.cos(m) + 3.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fillOpacity={0.95}>S{i + 1}</text>;
            })}
            <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: "70px 70px", transition: spinning ? "transform 2s cubic-bezier(0.15,0.85,0.1,1)" : "none" }}>
              <polygon points="70,10 63,70 77,70" fill={GOLD} stroke="#78350f" strokeWidth={1} />
            </g>
            <circle cx="70" cy="70" r="6.5" fill="#fde68a" stroke="#78350f" strokeWidth={1.5} />
          </svg>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 text-[11px]">
            {Array.from({ length: nAct }, (_, i) => (
              <span key={i} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
                <b style={{ color: SECTCOL[i % SECTCOL.length] }}>S{i + 1}</b> · {tally[i]}× · <b className="text-fuchsia-200">{pct(spins ? tally[i] / spins : 0)}</b> <span className="text-zinc-500">(exp {pct(segs[i])})</span>
              </span>
            ))}
            {spins === 0 && <span className="text-zinc-500">No spins yet — hit SPIN!</span>}
          </div>
        </div>
      )}

      {/* controls */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {exp === "coin" && ([1, 10, 100] as const).map((n) => (
          <button key={n} onClick={() => flip(n)} aria-label={`flip coin ${n} time${n > 1 ? "s" : ""}`} className={BTN}>Flip ×{n}</button>
        ))}
        {exp === "dice" && ([1, 10, 100] as const).map((n) => (
          <button key={n} onClick={() => roll(n)} aria-label={`roll die ${n} time${n > 1 ? "s" : ""}`} className={BTN}>Roll ×{n}</button>
        ))}
        {exp === "two" && ([100, 1000] as const).map((n) => (
          <button key={n} onClick={() => roll2(n)} aria-label={`roll two dice ${n} times`} className={BTN}>Roll ×{n}</button>
        ))}
        {exp === "spin" && (
          <>
            <button onClick={toggleCustom} aria-label="toggle between equal and custom sectors" className={BTN}>{custom ? "Custom weights" : `Equal sectors`}</button>
            {!custom ? (
              <>
                <button onClick={() => bumpN(-1)} disabled={nSect <= 2} aria-label="remove one sector" className={BTN}>−</button>
                <span className="text-xs font-bold text-fuchsia-200">{nSect} sectors</span>
                <button onClick={() => bumpN(1)} disabled={nSect >= 8} aria-label="add one sector" className={BTN}>+</button>
              </>
            ) : (
              w.map((v, i) => (
                <label key={i} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px]">
                  S{i + 1}
                  <input type="range" min={1} max={5} value={v} aria-label={`weight of sector ${i + 1}`} onChange={(ev) => setW(w.map((x, j) => (j === i ? parseInt(ev.target.value) : x)))} className="w-16 accent-fuchsia-400" />
                  <b className="text-fuchsia-200">{v}</b>
                </label>
              ))
            )}
            <button onClick={spin} disabled={spinning} aria-label="spin the wheel once" className="rounded-xl border border-fuchsia-400/50 bg-fuchsia-400/20 px-5 py-2.5 text-xs font-extrabold text-fuchsia-100 transition hover:bg-fuchsia-400/30 active:scale-95 disabled:opacity-40">🎯 SPIN!</button>
            <button onClick={() => spinN(10)} disabled={spinning} aria-label="spin ten times instantly" className={BTN}>Spin ×10</button>
          </>
        )}
      </div>

      {/* live readouts */}
      <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 text-[11px]">
        {exp === "coin" && (
          <>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">Heads: <b className="text-fuchsia-200">{ht.h}</b> ({pct(coinTotal ? ht.h / coinTotal : 0)})</span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">Tails: <b className="text-fuchsia-200">{ht.t}</b> ({pct(coinTotal ? ht.t / coinTotal : 0)})</span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">|obs − 0.5| = <b className="text-amber-300">{pct(coinTotal ? Math.abs(ht.h / coinTotal - 0.5) : 0)}</b></span>
          </>
        )}
        {exp === "dice" && (
          <>
            {lastD > 0 && <span className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1">last roll: <b className="text-amber-300">{lastD}</b></span>}
            {faces.map((c, i) => (
              <span key={i} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">face {i + 1}: obs <b className="text-fuchsia-200">{pct(diceTotal ? c / diceTotal : 0)}</b> <span className="text-zinc-500">(exp {pct(1 / 6)})</span></span>
            ))}
          </>
        )}
        {exp === "two" && (
          <>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">top sum: <b className="text-fuchsia-200">{best}</b> ({sums[best]}×, obs {pct(twoTotal ? sums[best] / twoTotal : 0)} · theory {pct(THEORY2[best - 2])})</span>
            {twoTotal >= 200 && best === 7 && <span className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 font-bold text-amber-300">⭐ most likely sum = 7 — theory agrees!</span>}
          </>
        )}
        {exp === "spin" && <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">wheel: {custom ? `weights ${w.join(" : ")}` : `${nSect} equal sectors`} · each sector P = angle/360</span>}
      </div>

      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-zinc-500">
        ⚖️ <b className="text-zinc-400">Law of large numbers:</b> as trials n grow, observed relative frequency settles onto the theoretical probability (dashed gold line / outlined bars).
      </p>
    </div>
  );
}
