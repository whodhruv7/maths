import type { Diff, GenFn, Question, RNG } from "@/lib/wars/types";

// ─── CHANCE KINGDOM · Chapter 7 generator bank ─────────────────────────────
// Every probability is computed from a real enumeration / count and expressed
// as a REDUCED fraction "a/b" (gcd reduction). Decimals are accepted too.

// ─── helpers ───────────────────────────────────────────────────────────────
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));

/** Reduced fraction "a/b"; 0 and whole numbers collapse to "0" / "1". */
const red = (n: number, d: number): string => {
  if (n === 0) return "0";
  if (n === d) return "1";
  const g = gcd(n, d) || 1;
  return `${n / g}/${d / g}`;
};

/** "a/b" → "\frac{a}{b}" for LaTeX display; "0" and "1" stay plain. */
const tex = (f: string): string => (f.includes("/") ? `\\frac{${f.split("/")[0]}}{${f.split("/")[1]}}` : f);

/** Exact terminating decimal string, or null if the fraction is recurring. */
function decOf(n: number, d: number): string | null {
  const g = gcd(n, d) || 1;
  let dd = Math.floor(d / g);
  while (dd % 2 === 0) dd /= 2;
  while (dd % 5 === 0) dd /= 5;
  if (dd !== 1) return null;
  const v = n / d;
  if (v === 0) return "0";
  let s = v.toFixed(6);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

/** Canonical answer (reduced fraction) + accepted alternates (raw fraction, decimals). */
function pAns(n: number, d: number): { answer: string; accept: string[] } {
  const answer = red(n, d);
  const acc = new Set<string>([answer, `${n}/${d}`]);
  const ex = decOf(n, d);
  if (ex !== null) acc.add(ex);
  else {
    const v = n / d;
    acc.add(v.toFixed(3));
    acc.add(v.toFixed(4));
  }
  return { answer, accept: [...acc] };
}

function baseQ(p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">): Question {
  return { type: "fill", diff: 1, ch: 7, sub: "s1", gen: "x", id: "x", ...p };
}

function shuffle<T>(arr: readonly T[], r: RNG): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isPrime = (x: number): boolean => {
  if (x < 2) return false;
  for (let p = 2; p * p <= x; p++) if (x % p === 0) return false;
  return true;
};

/** All 36 ordered pairs for two six-sided dice. */
const dicePairs = (): [number, number][] => {
  const out: [number, number][] = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) out.push([a, b]);
  return out;
};

/** All 2^n head/tail strings of length n. */
function coinStrings(n: number): string[] {
  const out: string[] = [];
  for (let m = 0; m < 2 ** n; m++) out.push(m.toString(2).padStart(n, "0").replace(/0/g, "T").replace(/1/g, "H"));
  return out;
}

const countH = (s: string): number => (s.match(/H/g) ?? []).length;
const setStr = (arr: (string | number)[]): string => `{${arr.join(", ")}}`;

/** Standard worked-solution steps for P = fav/total. */
function pSteps(fav: number, total: number, favDesc: string, totalDesc: string): string[] {
  const g = gcd(fav, total) || 1;
  const steps = [
    `Count the favourable outcomes: ${favDesc} — there are $${fav}$.`,
    `Count all equally likely outcomes: ${totalDesc} — so $n(S) = ${total}$.`,
    `$P(E) = \\frac{\\text{favourable}}{\\text{total}} = \\frac{${fav}}{${total}}$.`,
  ];
  if (g > 1) steps.push(`Reduce by the GCD $${g}$: $\\frac{${fav}}{${total}} = \\frac{${fav / g}}{${total / g}}$.`);
  else steps.push(`$\\frac{${fav}}{${total}}$ is already in lowest terms.`);
  return steps;
}

// ─── 1. simple-dice ────────────────────────────────────────────────────────
const simpleDice: GenFn = (r, d) => {
  if (d === 1) {
    const k = r.int(1, 6);
    const p = pAns(1, 6);
    return baseQ({
      text: `A fair six-sided die is rolled once. What is the probability of rolling a $${k}$? (Give the fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `A fair die has $6$ equally likely faces: $S = \\{1, 2, 3, 4, 5, 6\\}$.`,
        `Only one face shows $${k}$, so the number of favourable outcomes is $1$.`,
        `$P(\\text{rolling } ${k}) = \\frac{1}{6}$.`,
        `As a decimal that is about $0.167$, i.e. a $16.7\\%$ chance.`,
      ],
      concept: "P(E) = favourable outcomes ÷ total equally likely outcomes",
      hint1: "Count the faces that work, then count all faces.",
      hint2: `Only one face shows $${k}$, and a die has six faces.`,
      mistake: "The denominator is always the TOTAL number of outcomes (6), never the number rolled.",
      verify: "$0 < 1/6 < 1$ ✓ — a valid probability.",
      remember: "Any single face of a fair die has probability $1/6$.",
    });
  }
  const faces = [1, 2, 3, 4, 5, 6];
  if (d === 2) {
    const evs: { label: string; set: number[] }[] = [
      { label: "an even number", set: [2, 4, 6] },
      { label: "an odd number", set: [1, 3, 5] },
      { label: "a prime number", set: [2, 3, 5] },
      { label: "a perfect square", set: [1, 4] },
      { label: "a multiple of $3$", set: [3, 6] },
      { label: "a factor of $6$", set: [1, 2, 3, 6] },
    ];
    const k1 = r.int(2, 5);
    evs.push({ label: `a number greater than $${k1}$`, set: faces.filter((x) => x > k1) });
    const k2 = r.int(2, 6);
    evs.push({ label: `a number at least $${k2}$`, set: faces.filter((x) => x >= k2) });
    const k3 = r.int(3, 6);
    evs.push({ label: `a number less than $${k3}$`, set: faces.filter((x) => x < k3) });
    const k4 = r.int(2, 5);
    evs.push({ label: `a number at most $${k4}$`, set: faces.filter((x) => x <= k4) });
    const ev = r.pick(evs);
    const p = pAns(ev.set.length, 6);
    return baseQ({
      text: `A fair die is rolled once. Find $P(E)$, where $E$ is “rolling ${ev.label}”. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: pSteps(ev.set.length, 6, `the faces ${ev.label}: ${setStr(ev.set)}`, "the six faces $\\{1,2,3,4,5,6\\}$"),
      concept: "Theoretical probability of an event on a fair die",
      hint1: "List which faces satisfy the event first.",
      hint2: `Count that list, then divide by $6$.`,
      mistake: "Check each face one by one — don't eyeball “about half”. Primes on a die are $2, 3, 5$ (not $1$!).",
      verify: `$0 \\le ${p.answer} \\le 1$ ✓`,
      remember: "List the favourable faces, count them, divide by 6.",
    });
  }
  if (d === 3) {
    const combos: { label: string; test: (x: number) => boolean }[] = [
      { label: "even and greater than $3$", test: (x) => x % 2 === 0 && x > 3 },
      { label: "odd and prime", test: (x) => x % 2 === 1 && isPrime(x) },
      { label: "even and less than $5$", test: (x) => x % 2 === 0 && x < 5 },
      { label: "a multiple of $2$ or $3$", test: (x) => x % 2 === 0 || x % 3 === 0 },
      { label: "prime or a perfect square", test: (x) => isPrime(x) || x === 1 || x === 4 },
      { label: "not a prime number", test: (x) => !isPrime(x) },
      { label: "even but not $4$", test: (x) => x % 2 === 0 && x !== 4 },
      { label: "greater than $2$ but less than $6$", test: (x) => x > 2 && x < 6 },
    ];
    const c = r.pick(combos);
    const set = faces.filter(c.test);
    const p = pAns(set.length, 6);
    return baseQ({
      text: `A fair die is rolled once. Find the probability that the score is ${c.label}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Test each face against the condition “${c.label.replace(/\$/g, "")}”.`,
        `The favourable outcomes are ${setStr(set)} — that is $${set.length}$ face${set.length === 1 ? "" : "s"}.`,
        `Total outcomes $n(S) = 6$.`,
        `$P(E) = \\frac{${set.length}}{6}${p.answer !== `${set.length}/6` ? ` = ${p.answer.includes("/") ? `\\frac{${p.answer.split("/")[0]}}{${p.answer.split("/")[1]}}` : p.answer}` : ""}$.`,
      ],
      concept: "Events defined by two conditions on one die",
      hint1: "Walk through faces 1 to 6 and keep the ones that pass both parts of the condition.",
      hint2: "‘Or’ usually adds outcomes; ‘and’ keeps only faces satisfying both parts.",
      mistake: "$1$ is not prime! And “multiple of 2 or 3” includes $6$ only once — never double-count a face.",
      verify: `Favourable count $${set.length}$ satisfies $1 \\le ${set.length} \\le 5$ ✓`,
      remember: "For combined conditions, build the set first — then count it.",
    });
  }
  // d === 4 : complements on a die, or given-P(E) find P(not E)
  if (r.next() < 0.5) {
    const pool: { ev: string; fav: number }[] = [
      { ev: "rolling a $6$", fav: 1 },
      { ev: "rolling an even number", fav: 3 },
      { ev: "rolling a prime number", fav: 3 },
      { ev: "rolling a multiple of $3$", fav: 2 },
      { ev: "rolling at most $4$", fav: 4 },
      { ev: "rolling at least $5$", fav: 2 },
      { ev: "rolling a perfect square", fav: 2 },
    ];
    const e = r.pick(pool);
    const p = pAns(6 - e.fav, 6);
    return baseQ({
      diff: d,
      text: `A fair die is rolled once. If $E$ is “${e.ev}”, find $P(\\text{not } E)$. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Event $E$ = ${e.ev} happens on $${e.fav}$ of the $6$ faces.`,
        `Complement rule: $P(\\text{not } E) = 1 - P(E)$.`,
        `$P(E) = \\frac{${e.fav}}{6}$, so $P(\\text{not } E) = 1 - \\frac{${e.fav}}{6} = \\frac{${6 - e.fav}}{6}$.`,
        `Reduced: $${tex(p.answer)}$.`,
      ],
      concept: "Complement rule P(not E) = 1 − P(E)",
      hint1: "“Not E” means every face EXCEPT the ones in E.",
      hint2: `Count E's faces (${e.fav}), subtract from 6.`,
      mistake: "Don't flip the fraction — P(not E) is not 1/P(E).",
      verify: `Check: $P(E) + P(\\text{not } E) = \\frac{${e.fav}}{6} + \\frac{${6 - e.fav}}{6} = 1$ ✓`,
      remember: "P(not E) = 1 − P(E) — the two together fill the whole sample space.",
    });
  }
  const b = r.int(5, 12);
  const a = r.int(1, b - 1);
  const pE = pAns(a, b);
  const pNot = pAns(b - a, b);
  return baseQ({
    diff: d,
    text: `The probability of event $E$ is $\\frac{${a}}{${b}}$. What is $P(\\text{not } E)$? (Fraction $a/b$.)`,
    answer: pNot.answer, accept: pNot.accept,
    steps: [
      `Complement rule: $P(\\text{not } E) = 1 - P(E)$.`,
      `Write $1$ with denominator $${b}$: $1 = \\frac{${b}}{${b}}$.`,
      `$P(\\text{not } E) = \\frac{${b}}{${b}} - \\frac{${a}}{${b}} = \\frac{${b - a}}{${b}}$.`,
      pNot.answer !== `${b - a}/${b}` ? `Reduced: $${tex(pNot.answer)}$.` : `$\\frac{${b - a}}{${b}}$ is already in lowest terms.`,
    ],
    concept: "Complement rule with a given probability",
    hint1: "P(E) + P(not E) must equal exactly 1.",
    hint2: `Subtract the numerator from the denominator: ${b} − ${a}.`,
    mistake: "Subtracting fractions: only the NUMERATORS change when denominators match.",
    verify: `$\\frac{${a}}{${b}} + \\frac{${b - a}}{${b}} = \\frac{${b}}{${b}} = 1$ ✓`,
    remember: "P(not E) = 1 − P(E). If P(E) = a/b then P(not E) = (b − a)/b.",
  });
};

// ─── 2. simple-coin ────────────────────────────────────────────────────────
const simpleCoin: GenFn = (r, d) => {
  if (d === 1) {
    const face = r.pick(["heads", "tails"]);
    const p = pAns(1, 2);
    return baseQ({
      text: `A fair coin is tossed once. What is the probability of getting ${face}? (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Sample space: $S = \\{H, T\\}$, so $n(S) = 2$.`,
        `A fair coin makes both faces equally likely; ${face} is $1$ of them.`,
        `$P(${face === "heads" ? "H" : "T"}) = \\frac{1}{2}$ — an even chance.`,
      ],
      concept: "Equally likely outcomes of a fair coin",
      hint1: "How many outcomes does one toss have?",
      hint2: "Both faces are equally likely on a fair coin.",
      mistake: "A coin has no memory — previous tosses never change the 1/2.",
      remember: "Fair coin: P(H) = P(T) = 1/2.",
    });
  }
  const nToss = d === 2 ? 2 : 3;
  const outs = coinStrings(nToss);
  type Ev = { label: string; test: (o: string) => boolean };
  const evs2: Ev[] = [
    { label: "exactly two heads", test: (o) => countH(o) === 2 },
    { label: "exactly one head", test: (o) => countH(o) === 1 },
    { label: "at least one head", test: (o) => countH(o) >= 1 },
    { label: "no heads", test: (o) => countH(o) === 0 },
    { label: "at least one tail", test: (o) => countH(o) <= 1 },
    { label: "both coins showing the same face", test: (o) => o === "HH" || o === "TT" },
    { label: "the two coins showing different faces", test: (o) => o === "HT" || o === "TH" },
  ];
  const evs3: Ev[] = [
    { label: "exactly two heads", test: (o) => countH(o) === 2 },
    { label: "exactly one head", test: (o) => countH(o) === 1 },
    { label: "exactly three heads", test: (o) => countH(o) === 3 },
    { label: "at least one head", test: (o) => countH(o) >= 1 },
    { label: "at least two heads", test: (o) => countH(o) >= 2 },
    { label: "exactly one tail", test: (o) => countH(o) === 2 },
    { label: "all three coins showing the same face", test: (o) => o === "HHH" || o === "TTT" },
  ];
  const ev = r.pick(d === 2 ? evs2 : evs3);
  const fav = outs.filter(ev.test);
  const p = pAns(fav.length, outs.length);
  return baseQ({
    diff: d,
    text: `A fair coin is tossed ${nToss === 2 ? "twice" : "three times"} (i.e. $${nToss}$ fair coins are flipped). Find $P(E)$ where $E$ is “${ev.label}”. (Fraction $a/b$.)`,
    answer: p.answer, accept: p.accept,
    steps: [
      `Sample space: $S = ${setStr(outs)}$ — a tree diagram gives $2^{${nToss}} = ${outs.length}$ outcomes.`,
      `The outcomes favouring $E$ are ${setStr(fav)} — $${fav.length}$ of them.`,
      `$P(E) = \\frac{${fav.length}}{${outs.length}}$.`,
      p.answer !== `${fav.length}/${outs.length}` ? `Reduced: $${tex(p.answer)}$.` : `Already in lowest terms.`,
    ],
    concept: "Multi-coin sample spaces and event probabilities",
    hint1: `List all $2^{${nToss}} = ${outs.length}$ outcomes — HT and TH are different outcomes.`,
    hint2: `Pick out the ones matching “${ev.label.replace(/\$/g, "")}” and count.`,
    mistake: "For two coins the sample space has 4 outcomes, not 3 — {HH, HT, TH, TT}.",
    verify: `Favourable count $${fav.length}$ is between $0$ and $${outs.length}$ ✓`,
    remember: "n coins → 2ⁿ outcomes; count paths, not summaries.",
  });
  // (d4 handled below — unreachable here because d<=3 returns above)
};

// d4 of simple-coin: complement trick for 4–5 tosses
const simpleCoinHard: GenFn = (r, _d) => {
  const n = r.pick([4, 5]);
  const face = r.pick(["head", "tail"]);
  const other = face === "head" ? "tail" : "head";
  const p = pAns(2 ** n - 1, 2 ** n);
  const allOther = other.repeat(n);
  return baseQ({
    diff: 4,
    text: `A fair coin is tossed $${n}$ times. Find the probability of getting $\\textbf{at least one } ${face}$. (Fraction $a/b$.)`,
    answer: p.answer, accept: p.accept,
    steps: [
      `A tree diagram gives $2^{${n}} = ${2 ** n}$ equally likely outcomes.`,
      `“At least one ${face}” is the COMPLEMENT of “no ${face} at all”.`,
      `Only one outcome has no ${face}s: $${allOther}$ — so $P(\\text{no } ${face}) = \\frac{1}{${2 ** n}}$.`,
      `$P(\\text{at least one } ${face}) = 1 - \\frac{1}{${2 ** n}} = \\frac{${2 ** n - 1}}{${2 ** n}}$.`,
    ],
    concept: "“At least one” via the complement rule",
    hint1: `Don't count ${2 ** n} − 1 paths one by one — use P(not E).`,
    hint2: "The opposite of “at least one head” is “all tails”.",
    mistake: "P(at least one) is NOT 1/2 — only one outcome avoids the event entirely.",
    verify: `$\\frac{${2 ** n - 1}}{${2 ** n}} + \\frac{1}{${2 ** n}} = 1$ ✓`,
    remember: "P(at least one) = 1 − P(none).",
  });
};

// ─── 3. complement ─────────────────────────────────────────────────────────
const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const WORDS = ["PEACE", "PROBABILITY", "MATHEMATICS", "MISSISSIPPI", "BANANA", "STATISTICS", "CHANCE", "KINGDOM", "FORTUNE", "RANDOM", "ADVENTURE", "BUBBLES"];

const complement: GenFn = (r, d) => {
  if (d === 1) {
    const pool: { ev: string; fav: number }[] = [
      { ev: "a $6$", fav: 1 },
      { ev: "an even number", fav: 3 },
      { ev: "a prime number", fav: 3 },
      { ev: "a multiple of $3$", fav: 2 },
      { ev: "a perfect square", fav: 2 },
      { ev: "a number greater than $4$", fav: 2 },
    ];
    const e = r.pick(pool);
    const p = pAns(6 - e.fav, 6);
    return baseQ({
      diff: d,
      text: `A fair die is rolled once. Find the probability that the score is NOT ${e.ev}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `${e.ev.charAt(0).toUpperCase() + e.ev.slice(1)} occurs on $${e.fav}$ face${e.fav === 1 ? "" : "s"} out of $6$, so $P(E) = \\frac{${e.fav}}{6}$.`,
        `Complement rule: $P(\\text{not } E) = 1 - P(E) = 1 - \\frac{${e.fav}}{6}$.`,
        `$P(\\text{not } E) = \\frac{${6 - e.fav}}{6}$, which is $${p.answer}$ in lowest terms.`,
      ],
      concept: "Complement rule on a single die",
      hint1: "First find P(E), then subtract from 1.",
      hint2: "Or directly: count the faces that are NOT in E.",
      mistake: "Don't forget $1$ is neither prime nor even — it hides in many complements.",
      verify: `$P(E) + P(\\text{not } E) = 1$ ✓`,
      remember: "P(not E) = 1 − P(E).",
    });
  }
  if (d === 2) {
    const b = r.int(5, 12);
    const a = r.int(1, b - 1);
    const pNot = pAns(b - a, b);
    return baseQ({
      diff: d,
      text: `For a random experiment, $P(E) = \\frac{${a}}{${b}}$. Find $P(\\text{not } E)$. (Fraction $a/b$.)`,
      answer: pNot.answer, accept: pNot.accept,
      steps: [
        `The event $E$ and its complement “not $E$” together cover the whole sample space.`,
        `So $P(E) + P(\\text{not } E) = 1$.`,
        `$P(\\text{not } E) = 1 - \\frac{${a}}{${b}} = \\frac{${b}}{${b}} - \\frac{${a}}{${b}} = \\frac{${b - a}}{${b}}$.`,
        pNot.answer !== `${b - a}/${b}` ? `Reduced: $${tex(pNot.answer)}$.` : `Already in lowest terms.`,
      ],
      concept: "Complement rule P(not E) = 1 − P(E)",
      hint1: "The two probabilities must add to exactly 1.",
      hint2: `Compute ${b} − ${a} over the common denominator ${b}.`,
      mistake: "Answer 0 would mean E is certain — only true when P(E) = 1.",
      verify: `$\\frac{${a}}{${b}} + ${pNot.answer} = 1$ ✓`,
      remember: "P(E) + P(not E) = 1 always.",
    });
  }
  if (d === 3) {
    const kind = r.int(0, 2);
    if (kind === 0) {
      const w = r.pick(WORDS);
      const cons = [...w].filter((c) => !VOWELS.has(c)).length;
      const p = pAns(cons, w.length);
      return baseQ({
        diff: d,
        text: `A letter is chosen at random from the word “${w}”. Find the probability that it is NOT a vowel. (Fraction $a/b$.)`,
        answer: p.answer, accept: p.accept,
        steps: [
          `“${w}” has $${w.length}$ letters — $n(S) = ${w.length}$ (each letter slip is one outcome).`,
          `Vowels in it: ${[...w].filter((c) => VOWELS.has(c)).join(", ") || "none"} — so consonants number $${cons}$.`,
          `Complement route: $P(\\text{vowel}) = \\frac{${w.length - cons}}{${w.length}}$, so $P(\\text{not vowel}) = 1 - \\frac{${w.length - cons}}{${w.length}} = \\frac{${cons}}{${w.length}}$.`,
          p.answer !== `${cons}/${w.length}` ? `Reduced: $${tex(p.answer)}$.` : `Already in lowest terms.`,
        ],
        concept: "Complement of a letter event in a word",
        hint1: "Count the consonants directly, or count vowels and subtract.",
        hint2: "Each of the letter positions is one equally likely outcome.",
        mistake: "Repeated letters count once each per position — two E's are two outcomes.",
        remember: "P(not vowel) = consonants ÷ total letters.",
      });
    }
    if (kind === 1) {
      const pool = [
        { ev: "a face card (J, Q or K)", fav: 12, why: "3 face cards × 4 suits" },
        { ev: "a heart", fav: 13, why: "each suit has 13 cards" },
        { ev: "a king", fav: 4, why: "one king per suit" },
      ];
      const e = r.pick(pool);
      const p = pAns(52 - e.fav, 52);
      return baseQ({
        diff: d,
        text: `One card is drawn at random from a standard deck of $52$. Find $P(\\text{not } E)$ where $E$ is “drawing ${e.ev}”. (Fraction $a/b$.)`,
        answer: p.answer, accept: p.accept,
        steps: [
          `A deck has $52$ cards; $E$ holds $${e.fav}$ of them (${e.why}).`,
          `$P(E) = \\frac{${e.fav}}{52}$.`,
          `$P(\\text{not } E) = 1 - \\frac{${e.fav}}{52} = \\frac{${52 - e.fav}}{52}$.`,
          p.answer !== `${52 - e.fav}/52` ? `Reduced: $${tex(p.answer)}$.` : `Already in lowest terms.`,
        ],
        concept: "Complements with a standard deck",
        hint1: "Find how many cards ARE in E first.",
        hint2: `“Not E” has ${52 - e.fav} cards.`,
        remember: "not E = the other cards — 52 minus E's count.",
      });
    }
    const k = r.int(0, 1);
    const ev = k === 0 ? { label: "a multiple of $3$", set: [3, 6] } : { label: "an odd number", set: [1, 3, 5, 7] };
    const p = pAns(8 - ev.set.length, 8);
    return baseQ({
      diff: d,
      text: `A spinner has $8$ equal sectors numbered $1$ to $8$. The arrow is spun once. Find the probability that it does NOT point at ${ev.label}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Sample space: $S = \\{1, \\ldots, 8\\}$, $n(S) = 8$.`,
        `${ev.label.charAt(0).toUpperCase() + ev.label.slice(1)}: ${setStr(ev.set)} — $${ev.set.length}$ sectors, so $P(E) = \\frac{${ev.set.length}}{8}$.`,
        `$P(\\text{not } E) = 1 - \\frac{${ev.set.length}}{8} = \\frac{${8 - ev.set.length}}{8}$.`,
        p.answer !== `${8 - ev.set.length}/8` ? `Reduced: $${tex(p.answer)}$.` : `Already in lowest terms.`,
      ],
      concept: "Complement on an equally likely numbered spinner",
      hint1: "List E's numbers first.",
      hint2: "Whatever is left over is “not E”.",
      remember: "Complements swap “is” for “is not” — count the leftovers.",
    });
  }
  // d === 4 : “at least one” via complement
  const games = [
    {
      title: "Two fair dice are rolled once. Find the probability that AT LEAST ONE die shows a $6$.",
      total: 36, none: 25, noneDesc: "$5 \\times 5 = 25$ outcomes show no six at all (each die has 5 non-six faces)",
    },
    {
      title: "Two fair dice are rolled once. Find the probability that they do NOT show the same number (no doubles).",
      total: 36, none: 6, noneDesc: "only $6$ outcomes are doubles",
    },
    {
      title: "A fair coin is tossed $3$ times. Find the probability of getting AT LEAST one head.",
      total: 8, none: 1, noneDesc: "only $TTT$ avoids heads",
    },
    {
      title: "A fair coin is tossed $4$ times. Find the probability of getting AT LEAST one tail.",
      total: 16, none: 1, noneDesc: "only $HHHH$ avoids tails",
    },
    {
      title: "Two fair dice are rolled once. Find the probability that the sum is NOT $7$.",
      total: 36, none: 6, noneDesc: "exactly $6$ pairs make the sum $7$",
    },
  ];
  const g = r.pick(games);
  const p = pAns(g.total - g.none, g.total);
  return baseQ({
    diff: d,
    text: `${g.title} (Fraction $a/b$.)`,
    answer: p.answer, accept: p.accept,
    steps: [
      `The experiment has $${g.total}$ equally likely outcomes.`,
      `The complement (“none of it happens”) is easy to count: ${g.noneDesc}.`,
      `So $P(\\text{complement}) = \\frac{${g.none}}{${g.total}}$.`,
      `$P(E) = 1 - \\frac{${g.none}}{${g.total}} = \\frac{${g.total - g.none}}{${g.total}}$`,
      p.answer !== `${g.total - g.none}/${g.total}` ? `Reduced: $${tex(p.answer)}$.` : `Already in lowest terms.`,
    ],
    concept: "“At least one” and “not” events via the complement rule",
    hint1: "Flip the question: count the outcomes where it does NOT happen.",
    hint2: "Then subtract that fraction from 1.",
    mistake: "For two dice, “at least one 6” is 11/36, not 1/6 + 1/6 — that double-counts (6,6).",
    verify: `$\\frac{${g.none}}{${g.total}} + ${p.answer} = 1$ ✓`,
    remember: "P(at least one…) = 1 − P(none…).",
  });
};

// ─── 4. sum-two-dice ───────────────────────────────────────────────────────
const sumTwoDice: GenFn = (r, d) => {
  const pairs = dicePairs();
  const build = (label: string, pred: (a: number, b: number) => number, listPairs: boolean, dval: Diff) => {
    const fav = pairs.filter(([a, b]) => pred(a, b) !== 0);
    const p = pAns(fav.length, 36);
    const steps = [
      `Rolling two dice gives $6 \\times 6 = 36$ equally likely ordered outcomes.`,
      listPairs
        ? `The favourable pairs are ${fav.map(([a, b]) => `(${a},${b})`).join(", ")} — $${fav.length}$ of them.`
        : `A full count over the $36$ pairs (a sum table helps) shows $${fav.length}$ favourable outcomes.`,
      `$P(E) = \\frac{${fav.length}}{36}$.`,
      p.answer !== `${fav.length}/36` ? `Reduce: $\\frac{${fav.length}}{36} = ${tex(p.answer)}$.` : `Already in lowest terms.`,
    ];
    return baseQ({
      diff: dval,
      text: `${label} (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps,
      concept: "Two-dice sample space and event probabilities",
      hint1: "Total outcomes = 36 (6 faces × 6 faces), and order matters.",
      hint2: listPairs ? "List the pairs systematically: fix the first die, run the second." : "A 6×6 sum table makes counting foolproof.",
      mistake: "(3,4) and (4,3) are two different outcomes — don't merge them.",
      verify: `$0 < \\frac{${fav.length}}{36} \\le 1$ ✓`,
      remember: "Two dice → 36 ordered outcomes; count pairs, then reduce.",
    });
  };
  if (d === 1 || d === 2) {
    const k = r.int(2, 12);
    return build(`Two fair dice are rolled. Find the probability that the sum of the two numbers is $${k}$.`, (a, b) => (a + b === k ? 1 : 0), true, d);
  }
  if (d === 3) {
    const k = r.int(6, 9);
    const which = r.int(0, 2);
    if (which === 0) return build(`Two fair dice are rolled. Find the probability that the sum is greater than $${k}$.`, (a, b) => (a + b > k ? 1 : 0), false, d);
    if (which === 1) return build(`Two fair dice are rolled. Find the probability that the sum is at most $${k}$.`, (a, b) => (a + b <= k ? 1 : 0), false, d);
    return build(`Two fair dice are rolled. Find the probability that the sum is a prime number.`, (a, b) => (isPrime(a + b) ? 1 : 0), false, d);
  }
  const which = r.int(0, 5);
  if (which === 0) { const m = r.pick([5, 6, 8, 12]); return build(`Two fair dice are rolled. Find the probability that the PRODUCT of the two numbers is $${m}$.`, (a, b) => (a * b === m ? 1 : 0), true, d); }
  if (which === 1) { const t = r.int(0, 3); return build(`Two fair dice are rolled. Find the probability that the two numbers differ by exactly $${t}$ — that is $|a - b| = ${t}$.`, (a, b) => (Math.abs(a - b) === t ? 1 : 0), t === 0, d); }
  if (which === 2) return build(`Two fair dice are rolled. Find the probability that both dice show odd numbers.`, (a, b) => (a % 2 === 1 && b % 2 === 1 ? 1 : 0), false, d);
  if (which === 3) return build(`Two fair dice are rolled. Find the probability that the product of the two numbers is even.`, (a, b) => (a * b % 2 === 0 ? 1 : 0), false, d);
  if (which === 4) return build(`Two fair dice are rolled. Find the probability that at least one die shows a $6$.`, (a, b) => (a === 6 || b === 6 ? 1 : 0), false, d);
  return build(`Two fair dice are rolled. Find the probability that both dice show the same number (doubles).`, (a, b) => (a === b ? 1 : 0), true, d);
};

// ─── 5. marble-bag ─────────────────────────────────────────────────────────
const marbleBag: GenFn = (r, d) => {
  const cols = ["red", "blue", "green"];
  if (d === 1) {
    const a = r.int(2, 6), b = r.int(2, 6);
    const ask = r.pick([0, 1]);
    const p = pAns(ask === 0 ? a : b, a + b);
    return baseQ({
      diff: d,
      text: `A bag contains $${a}$ red and $${b}$ blue marbles. One marble is drawn at random. Find the probability that it is ${ask === 0 ? "red" : "blue"}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: pSteps(ask === 0 ? a : b, a + b, `${ask === 0 ? "red" : "blue"} marbles: $${ask === 0 ? a : b}$`, `all marbles: $${a} + ${b} = ${a + b}$`),
      concept: "Probability of drawing a colour from a bag",
      hint1: "Total marbles = red + blue.",
      hint2: "Divide the colour's count by the total, then reduce.",
      mistake: "The denominator is the total marbles, not just the marbles of one colour.",
      remember: "P(colour) = (number of that colour) ÷ (total marbles).",
    });
  }
  if (d === 2) {
    const c = [r.int(2, 7), r.int(2, 7), r.int(2, 7)];
    const total = c[0] + c[1] + c[2];
    const ask = r.int(0, 2);
    const p = pAns(c[ask], total);
    return baseQ({
      diff: d,
      text: `A bag contains $${c[0]}$ red, $${c[1]}$ blue and $${c[2]}$ green marbles. One marble is drawn at random. Find the probability that it is ${cols[ask]}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: pSteps(c[ask], total, `${cols[ask]} marbles: $${c[ask]}$`, `all marbles: $${c[0]} + ${c[1]} + ${c[2]} = ${total}$`),
      concept: "Probability with three-colour bags",
      hint1: "Add all three counts for the total.",
      hint2: `There are ${c[ask]} ${cols[ask]} marbles.`,
      mistake: "Only the asked colour goes in the numerator — the others form the rest of the bag.",
      remember: "Every colour probability is its count over the grand total.",
    });
  }
  if (d === 3) {
    const c = [r.int(2, 7), r.int(2, 7), r.int(2, 7)];
    const total = c[0] + c[1] + c[2];
    const mode = r.int(0, 1);
    if (mode === 0) {
      const ask = r.int(0, 2);
      const fav = total - c[ask];
      const p = pAns(fav, total);
      return baseQ({
        diff: d,
        text: `A bag contains $${c[0]}$ red, $${c[1]}$ blue and $${c[2]}$ green marbles. One marble is drawn at random. Find the probability that it is NOT ${cols[ask]}. (Fraction $a/b$.)`,
        answer: p.answer, accept: p.accept,
        steps: [
          `Total marbles: $${c[0]} + ${c[1]} + ${c[2]} = ${total}$.`,
          `P(${cols[ask]}) = $\\frac{${c[ask]}}{${total}}$, so by the complement rule P(not ${cols[ask]}) $= 1 - \\frac{${c[ask]}}{${total}}$.`,
          `Equivalently, count directly: $${c[(ask + 1) % 3]} + ${c[(ask + 2) % 3]} = ${fav}$ marbles are not ${cols[ask]}.`,
          `$P(\\text{not } ${cols[ask]}) = \\frac{${fav}}{${total}} = ${p.answer}$.`,
        ],
        concept: "Complement rule for bag draws",
        hint1: "“Not X” = the other two colours combined.",
        hint2: "Or use 1 − P(X).",
        mistake: "Don't subtract the colour's count from the denominator — subtract P(X) from 1.",
        remember: "P(not X) = 1 − P(X) = (total − X's count)/total.",
      });
    }
    const pr = r.int(0, 2);
    const other = (pr + 1) % 3;
    const fav = c[pr] + c[other];
    const p = pAns(fav, total);
    return baseQ({
      diff: d,
      text: `A bag contains $${c[0]}$ red, $${c[1]}$ blue and $${c[2]}$ green marbles. One marble is drawn at random. Find the probability that it is ${cols[pr]} or ${cols[other]}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Total marbles: $${total}$.`,
        `Favourable: $${c[pr]}$ ${cols[pr]} $+$ $${c[other]}$ ${cols[other]} $= ${fav}$.`,
        `$P = \\frac{${fav}}{${total}}$.`,
        p.answer !== `${fav}/${total}` ? `Reduced: $${tex(p.answer)}$.` : `Already in lowest terms.`,
      ],
      concept: "Union of two colour events in one draw",
      hint1: "“X or Y” in one draw = add the two counts.",
      hint2: "One marble can't be both colours, so no overlap correction is needed.",
      mistake: "The denominator stays the grand total — don't add the two totals.",
      remember: "P(A or B) for disjoint events = P(A) + P(B).",
    });
  }
  // d === 4 : bag changes
  const c = [r.int(2, 7), r.int(2, 7), r.int(2, 7)];
  const total = c[0] + c[1] + c[2];
  const add = r.next() < 0.55;
  const colIdx = r.int(0, 2);
  let x: number, newC: number, newTotal: number;
  if (add) {
    x = r.int(1, 4);
    newC = c[colIdx] + x;
    newTotal = total + x;
  } else {
    const removable = [0, 1, 2].filter((i) => c[i] >= 3);
    const idx = removable.length > 0 ? r.pick(removable) : colIdx;
    x = Math.min(2, c[idx] - 1);
    newC = c[idx] - x;
    newTotal = total - x;
    return baseQ({
      diff: d,
      text: `A bag contains $${c[0]}$ red, $${c[1]}$ blue and $${c[2]}$ green marbles. $${x}$ ${cols[idx]} marble${x === 1 ? " is" : "s are"} taken out and kept aside. One marble is now drawn at random from the bag. Find the probability that it is ${cols[idx]}. (Fraction $a/b$.)`,
      answer: pAns(newC, newTotal).answer, accept: pAns(newC, newTotal).accept,
      steps: [
        `Start: $${c[0]} + ${c[1]} + ${c[2]} = ${total}$ marbles, of which $${c[idx]}$ are ${cols[idx]}.`,
        `After removing $${x}$: ${cols[idx]} left $= ${c[idx]} - ${x} = ${newC}$; total left $= ${total} - ${x} = ${newTotal}$.`,
        `$P = \\frac{${newC}}{${newTotal}}$.`,
        `Reduced: $${tex(pAns(newC, newTotal).answer)}$.`,
      ],
      concept: "Probability when the bag's contents change",
      hint1: "Update BOTH the numerator and the denominator.",
      hint2: "Remove x from the colour count AND from the total.",
      mistake: "Forgetting to shrink the total after removal is the classic slip.",
      remember: "Every change to the bag changes the total too.",
    });
  }
  return baseQ({
    diff: d,
    text: `A bag contains $${c[0]}$ red, $${c[1]}$ blue and $${c[2]}$ green marbles. $${x}$ extra ${cols[colIdx]} marbles are dropped in. One marble is now drawn at random. Find the probability that it is ${cols[colIdx]}. (Fraction $a/b$.)`,
    answer: pAns(newC, newTotal).answer, accept: pAns(newC, newTotal).accept,
    steps: [
      `Start: $${total}$ marbles with $${c[colIdx]}$ ${cols[colIdx]}.`,
      `After adding $${x}$: ${cols[colIdx]} $= ${c[colIdx]} + ${x} = ${newC}$; total $= ${total} + ${x} = ${newTotal}$.`,
      `$P = \\frac{${newC}}{${newTotal}}$.`,
      `Reduced: $${tex(pAns(newC, newTotal).answer)}$.`,
    ],
    concept: "Probability when the bag's contents change",
    hint1: "Add to the colour's count and to the total.",
    hint2: "Then simplify the new fraction.",
    mistake: "Adding marbles changes the denominator as well — the old total is gone.",
    remember: "New probability needs the NEW counts.",
  });
};

// ─── 6. cards-lite ─────────────────────────────────────────────────────────
const cardsLite: GenFn = (r, d) => {
  const pools: { label: string; fav: number; why: string }[][] = [
    [
      { label: "a heart", fav: 13, why: "each suit holds 13 cards" },
      { label: "a red card", fav: 26, why: "13 hearts + 13 diamonds" },
      { label: "a black card", fav: 26, why: "13 spades + 13 clubs" },
      { label: "a spade", fav: 13, why: "each suit holds 13 cards" },
      { label: "not a heart", fav: 39, why: "52 − 13 hearts" },
    ],
    [
      { label: "an ace", fav: 4, why: "one ace per suit" },
      { label: "a king", fav: 4, why: "one king per suit" },
      { label: "a face card (J, Q or K)", fav: 12, why: "3 face cards × 4 suits" },
      { label: "a seven", fav: 4, why: "one seven per suit" },
      { label: "a number card from 2 to 10", fav: 36, why: "9 values × 4 suits" },
      { label: "a queen or a king", fav: 8, why: "4 queens + 4 kings" },
    ],
    [
      { label: "not a face card", fav: 40, why: "52 − 12 face cards" },
      { label: "an ace or a king", fav: 8, why: "4 aces + 4 kings" },
      { label: "a heart or a spade", fav: 26, why: "13 + 13" },
      { label: "a red face card", fav: 6, why: "3 face cards × 2 red suits" },
      { label: "a card that is not red", fav: 26, why: "all 26 black cards" },
    ],
    [
      { label: "the queen of hearts", fav: 1, why: "exactly one such card exists" },
      { label: "a red king", fav: 2, why: "king of hearts + king of diamonds" },
      { label: "a face card of spades", fav: 3, why: "J, Q, K of spades" },
      { label: "the ace of spades", fav: 1, why: "exactly one such card exists" },
      { label: "a heart face card", fav: 3, why: "J, Q, K of hearts" },
      { label: "a black face card", fav: 6, why: "3 face cards × 2 black suits" },
    ],
  ];
  const e = r.pick(pools[d - 1]);
  const p = pAns(e.fav, 52);
  return baseQ({
    diff: d,
    text: `One card is drawn at random from a standard, well-shuffled deck of $52$ cards. Find the probability of drawing ${e.label}. (Fraction $a/b$.)`,
    answer: p.answer, accept: p.accept,
    steps: [
      `A standard deck: $52$ cards, $4$ suits of $13$, half red and half black.`,
      `Favourable cards: ${e.label} — ${e.why}, so $${e.fav}$ cards.`,
      `$P = \\frac{${e.fav}}{52}$.`,
      p.answer !== `${e.fav}/52` ? `Reduce: $\\frac{${e.fav}}{52} = ${tex(p.answer)}$.` : `Already in lowest terms.`,
    ],
    concept: "Probabilities with a standard 52-card deck",
    hint1: "Nail the deck facts first: 52 cards, 13 per suit, 12 face cards, 26 red.",
    hint2: `Count the favourable cards (${e.fav}), then reduce the fraction.`,
    mistake: "Face cards are J, Q, K only — aces are NOT face cards.",
    verify: `$0 \\le \\frac{${e.fav}}{52} \\le 1$ ✓`,
    remember: "Deck constants: 52 total · 13 per suit · 4 per rank · 12 face cards.",
  });
};

// ─── 7. spinner ────────────────────────────────────────────────────────────
const SPIN_COLORS = ["red", "blue", "green", "yellow", "purple"];
const SPIN8: { label: string; set: number[] }[] = [
  { label: "$8$", set: [8] },
  { label: "an odd number", set: [1, 3, 5, 7] },
  { label: "an even number", set: [2, 4, 6, 8] },
  { label: "a number greater than $2$", set: [3, 4, 5, 6, 7, 8] },
  { label: "a multiple of $3$", set: [3, 6] },
  { label: "a prime number", set: [2, 3, 5, 7] },
  { label: "a perfect square", set: [1, 4] },
  { label: "a factor of $8$", set: [1, 2, 4, 8] },
  { label: "a number greater than $6$", set: [7, 8] },
  { label: "a number less than $9$", set: [1, 2, 3, 4, 5, 6, 7, 8] },
];

function angleSectors(r: RNG, k: number): { name: string; angle: number }[] {
  // 24 units of 15°, split by k−1 distinct cut points → every sector ≥ 15°, sum = 360°
  const cuts = new Set<number>();
  while (cuts.size < k - 1) cuts.add(r.int(1, 23));
  const c = [...cuts].sort((x, y) => x - y);
  const segs: number[] = [];
  let prev = 0;
  for (const x of c) { segs.push(x - prev); prev = x; }
  segs.push(24 - prev);
  return segs.map((u, i) => ({ name: SPIN_COLORS[i], angle: u * 15 }));
}

const angleList = (sec: { name: string; angle: number }[]): string =>
  sec.map((s) => `${s.name} $${s.angle}^\\circ$`).join(", ");

const spinner: GenFn = (r, d) => {
  if (d === 1) {
    const sec = angleSectors(r, 4);
    const i = r.int(0, 3);
    const p = pAns(sec[i].angle, 360);
    return baseQ({
      diff: d,
      text: `A spinner is divided into $4$ sectors: ${angleList(sec)}. The arrow is spun once and lands with equal likelihood on any point of the circle. Find the probability that it stops on ${sec[i].name}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `On a spinner, probability = sector angle ÷ $360^\\circ$ (the full circle).`,
        `The ${sec[i].name} sector measures $${sec[i].angle}^\\circ$.`,
        `$P = \\frac{${sec[i].angle}}{360}$.`,
        p.answer !== `${sec[i].angle}/360` ? `Reduce: $\\frac{${sec[i].angle}}{360} = ${tex(p.answer)}$.` : `Already in lowest terms.`,
      ],
      concept: "Spinner probability = angle/360",
      hint1: "The whole circle is 360° — that's the total.",
      hint2: "Sector angle over 360, then reduce.",
      mistake: "Bigger angle = bigger chance, but the denominator is always 360°.",
      verify: `Sector angles sum to $${sec.reduce((a, s) => a + s.angle, 0)}^\\circ = 360^\\circ$ ✓`,
      remember: "P(sector) = its angle ÷ 360.",
    });
  }
  if (d === 2) {
    const e = SPIN8[r.int(0, 5)];
    const p = pAns(e.set.length, 8);
    const certain = e.set.length === 8;
    return baseQ({
      diff: d,
      text: `A game spinner has $8$ equal sectors numbered $1$–$8$; the arrow is equally likely to stop on any number. Find the probability that it points at ${e.label}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Sample space: $S = \\{1, 2, 3, 4, 5, 6, 7, 8\\}$, $n(S) = 8$.`,
        `Favourable numbers: ${setStr(e.set)} — $${e.set.length}$ of them.`,
        certain ? `Every number is favourable, so the event is CERTAIN: $P = 1$.` : `$P = \\frac{${e.set.length}}{8}${p.answer !== `${e.set.length}/8` ? ` = ${p.answer.includes("/") ? `\\frac{${p.answer.split("/")[0]}}{${p.answer.split("/")[1]}}` : ""}` : ""}$.`,
      ],
      concept: "Equally likely numbered spinner",
      hint1: "List which numbers 1–8 satisfy the condition.",
      hint2: `Count them, divide by 8.`,
      mistake: "“Less than 9” catches ALL numbers — a certain event has probability 1.",
      remember: "Equal sectors → P(event) = (how many numbers) ÷ 8.",
    });
  }
  if (d === 3) {
    const sec = angleSectors(r, 5);
    const i = r.int(0, 4);
    const j = (i + r.int(1, 4)) % 5;
    const p = pAns(sec[i].angle + sec[j].angle, 360);
    return baseQ({
      diff: d,
      text: `A spinner is divided into $5$ sectors: ${angleList(sec)}. Find the probability that one spin lands on ${sec[i].name} OR ${sec[j].name}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `P(${sec[i].name}) $= \\frac{${sec[i].angle}}{360}$ and P(${sec[j].name}) $= \\frac{${sec[j].angle}}{360}$.`,
        `The two sectors cannot overlap, so add the angles: $${sec[i].angle}^\\circ + ${sec[j].angle}^\\circ = ${sec[i].angle + sec[j].angle}^\\circ$.`,
        `$P = \\frac{${sec[i].angle + sec[j].angle}}{360}$.`,
        p.answer !== `${sec[i].angle + sec[j].angle}/360` ? `Reduce: $= ${tex(p.answer)}$.` : `Already in lowest terms.`,
      ],
      concept: "Union of disjoint spinner sectors",
      hint1: "“A or B” on one spin = add the two sector angles.",
      hint2: "Then reduce the fraction over 360.",
      mistake: "Don't add the probabilities' denominators — keep 360 below.",
      verify: `Angles sum to $360^\\circ$ ✓`,
      remember: "Disjoint events: P(A or B) = P(A) + P(B).",
    });
  }
  if (r.next() < 0.5) {
    const sec = angleSectors(r, 5);
    const i = r.int(0, 4);
    const rest = 360 - sec[i].angle;
    const p = pAns(rest, 360);
    return baseQ({
      diff: d,
      text: `A spinner is divided into $5$ sectors: ${angleList(sec)}. Find the probability that one spin does NOT land on ${sec[i].name}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `P(${sec[i].name}) $= \\frac{${sec[i].angle}}{360}$.`,
        `Complement rule: $P(\\text{not } ${sec[i].name}) = 1 - \\frac{${sec[i].angle}}{360} = \\frac{${rest}}{360}$.`,
        `Check by angles: the other four sectors hold $${rest}^\\circ$ in total.`,
        p.answer !== `${rest}/360` ? `Reduce: $= ${tex(p.answer)}$.` : `Already in lowest terms.`,
      ],
      concept: "Complement on an angle spinner",
      hint1: "All angles except one.",
      hint2: "360° minus the sector's angle over 360°.",
      mistake: "Subtract the ANGLE from 360, not the fraction from the denominator.",
      remember: "P(not A) = 1 − P(A), on spinners too.",
    });
  }
  const e = SPIN8[r.int(6, 9)];
  const p = pAns(e.set.length, 8);
  const certain = e.set.length === 8;
  return baseQ({
    diff: d,
    text: `A game spinner has $8$ equal sectors numbered $1$–$8$. Find the probability that one spin points at a number that is ${e.label}. (Fraction $a/b$.)`,
    answer: p.answer, accept: p.accept,
    steps: [
      `Sample space: $\\{1, \\ldots, 8\\}$ with $8$ equally likely numbers.`,
      `${e.label.charAt(0).toUpperCase() + e.label.slice(1)}: ${setStr(e.set)} — $${e.set.length}$ number${e.set.length === 1 ? "" : "s"}.`,
      certain ? `All $8$ numbers qualify — the event is certain, so $P = 1$.` : `$P = \\frac{${e.set.length}}{8} = ${p.answer}$.`,
    ],
    concept: "Number-property events on a fair spinner",
    hint1: "Test each number 1–8 against the property.",
    hint2: "Count the survivors, divide by 8.",
    mistake: "1 is a perfect square (1×1) but not prime — check each property carefully.",
    verify: `$0 \\le P \\le 1$ ✓`,
    remember: "Certain events: P = 1. Impossible: P = 0.",
  });
};

// ─── 8. mcq-scale ──────────────────────────────────────────────────────────
const mcqScale: GenFn = (r, d) => {
  if (d === 1) {
    if (r.next() < 0.5) {
      return baseQ({
        diff: d,
        type: "fill",
        text: `A box contains $5$ marbles, ALL of them red. One marble is drawn at random. What is $P(\\text{green})$?`,
        answer: "0",
        steps: [
          `Sample space: every draw gives red — there is no green marble.`,
          `An event that cannot happen is an IMPOSSIBLE event.`,
          `Favourable outcomes $= 0$, so $P(\\text{green}) = \\frac{0}{5} = 0$.`,
        ],
        concept: "Impossible events have probability 0",
        hint1: "How many green marbles are in the box?",
        hint2: "Zero favourable outcomes out of five.",
        mistake: "Probability 0 does not mean “very small” — it means the event cannot happen at all.",
        verify: "$P(\\text{red}) + P(\\text{green}) = 1 + 0 = 1$ ✓",
        remember: "Impossible → P = 0 · Certain → P = 1.",
      });
    }
    return baseQ({
      diff: d,
      type: "fill",
      text: `A box contains $5$ marbles, ALL of them red. One marble is drawn at random. What is $P(\\text{red})$?`,
      answer: "1",
      steps: [
        `Every one of the $5$ marbles is red — the draw MUST be red.`,
        `A sure-to-happen event is a CERTAIN event.`,
        `$P(\\text{red}) = \\frac{5}{5} = 1$.`,
      ],
      concept: "Certain events have probability 1",
      hint1: "Can the draw be anything other than red?",
      hint2: "All 5 outcomes are favourable.",
      mistake: "A certain event is written as 1, not 100 — probability lives on a 0-to-1 scale.",
      verify: "$0 \\le 1 \\le 1$ ✓ and $P(\\text{red}) + P(\\text{green}) = 1$ ✓",
      remember: "Impossible → P = 0 · Certain → P = 1.",
    });
  }
  if (d === 2) {
    const INVALID = ["-0.2", "-\\frac{1}{4}", "\\frac{3}{2}", "1.5", "\\frac{7}{6}", "1.01", "2", "-\\frac{5}{8}", "\\frac{9}{8}", "1.2"];
    const VALID = ["0", "1", "0.5", "\\frac{1}{2}", "0.75", "\\frac{3}{4}", "\\frac{2}{3}", "0.9", "\\frac{1}{4}", "\\frac{5}{6}"];
    const bad = r.pick(INVALID);
    const goods = shuffle(VALID, r).slice(0, 3);
    const opts = shuffle([bad, ...goods], r);
    return baseQ({
      diff: d,
      type: "mcq",
      text: `Which of the following CANNOT be the probability of an event?`,
      choices: opts.map((s) => `$${s}$`),
      answer: `$${bad}$`,
      steps: [
        `A probability always satisfies $0 \\le P(E) \\le 1$.`,
        `$0$ (impossible) and $1$ (certain) are both allowed — the endpoints belong to the scale.`,
        `Every valid fraction must also be at most $1$: $\\frac{3}{4}, \\frac{2}{3}, \\frac{5}{6}$ are fine.`,
        `$${bad}$ lies outside $[0, 1]$ (negative, or greater than $1$), so it cannot be a probability.`,
      ],
      concept: "The probability scale 0 ≤ P(E) ≤ 1",
      hint1: "Probabilities live strictly inside [0, 1] — including 0 and 1 themselves.",
      hint2: "Reject anything negative or bigger than 1.",
      mistake: "0 and 1 ARE valid probabilities — don't reject the endpoints!",
      verify: `Only one option falls outside $[0,1]$ ✓`,
      remember: "If P < 0 or P > 1, it is not a probability.",
    });
  }
  if (d === 3 || d === 4) {
    const twoDice = d === 4;
    const pool = twoDice
      ? [
          { label: "the sum is $7$", fav: 6 },
          { label: "the sum is $9$", fav: 4 },
          { label: "the sum is $11$", fav: 2 },
          { label: "the sum is $5$", fav: 4 },
          { label: "the sum is $3$", fav: 2 },
          { label: "the sum is $12$", fav: 1 },
          { label: "both dice show the same number", fav: 6 },
        ]
      : [
          { label: "rolling an even number", fav: 3 },
          { label: "rolling a prime number", fav: 3 },
          { label: "rolling a number greater than $4$", fav: 2 },
          { label: "rolling at most $2$", fav: 2 },
          { label: "rolling a multiple of $3$", fav: 2 },
          { label: "rolling a $6$", fav: 1 },
          { label: "rolling a number less than $3$", fav: 2 },
        ];
    let trio = [pool[0], pool[2], pool[5]];
    for (let t = 0; t < 30; t++) {
      trio = shuffle(pool, r).slice(0, 3);
      if (new Set(trio.map((e) => e.fav)).size === 3) break;
    }
    const total = twoDice ? 36 : 6;
    const probs = trio.map((e) => red(e.fav, total));
    const maxI = probs.findIndex((p) => p === red(Math.max(...trio.map((e) => e.fav)), total));
    const letters = ["A", "B", "C"];
    const opts = [...letters.map((L, i) => `$${L}$: ${trio[i].label}`), "They are all equally likely"];
    const ansOpt = opts[maxI];
    return baseQ({
      diff: d,
      type: "mcq",
      text: twoDice
        ? `Two fair dice are rolled. Compare these events and pick the MOST likely one:`
        : `A fair die is rolled once. Compare these events and pick the MOST likely one:`,
      choices: opts,
      answer: ansOpt,
      steps: [
        ...trio.map((e, i) => `$${letters[i]}$: ${e.label} → $P = \\frac{${e.fav}}{${total}} = ${tex(probs[i])}$.`),
        `On the common total $${total}$, order the events by numerator: ${trio.map((e, i) => ({ l: letters[i], f: e.fav, p: probs[i] })).sort((x, y) => y.f - x.f).map((o) => `${o.l} (${o.p})`).join(" > ")}.`,
        `The largest probability is $${tex(probs[maxI])}$, so event $${letters[maxI]}$ is the most likely.`,
      ],
      concept: "Comparing probabilities to order likelihood",
      hint1: "Compute P for each event over the same total.",
      hint2: "Bigger fraction = more likely.",
      mistake: "Don't judge by wording like “sum is 7 is famous” — compare the actual fractions.",
      verify: `Exactly one event carries the maximum probability ✓`,
      remember: "To compare events, put their probabilities on a common footing and compare.",
    });
  }
  return baseQ({ diff: d, type: "fill", text: "Impossible", answer: "0", steps: [], concept: "x", hint1: "x", hint2: "x" });
};

// ─── 9. exp-vs-theo ────────────────────────────────────────────────────────
const expVsTheo: GenFn = (r, d) => {
  if (d === 1) {
    const n = r.pick([20, 40, 50, 100, 200]);
    const f = r.int(Math.floor(n * 0.35), Math.ceil(n * 0.65));
    const p = pAns(f, n);
    return baseQ({
      diff: d,
      text: `A coin was tossed $${n}$ times and heads came up $${f}$ times. What is the EXPERIMENTAL probability of heads? (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Experimental probability = (times the event occurred) ÷ (total trials).`,
        `Heads occurred $${f}$ times in $${n}$ tosses: $P_{\\text{exp}}(H) = \\frac{${f}}{${n}}$.`,
        `Reduced: $${tex(p.answer)}$.`,
        `The theoretical value is $\\frac{1}{2}$ — small samples wobble around it, and more tosses pull the frequency closer.`,
      ],
      concept: "Experimental probability as relative frequency",
      hint1: "It's just observed heads over total tosses.",
      hint2: `Divide ${f} by ${n} and reduce.`,
      mistake: "Don't answer 1/2 here — that's the theoretical value, not the experimental one.",
      verify: `$0 \\le \\frac{${f}}{${n}} \\le 1$ ✓`,
      remember: "P(experimental) = successes ÷ trials.",
    });
  }
  if (d === 2) {
    const n = r.pick([30, 60, 90, 120, 150]);
    const k = r.int(1, 6);
    const f = r.int(Math.max(1, Math.floor(n * 0.08)), Math.min(n - 1, Math.ceil(n * 0.3)));
    const p = pAns(f, n);
    return baseQ({
      diff: d,
      text: `A die was rolled $${n}$ times and the face $${k}$ appeared $${f}$ times. Find the experimental probability of rolling a $${k}$. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Relative frequency: $P_{\\text{exp}}(${k}) = \\frac{\\text{times it occurred}}{\\text{total rolls}} = \\frac{${f}}{${n}}$.`,
        `Reduced: $${tex(p.answer)}$.`,
        `The theoretical probability of any face is $\\frac{1}{6} \\approx 0.167$; the experimental value $\\approx ${decOf(f, n) ?? (f / n).toFixed(3)}$ hovers near it.`,
      ],
      concept: "Experimental vs theoretical probability for a die",
      hint1: "Observed count over total rolls.",
      hint2: `Reduce ${f}/${n} with the GCD.`,
      mistake: "The denominator is the number of ROLLS, not 6.",
      remember: "Experiment measures what DID happen; theory predicts what SHOULD happen.",
    });
  }
  if (d === 3) {
    const fruits = ["mango", "apple", "banana", "grapes"];
    const N = r.pick([40, 50, 60, 80]);
    const units = N / 5;
    const cuts = new Set<number>();
    while (cuts.size < 3) cuts.add(r.int(1, units - 1));
    const c = [...cuts].sort((x, y) => x - y);
    const segs: number[] = [];
    let prev = 0;
    for (const x of c) { segs.push(x - prev); prev = x; }
    segs.push(units - prev);
    const counts = segs.map((u) => u * 5);
    const ask = r.int(0, 3);
    const p = pAns(counts[ask], N);
    const table = fruits.map((f, i) => `${f}: ${counts[i]}`).join(", ");
    return baseQ({
      diff: d,
      text: `${N} students were asked their favourite fruit. Results: ${table}. One student is picked at random from this group. Find the probability that their favourite fruit is ${fruits[ask]}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `Total students surveyed: $N = ${N}$.`,
        `Students favouring ${fruits[ask]}: $${counts[ask]}$.`,
        `$P = \\frac{${counts[ask]}}{${N}}$ — a statistical estimate from the sample data.`,
        p.answer !== `${counts[ask]}/${N}` ? `Reduced: $\\frac{${counts[ask]}}{${N}} = ${tex(p.answer)}$.` : `Already in lowest terms.`,
      ],
      concept: "Statistical probability from survey data",
      hint1: "The surveyed group IS the sample space.",
      hint2: "Favourable count over N, then reduce.",
      mistake: "Use the group's data, not a 1/4 guess — the four fruits are NOT equally liked here.",
      remember: "P from data = favourable responses ÷ total responses.",
    });
  }
  // d === 4 : estimate for a bigger population
  const N = r.pick([20, 25, 50]);
  const c = r.int(Math.ceil(N / 4), Math.floor(N / 2));
  const m = r.pick([6, 10, 20, 30]);
  const M = N * m;
  return baseQ({
    diff: d,
    type: "numeric",
    text: `In a random sample of $${N}$ students, $${c}$ said mango is their favourite fruit. The school has $${M}$ students in total. Based on the sample, about how many students in the whole school would you expect to love mango?`,
    answer: String(c * m),
    steps: [
      red(c, N) !== `${c}/${N}` ? `Sample estimate: $P(\\text{mango}) = \\frac{${c}}{${N}} = ${tex(red(c, N))}$.` : `Sample estimate: $P(\\text{mango}) = \\frac{${c}}{${N}}$ (already in lowest terms).`,
      `Scale up: expected count $= P \\times$ population $= \\frac{${c}}{${N}} \\times ${M}$.`,
      `$= \\frac{${c}}{${N}} \\times ${N} \\times ${m} = ${c} \\times ${m} = ${c * m}$.`,
      `So roughly $${c * m}$ students of the school should prefer mango — a prediction, not a guarantee.`,
    ],
    concept: "Using sample probability to estimate a population",
    hint1: "First get the sample probability as a fraction.",
    hint2: `Multiply it by the school size ${M}.`,
    given: [`Sample size ${N}`, `Mango-lovers in sample: ${c}`, `School size ${M}`],
    find: "Expected number of mango-loving students in the school",
    mistake: "Don't just add the sample numbers — PROPORTION is what scales up.",
    verify: `${c * m} < ${M} ✓ and (${c * m}/${M}) matches the sample ratio ✓`,
    remember: "Big estimate = sample probability × population size.",
  });
};

// ─── 10. word-letters ──────────────────────────────────────────────────────
const wordLetters: GenFn = (r, d) => {
  if (d === 1) {
    const short = WORDS.filter((w) => w.length <= 7);
    const w = r.pick(short);
    const vowels = [...w].filter((ch) => VOWELS.has(ch)).length;
    const askVowel = r.next() < 0.5;
    const fav = askVowel ? vowels : w.length - vowels;
    const p = pAns(fav, w.length);
    return baseQ({
      diff: d,
      text: `A letter is picked at random from the word “${w}”. Find the probability that it is ${askVowel ? "a vowel" : "a consonant"}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: pSteps(fav, w.length, `${askVowel ? "vowels" : "consonants"} in “${w}”: $${fav}$`, `all ${w.length} letter slips`),
      concept: "Letter events in a word",
      hint1: "Vowels are A, E, I, O, U — everything else is a consonant.",
      hint2: `“${w}” has ${w.length} letters.`,
      mistake: "Each letter position is one outcome — repeated letters count again.",
      remember: "P(letter event) = matching slips ÷ total slips.",
    });
  }
  if (d === 2) {
    const w = r.pick(WORDS);
    const distinct = [...new Set([...w])];
    const ch = r.pick(distinct);
    const cnt = [...w].filter((x) => x === ch).length;
    const p = pAns(cnt, w.length);
    return baseQ({
      diff: d,
      text: `The letters of the word “${w}” are written on separate cards and placed in a box. One card is drawn without looking. Find the probability that it shows the letter ${ch}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: pSteps(cnt, w.length, `cards showing ${ch}: $${cnt}$`, `all ${w.length} cards`),
      concept: "Single-letter probability from a word",
      hint1: `Count how many times ${ch} appears in the word.`,
      hint2: `The word has ${w.length} letters, so ${w.length} cards.`,
      mistake: "If the letter appears twice, it gets TWO favourable cards.",
      remember: "P(letter) = occurrences ÷ word length.",
    });
  }
  if (d === 3) {
    const w = r.pick(WORDS.filter((x) => x.length >= 9));
    const vowels = [...w].filter((c) => VOWELS.has(c)).length;
    const cons = w.length - vowels;
    const askNot = r.next() < 0.5;
    const fav = askNot ? cons : vowels;
    const p = pAns(fav, w.length);
    return baseQ({
      diff: d,
      text: `A letter is chosen at random from the word “${w}” (each letter on its own slip). Find the probability that it is ${askNot ? "NOT a vowel" : "a vowel"}. (Fraction $a/b$.)`,
      answer: p.answer, accept: p.accept,
      steps: [
        `“${w}” has $${w.length}$ slips; the vowels are ${[...w].filter((c) => VOWELS.has(c)).join(", ")} — $${vowels}$ of them.`,
        askNot
          ? `Complement: $P(\\text{vowel}) = \\frac{${vowels}}{${w.length}}$, so $P(\\text{not vowel}) = 1 - \\frac{${vowels}}{${w.length}} = \\frac{${cons}}{${w.length}}$.`
          : `$P(\\text{vowel}) = \\frac{${vowels}}{${w.length}}$.`,
        p.answer !== `${fav}/${w.length}` ? `Reduced: $${tex(p.answer)}$.` : `Already in lowest terms.`,
      ],
      concept: "Vowel/consonant probabilities and complements",
      hint1: "Count vowels first; consonants = total − vowels.",
      hint2: "Then reduce the fraction.",
      mistake: "Y is not a vowel in this book's convention — stick to A, E, I, O, U.",
      remember: "P(not vowel) = 1 − P(vowel).",
    });
  }
  // d === 4 : union of two letters
  const w = r.pick(WORDS);
  const distinct = [...new Set([...w])];
  let ci = r.int(0, distinct.length - 1);
  let cj = r.int(0, distinct.length - 1);
  for (let t = 0; t < 20 && (ci === cj || [...w].filter((x) => x === distinct[ci]).length + [...w].filter((x) => x === distinct[cj]).length >= w.length); t++) {
    ci = r.int(0, distinct.length - 1);
    cj = r.int(0, distinct.length - 1);
  }
  if (ci === cj) { cj = (ci + 1) % distinct.length; }
  const L1 = distinct[ci], L2 = distinct[cj];
  const c1 = [...w].filter((x) => x === L1).length;
  const c2 = [...w].filter((x) => x === L2).length;
  const fav = c1 + c2;
  const p = pAns(fav, w.length);
  return baseQ({
    diff: d,
    text: `One letter is drawn at random from the word “${w}”. Find the probability that it is ${L1} or ${L2}. (Fraction $a/b$.)`,
    answer: p.answer, accept: p.accept,
    steps: [
      `Total outcomes: the $${w.length}$ letter slips of “${w}”.`,
      `${L1} appears $${c1}$ time${c1 === 1 ? "" : "s"} and ${L2} appears $${c2}$ time${c2 === 1 ? "" : "s"} — no slip holds both.`,
      `Favourable $= ${c1} + ${c2} = ${fav}$.`,
      `$P = \\frac{${fav}}{${w.length}} = ${tex(p.answer)}$.`,
    ],
    concept: "Union of two letter events (disjoint)",
    hint1: "Count each letter separately, then add.",
    hint2: "A single slip can't be two different letters — no overlap.",
    mistake: "Don't add the denominators; the total stays at the word length.",
    remember: "P(X or Y) = P(X) + P(Y) when X and Y can't happen together.",
  });
};

// ─── 11. tree-count ────────────────────────────────────────────────────────
type TEvent = { label: string; pred: (o: string) => boolean };
const treeCount: GenFn = (r, d) => {
  const coin2 = coinStrings(2);
  const coin3 = coinStrings(3);
  const coinDie = ["H", "T"].flatMap((f) => [1, 2, 3, 4, 5, 6].map((n) => `${f}${n}`));
  const dieDie = dicePairs().map(([a, b]) => `${a}-${b}`);
  const isEven = (x: number) => x % 2 === 0;
  const ctxs = [
    { name: "coin tossed twice", outs: coin2, size: 4, desc: "a coin tossed twice" },
    { name: "coin tossed three times", outs: coin3, size: 8, desc: "a coin tossed three times" },
    { name: "coin tossed and die rolled", outs: coinDie, size: 12, desc: "a coin tossed and a die rolled together" },
    { name: "two dice rolled", outs: dieDie, size: 36, desc: "two dice rolled together" },
    { name: "shirt and pants outfit", outs: ["red+jeans", "red+khakis", "red+shorts", "blue+jeans", "blue+khakis", "blue+shorts"], size: 6, desc: "an outfit chosen from 2 shirts (red, blue) and 3 pants (jeans, khakis, shorts)" },
  ];
  const evs: Record<string, TEvent[]> = {
    "coin tossed twice": [
      { label: "at least one head", pred: (o) => o.includes("H") },
      { label: "exactly one head", pred: (o) => countH(o) === 1 },
      { label: "both faces the same", pred: (o) => o === "HH" || o === "TT" },
    ],
    "coin tossed three times": [
      { label: "exactly two heads", pred: (o) => countH(o) === 2 },
      { label: "at least one tail", pred: (o) => o.includes("T") },
      { label: "all three the same face", pred: (o) => o === "HHH" || o === "TTT" },
      { label: "at least two heads", pred: (o) => countH(o) >= 2 },
    ],
    "coin tossed and die rolled": [
      { label: "heads and an even number", pred: (o) => o[0] === "H" && isEven(Number(o.slice(1))) },
      { label: "tails and a number greater than $4$", pred: (o) => o[0] === "T" && Number(o.slice(1)) > 4 },
      { label: "an even number on the die", pred: (o) => isEven(Number(o.slice(1))) },
      { label: "heads and a prime number", pred: (o) => o[0] === "H" && isPrime(Number(o.slice(1))) },
    ],
    "two dice rolled": [
      { label: "the sum is $7$", pred: (o) => { const [a, b] = o.split("-").map(Number); return a + b === 7; } },
      { label: "doubles (same number on both)", pred: (o) => o[0] === o[2] },
      { label: "at least one six", pred: (o) => o.includes("6") },
      { label: "the first die greater than the second", pred: (o) => { const [a, b] = o.split("-").map(Number); return a > b; } },
      { label: "at least one even number", pred: (o) => { const [a, b] = o.split("-").map(Number); return isEven(a) || isEven(b); } },
      { label: "both dice even", pred: (o) => { const [a, b] = o.split("-").map(Number); return isEven(a) && isEven(b); } },
      { label: "the sum at least $10$", pred: (o) => { const [a, b] = o.split("-").map(Number); return a + b >= 10; } },
    ],
    "shirt and pants outfit": [
      { label: "the red shirt", pred: (o) => o.startsWith("red") },
      { label: "jeans", pred: (o) => o.endsWith("jeans") },
      { label: "the red shirt with jeans", pred: (o) => o === "red+jeans" },
    ],
  };
  if (d === 1) {
    const c = r.pick(ctxs);
    return baseQ({
      diff: d,
      type: "numeric",
      text: `A random experiment consists of ${c.desc}. Draw its tree diagram in your head: how many outcomes are in the complete sample space?`,
      answer: String(c.size),
      steps: [
        `Stage 1 has its own options; stage 2 (and 3) multiply from every branch.`,
        c.name === "two dice rolled"
          ? `Die 1 has $6$ faces and die 2 has $6$ faces: $6 \\times 6 = 36$ ordered outcomes.`
          : c.name === "coin tossed and die rolled"
            ? `Coin: $2$ branches; die: $6$ branches from each: $2 \\times 6 = 12$.`
            : c.name === "coin tossed twice"
              ? `$2 \\times 2 = 4$ outcomes: HH, HT, TH, TT.`
              : c.name === "coin tossed three times"
                ? `$2 \\times 2 \\times 2 = 8$ outcomes.`
                : `Shirts: $2$ options; pants: $3$ options: $2 \\times 3 = 6$ outfits.`,
        `Answer: $n(S) = ${c.size}$.`,
      ],
      concept: "Counting sample spaces of multi-stage experiments",
      hint1: "Multiply the number of options at each stage.",
      hint2: "Every path from root to leaf is ONE outcome.",
      mistake: "Don't add the stage counts — stages multiply.",
      remember: "Stages multiply: a×b×c… paths in a tree.",
    });
  }
  const pool = ctxs.filter((c) => evs[c.name] !== undefined);
  const c = r.pick(
    d === 2
      ? pool.filter((x) => x.name !== "coin tossed three times")
      : d === 4
        ? pool.filter((x) => x.name === "two dice rolled" || x.name === "coin tossed three times")
        : pool.filter((x) => x.name !== "shirt and pants outfit"),
  );
  const e = r.pick(evs[c.name]);
  const fav = c.outs.filter(e.pred);
  if (d === 2) {
    return baseQ({
      diff: d,
      type: "numeric",
      text: `For the experiment “${c.desc}”, how many outcomes of the sample space match the event “${e.label}”? (Hint: draw the tree or table first.)`,
      answer: String(fav.length),
      steps: [
        `The full sample space has $${c.size}$ outcomes (tree diagram).`,
        `Tick every path satisfying “${e.label.replace(/\$/g, "")}”: ${fav.length <= 12 ? setStr(fav) : `${fav.length} paths qualify`}.`,
        `Count: $${fav.length}$ outcomes.`,
      ],
      concept: "Counting favourable paths in a tree diagram",
      hint1: "List the whole sample space first.",
      hint2: "Then keep only the paths matching the event.",
      mistake: "Order matters: HT and TH are two separate paths.",
      remember: "Event = a sub-bundle of the tree's paths.",
    });
  }
  const p = pAns(fav.length, c.size);
  return baseQ({
    diff: d,
    text: `Using a tree diagram for the experiment “${c.desc}”, find $P(E)$ where $E$ is “${e.label}”. (Fraction $a/b$.)`,
    answer: p.answer, accept: p.accept,
    steps: [
      `Tree diagram: the experiment has $${c.size}$ equally likely paths.`,
      `Paths matching $E$: ${fav.length <= 12 ? setStr(fav) : `${fav.length} paths`} — count $${fav.length}$.`,
      `$P(E) = \\frac{${fav.length}}{${c.size}}$.`,
      p.answer !== `${fav.length}/${c.size}` ? `Reduced: $${tex(p.answer)}$.` : `Already in lowest terms.`,
    ],
    concept: "Event probability from a tree diagram",
    hint1: "First build the tree and count all paths.",
    hint2: `Then count the paths that match “${e.label.replace(/\$/g, "")}”.`,
    mistake: "Use the total path count as denominator — not the number of branches at one stage.",
    verify: `$0 \\le \\frac{${fav.length}}{${c.size}} \\le 1$ ✓`,
    remember: "P(event) = matching paths ÷ total paths.",
  });
};

// ─── 12. which-more-likely ─────────────────────────────────────────────────
const whichMoreLikely: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(2, 9), b = r.int(2, 9);
    const opts = ["drawing a red marble", "drawing a blue marble", "they are equally likely"];
    const correct = a > b ? opts[0] : a < b ? opts[1] : opts[2];
    return baseQ({
      diff: d,
      type: "mcq",
      text: `A bag holds $${a}$ red and $${b}$ blue marbles, identical except for colour. One marble is drawn at random. Which is more likely?`,
      choices: opts,
      answer: correct,
      steps: [
        `$P(\\text{red}) = \\frac{${a}}{${a + b}}$ and $P(\\text{blue}) = \\frac{${b}}{${a + b}}$.`,
        `Same denominator, so compare numerators: $${a}$ vs $${b}$.`,
        a === b ? `The counts are equal — both colours have probability $\\frac{${a}}{${a + b}}$, so the draw is fair.` : `Since $${a} ${a > b ? ">" : "<"} ${b}$, drawing ${a > b ? "red" : "blue"} has the larger probability.`,
      ],
      concept: "Comparing likelihoods via probabilities",
      hint1: "Write both probabilities over the same total.",
      hint2: "Bigger numerator wins (with equal totals).",
      mistake: "“Red is written first” means nothing — only the counts matter.",
      verify: `$P(\\text{red}) + P(\\text{blue}) = 1$ ✓`,
      remember: "More marbles of a colour → more likely — proportional, not preferential.",
    });
  }
  if (d === 2 || d === 3) {
    const twoDice = d === 3;
    const pool = twoDice
      ? [
          { label: "the sum is $7$", fav: 6 },
          { label: "the sum is $9$", fav: 4 },
          { label: "the sum is $11$", fav: 2 },
          { label: "the sum is $5$", fav: 4 },
          { label: "the sum is $3$", fav: 2 },
          { label: "the sum is $12$", fav: 1 },
          { label: "the sum is $2$", fav: 1 },
        ]
      : [
          { label: "rolling an even number", fav: 3 },
          { label: "rolling a prime number", fav: 3 },
          { label: "rolling a number greater than $4$", fav: 2 },
          { label: "rolling at most $2$", fav: 2 },
          { label: "rolling a multiple of $3$", fav: 2 },
          { label: "rolling a $6$", fav: 1 },
        ];
    let trio = [pool[0], pool[2], pool[5]];
    for (let t = 0; t < 30; t++) {
      trio = shuffle(pool, r).slice(0, 3);
      if (new Set(trio.map((e) => e.fav)).size === 3) break;
    }
    const total = twoDice ? 36 : 6;
    const probs = trio.map((e) => red(e.fav, total));
    const maxFav = Math.max(...trio.map((e) => e.fav));
    const maxI = trio.findIndex((e) => e.fav === maxFav);
    const L = ["A", "B", "C"];
    const opts = [...L.map((l, i) => `$${l}$: ${trio[i].label}`), "They are all equally likely"];
    const ansOpt = opts[maxI];
    return baseQ({
      diff: d,
      type: "mcq",
      text: twoDice
        ? `Two fair dice are rolled. Three friends back different events: which friend has the BEST odds?`
        : `A fair die is rolled once. Three friends back different events: which friend has the BEST odds?`,
      choices: opts,
      answer: ansOpt,
      steps: [
        ...trio.map((e, i) => `$${L[i]}$: ${e.label} → $P = \\frac{${e.fav}}{${total}} = ${tex(probs[i])}$.`),
        `On the common total $${total}$, order the events by numerator: ${trio.map((e, i) => ({ l: L[i], f: e.fav, p: probs[i] })).sort((x, y) => y.f - x.f).map((o) => `${o.l} (${o.p})`).join(" > ")}.`,
        `Best odds: $${tex(probs[maxI])}$ — event $${L[maxI]}$.`,
      ],
      concept: "Which event is more likely — comparing fractions",
      hint1: "Convert every event to a probability first.",
      hint2: "Compare the fractions over the same total.",
      mistake: "A bigger-sounding description isn't a bigger chance — sums of 2 are the RAREST, not common.",
      verify: `One event strictly beats the others ✓`,
      remember: "Best odds = biggest P — always check by computing.",
    });
  }
  // d === 4 : three-colour bag
  let cc = [5, 3, 2];
  for (let t = 0; t < 30; t++) {
    cc = [r.int(2, 8), r.int(2, 8), r.int(2, 8)];
    const m = Math.max(...cc);
    if (cc.filter((x) => x === m).length === 1) break;
  }
  const tot = cc[0] + cc[1] + cc[2];
  const maxI = cc.indexOf(Math.max(...cc));
  const names = ["red", "blue", "green"];
  const opts = [...names.map((n) => `drawing a ${n} marble`), "all three colours are equally likely"];
  const ansOpt = opts[maxI];
  return baseQ({
    diff: d,
    type: "mcq",
    text: `A bag contains $${cc[0]}$ red, $${cc[1]}$ blue and $${cc[2]}$ green marbles. One marble is drawn at random. Which statement is true?`,
    choices: opts,
    answer: ansOpt,
    steps: [
      `Total marbles: $${tot}$.`,
      `P(red) $= \\frac{${cc[0]}}{${tot}}$, P(blue) $= \\frac{${cc[1]}}{${tot}}$, P(green) $= \\frac{${cc[2]}}{${tot}}$.`,
      `Largest count → largest probability: ${names[maxI]} with $${cc[maxI]}$ marbles.`,
      `The three are ${new Set(cc).size === 1 ? "" : "not "}equally likely.`,
    ],
    concept: "Comparing three event probabilities",
    hint1: "Same denominator for all three — compare the counts.",
    hint2: "The most numerous colour is the most likely draw.",
    mistake: "“Equally likely” needs EQUAL counts — nearly equal is not equal.",
    verify: `$\\frac{${cc[0]}}{${tot}} + \\frac{${cc[1]}}{${tot}} + \\frac{${cc[2]}}{${tot}} = 1$ ✓`,
    remember: "Likelihood tracks the counts when the total is shared.",
  });
};

// ─── bank ──────────────────────────────────────────────────────────────────
export const bank: Record<string, GenFn> = {
  "simple-dice": simpleDice,
  "simple-coin": simpleCoin,
  "coin-atleast": simpleCoinHard,
  "complement": complement,
  "sum-two-dice": sumTwoDice,
  "marble-bag": marbleBag,
  "cards-lite": cardsLite,
  "spinner": spinner,
  "mcq-scale": mcqScale,
  "exp-vs-theo": expVsTheo,
  "word-letters": wordLetters,
  "tree-count": treeCount,
  "which-more-likely": whichMoreLikely,
};

// Honest distinct-question parameter space per generator.
export const bankSize: Record<string, number> = {
  // simple-dice: d1 6 faces; d2 6 fixed + 4 threshold families (4+5+4+4) = 23; d3 8 combos; d4 7 die-complements + 40 coprime (a,b) pairs (b∈5..12)
  "simple-dice": 6 + 23 + 8 + 47,
  // simple-coin: d1 2 faces; d2 7 events; d3 7 events; d4 (coin-atleast) 2 lengths × 2 faces
  "simple-coin": 2 + 7 + 7,
  "coin-atleast": 4,
  // complement: d1 6; d2 40 coprime pairs; d3 12 words + 3 deck + 2 spinner; d4 5 games
  "complement": 6 + 40 + 17 + 5,
  // sum-two-dice: d1 11 sums; d2 11 + even/odd/doubles; d3 4+5+prime; d4 4 products + 4 diffs + odd/odd + even-product + ace-six + doubles
  "sum-two-dice": 11 + 14 + 10 + 12,
  // marble-bag: d1 5×5×2; d2 6³×3; d3 6³×6; d4 6³×(4 adds×3 + 2 removals×~2)
  "marble-bag": 50 + 648 + 648 * 6 / 6 + 648 + 2592,
  // cards-lite: 5 + 6 + 5 + 6 deck events
  "cards-lite": 22,
  // spinner: d1 C(23,3)=1771 cut-sets × 4 sectors; d2 6 numbered events; d3 C(23,4)=8855 × 10 pairs; d4 8855×5 complements + 4 numbered-hard
  "spinner": 1771 * 4 + 6 + 8855 * 10 + 8855 * 5 + 4,
  // mcq-scale: d1 2; d2 10 invalid × C(10,3)=120 valid-triples; d3 60 ordered die-triples; d4 ~32 sum-triples
  "mcq-scale": 2 + 1200 + 60 + 32,
  // exp-vs-theo: d1 Σ f-ranges over n∈{20,40,50,100,200} ≈ 253; d2 5n × 6 faces × f-range ≈ 2250; d3 739 fruit count-vectors × 4 asks; d4 25 samples × 4 scales
  "exp-vs-theo": 253 + 2250 + 2956 + 100,
  // word-letters: 12 words × (2 + letters + 2 + C(letters,2)) ≈ 12 × ~28
  "word-letters": 336,
  // tree-count: d1 5 spaces; d2 12 events; d3 12 events; d4 8 hard events
  "tree-count": 37,
  // which-more-likely: d1 8×8 bags; d2 60 die-triples; d3 32 sum-triples; d4 ~205 unique-max triples
  "which-more-likely": 64 + 60 + 32 + 205,
};
