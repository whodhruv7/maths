// ─── MATHS WARS · SHARED CONTRACTS ─────────────────────────────────────────
// Every chapter agent codes against these exact types. Do not modify without
// orchestrator approval.

export type QType = "numeric" | "mcq" | "tf" | "fill";
export type Diff = 1 | 2 | 3 | 4;

/** A fully self-contained, computationally-validated question. */
export interface Question {
  id: string;            // filled by engine: `${ch}.${gen}.${seed}`
  ch: number;            // 1..8 (Ganita Manjari chapter)
  sub: string;           // subtopic id, e.g. "s1"
  gen: string;           // generator id (key in chapter bank)
  type: QType;
  diff: Diff;            // 1 Foundation · 2 Core · 3 Advanced · 4 Challenge
  text: string;          // LaTeX allowed inside $...$
  choices?: string[];    // required for mcq (answer must be one of them)
  answer: string;        // canonical answer (numeric: plain number, e.g. "5.5")
  accept?: string[];     // extra accepted answer strings
  tol?: number;          // absolute numeric tolerance (default 1e-6)
  steps: string[];       // ordered worked solution, LaTeX in $...$
  concept: string;       // formula / property used
  hint1: string;         // nudge toward the concept
  hint2: string;         // nudge toward the next step
  mistake?: string;      // common mistake note
  given?: string[];      // "Given" list for solution deck
  find?: string;         // "Find" line for solution deck
  verify?: string;       // verification check line
  remember?: string;     // one-line takeaway
}

export type RNG = {
  next(): number;                       // [0,1)
  int(a: number, b: number): number;    // inclusive integer
  nz(a: number, b: number): number;     // non-zero integer in [a,b]
  pick<T>(arr: readonly T[]): T;
  sign(): 1 | -1;
};

export type GenFn = (r: RNG, d: Diff) => Question;

export type VizKind =
  | "none"
  | "coord"       // ch1 Cartesian plane + ch2 line graphs (CoordLab)
  | "numberline"  // ch3 (NumberLineLab)
  | "algebra"     // ch4 area models / tiles (AlgebraLab)
  | "circle"      // ch5 (CircleLab)
  | "geometry"    // ch6 shapes, perimeter & area (GeometryLab)
  | "chance"      // ch7 coin/dice/spinner simulators (ChanceLab)
  | "pattern";    // ch8 sequences + fractals (PatternLab)

export type Slide =
  | { k: "hook"; title: string; body: string }
  | { k: "explore"; title: string; body: string }                       // renders subtopic viz
  | { k: "predict"; title: string; body: string; options: string[]; correct: number; why: string }
  | { k: "explain"; title: string; html: string }                       // prose + $latex$, may use <b> <br/>
  | { k: "example"; title: string; steps: string[] }
  | { k: "mistake"; title: string; body: string }
  | { k: "check"; title: string; body: string; options: string[]; correct: number; why: string };

export interface Subtopic {
  id: string;              // "s1".."s5"
  title: string;
  objectives: string[];    // 2-4 crisp "You will be able to…" statements
  prereq?: string[];       // subtopic ids
  viz?: { kind: VizKind; config?: Record<string, unknown> };
  slides: Slide[];         // 5-8 slides following the learning loop
  gens: { id: string; label: string }[];  // generator ids (keys of chapter bank)
}

export interface ChapterContent {
  num: number;             // 1..8
  title: string;           // book chapter title
  world: string;           // world display name
  worldId: string;         // kebab id
  emoji: string;
  color: string;           // primary hex
  grad: [string, string];  // gradient pair
  blurb: string;           // one-line pitch for the world card
  boss: { title: string; desc: string };
  subtopics: Subtopic[];
  bank: Record<string, GenFn>;
  bankSize: Record<string, number>;  // honest distinct-question parameter space per gen
}
