import type { ChapterContent, Diff, GenFn, Question, RNG } from "./types";

// ─── Seeded RNG (mulberry32) ───────────────────────────────────────────────
export function makeRNG(seed: number): RNG {
  let a = seed >>> 0;
  const next = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => Math.floor(next() * (hi - lo + 1)) + lo;
  return {
    next,
    int,
    nz: (lo, hi) => { let v = 0; while (v === 0) v = int(lo, hi); return v; },
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    sign: () => (next() < 0.5 ? -1 : 1) as 1 | -1,
  };
}

let qCounter = 1;

export interface PickOpts {
  sub?: string;             // restrict to subtopic
  diff?: Diff | "mixed";    // default "mixed"
  avoid?: Set<string>;      // question ids to skip (recent)
}

const DIFFS: Diff[] = [1, 2, 3, 4];

/** Generate one fresh, unique question from a chapter's generator bank. */
export function pickQuestion(ch: ChapterContent, opts: PickOpts = {}): Question | null {
  const subs = opts.sub
    ? ch.subtopics.filter((s) => s.id === opts.sub && s.gens.length > 0)
    : ch.subtopics.filter((s) => s.gens.length > 0);
  if (subs.length === 0) return null;
  const r0 = makeRNG((Date.now() ^ (qCounter++ * 2654435761)) >>> 0);
  const sub = r0.pick(subs);
  let gen: GenFn | null = null;
  let genId = "";
  const pool = [...sub.gens];
  while (pool.length > 0 && !gen) {
    const idx = r0.int(0, pool.length - 1);
    genId = pool[idx].id;
    gen = ch.bank[genId] ?? null;
    if (!gen) pool.splice(idx, 1);
  }
  if (!gen) return null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const seed = ((Date.now() ^ ((qCounter + attempt) * 0x9e3779b9)) >>> 0) + attempt * 7919;
    const r = makeRNG(seed);
    const diff: Diff =
      opts.diff && opts.diff !== "mixed" ? opts.diff : DIFFS[Math.min(3, Math.floor(r.next() * 4 * r.next() * 1.35))];
    try {
      const q = gen(r, diff);
      if (opts.avoid && opts.avoid.has(`${ch.num}.${genId}.${seed}`)) continue;
      return { ...q, id: `${ch.num}.${genId}.${seed}`, ch: ch.num, sub: sub.id, gen: genId, diff };
    } catch {
      continue;
    }
  }
  return null;
}

// ─── Answer checking ───────────────────────────────────────────────────────
export function normStr(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[，,]/g, ",");
}

function parseNumLike(s: string): number | null {
  const t = s.trim().toLowerCase().replace(/\s+/g, "").replace(/−/g, "-");
  if (/^[+-]?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  const fr = t.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (fr) {
    const den = parseFloat(fr[2]);
    if (den === 0) return null;
    return parseFloat(fr[1]) / den;
  }
  return null;
}

export interface CheckResult { ok: boolean; seen: string }

export function checkAnswer(q: Question, raw: string): CheckResult {
  const seen = raw.trim();
  if (q.type === "numeric") {
    const got = parseNumLike(seen);
    if (got === null || !isFinite(got)) return { ok: false, seen };
    const exp = parseNumLike(q.answer);
    if (exp === null) return { ok: false, seen };
    const tol = q.tol ?? 1e-6;
    const ok = Math.abs(got - exp) <= Math.max(tol, tol * Math.abs(exp));
    return { ok, seen };
  }
  const n = normStr(seen);
  const answers = [q.answer, ...(q.accept ?? [])].map(normStr);
  if (q.type === "tf") {
    const map: Record<string, string> = { t: "true", true: "true", f: "false", false: "false", "1": "true", "0": "false" };
    const g = map[n] ?? n;
    return { ok: answers.includes(g), seen };
  }
  return { ok: answers.includes(n), seen };
}

// ─── Bank metrics ──────────────────────────────────────────────────────────
export function bankTotalOf(ch: ChapterContent): number {
  return Object.values(ch.bankSize).reduce((a, b) => a + b, 0);
}

export function chapterByNum(num: number): ChapterContent | undefined {
  return CHAPTERS.find((c) => c.num === num);
}

// Late import to avoid circular init issues at module load.
import { CHAPTERS } from "@/content/wars";
